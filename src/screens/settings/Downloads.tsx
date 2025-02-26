import {View, Text, Image, Platform, TouchableOpacity} from 'react-native';
import requestStoragePermission from '../../lib/file/getStoragePermission';
import * as FileSystem from 'expo-file-system';
import {downloadFolder} from '../../lib/constants';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, {useState, useEffect} from 'react';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import useThemeStore from '../../lib/zustand/themeStore';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {FlashList} from '@shopify/flash-list';

// Define supported video extensions
const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
];

const isVideoFile = (filename: string): boolean => {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(extension);
};

// Add this interface after the existing imports
interface MediaGroup {
  title: string;
  episodes: FileSystem.FileInfo[];
  thumbnail?: string;
  isMovie: boolean;
}

const getBaseName = (fileName: string): string => {
  // Remove episode numbers and extensions to get base name
  return fileName
    .replace(/\.(mp4|mkv|avi|mov)$/i, '')  // remove extension
    .replace(/[\s-]*(?:episode|ep)[\s-]*\d+/gi, '') // remove episode indicators
    .replace(/\s*-\s*\d+/, '')  // remove trailing numbers
    .replace(/\s*\d+\s*$/, '')  // remove ending numbers
    .trim();
};

const getEpisodeNumber = (fileName: string): number => {
  const match = 
    fileName.match(/(?:episode|ep)[\s-]*(\d+)/i) ||
    fileName.match(/[\s-](\d+)(?:\s*$|\s*\.)/);
  return match ? parseInt(match[1]) : 0;
};

const Downloads = () => {
  const [files, setFiles] = useState<FileSystem.FileInfo[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const {primary} = useThemeStore(state => state);

  const [groupSelected, setGroupSelected] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Load files from the download folder on initial render
  useEffect(() => {
    const getFiles = async () => {
      setLoading(true);
      const granted = await requestStoragePermission();
      if (granted) {
        try {
          const properPath =
            Platform.OS === 'android'
              ? `file://${downloadFolder}`
              : downloadFolder;

          const allFiles = await FileSystem.readDirectoryAsync(properPath);

          // Filter video files
          const videoFiles = allFiles.filter(file => isVideoFile(file));

          const filesInfo = await Promise.all(
            videoFiles.map(async file => {
              const filePath =
                Platform.OS === 'android'
                  ? `file://${downloadFolder}/${file}`
                  : `${downloadFolder}/${file}`;

              const fileInfo = await FileSystem.getInfoAsync(filePath);
              return fileInfo;
            }),
          );
          MmmkvCache.setString('downloadFiles', JSON.stringify(filesInfo));
          setFiles(filesInfo);
          setLoading(false);
        } catch (error) {
          console.error('Error reading files:', error);
          setLoading(false);
        }
      }
    };
    getFiles();
  }, []);

  async function getThumbnail(file: FileSystem.FileInfo) {
    try {
      // Verify it's a video file before attempting to generate thumbnail
      const fileName = file.uri.split('/').pop();
      if (!fileName || !isVideoFile(fileName)) {
        return null;
      }

      const {uri} = await VideoThumbnails.getThumbnailAsync(file.uri, {
        time: 100000,
      });
      return uri;
    } catch (error) {
      console.log('error in getThumbnail:', error);
      return null;
    }
  }

  // Generate thumbnails for each file
  useEffect(() => {
    const getThumbnails = async () => {
      try {
        const thumbnailPromises = files.map(async file => {
          const thumbnail = await getThumbnail(file);
          if (thumbnail) {
            return {[file.uri]: thumbnail};
          }
          return null;
        });

        const thumbnailResults = await Promise.all(thumbnailPromises);
        const newThumbnails = thumbnailResults.reduce((acc, curr) => {
          return curr ? {...acc, ...curr} : acc;
        }, {});
        MmmkvCache.setString(
          'downloadThumbnails',
          JSON.stringify(newThumbnails),
        );
        setThumbnails(newThumbnails);
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      }
    };

    if (files.length > 0) {
      getThumbnails();
    }
  }, [files]);

  // Load files and thumbnails from cache on initial render
  useEffect(() => {
    const downloadFiles = MmmkvCache.getString('downloadFiles');
    if (downloadFiles) {
      setFiles(JSON.parse(downloadFiles));
    }
    const downloadThumbnails = MmmkvCache.getString('downloadThumbnails');
    if (downloadThumbnails) {
      setThumbnails(JSON.parse(downloadThumbnails));
    }
  }, []);

  const deleteFiles = async () => {
    try {
      // Process each file
      await Promise.all(
        groupSelected.map(async fileUri => {
          try {
            // Remove the 'file://' prefix for Android
            const path =
              Platform.OS === 'android'
                ? fileUri.replace('file://', '')
                : fileUri;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              await RNFS.unlink(path);
            }
          } catch (error) {
            console.error(`Error deleting file ${fileUri}:`, error);
            throw error; // Re-throw to be caught by the outer try-catch
          }
        }),
      );

      // Update state after successful deletion
      const newFiles = files.filter(file => !groupSelected.includes(file.uri));
      setFiles(newFiles);
      setGroupSelected([]);
      setIsSelecting(false);

      // Optional: Show success message
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  // Add this function to group files by series name
  const groupMediaFiles = (): MediaGroup[] => {
    const groups: Record<string, MediaGroup> = {};
    
    // First pass: Group by base name
    files.forEach(file => {
      const fileName = file.uri.split('/').pop() || '';
      const baseName = getBaseName(fileName);
      
      if (!groups[baseName]) {
        groups[baseName] = {
          title: baseName,
          episodes: [],
          thumbnail: thumbnails[file.uri],
          isMovie: true // We'll update this in second pass
        };
      }
      groups[baseName].episodes.push(file);
    });

    // Second pass: Determine if each group is a movie or series
    Object.values(groups).forEach(group => {
      // Check if any file in the group has episode indicators
      const hasEpisodeIndicators = group.episodes.some(file => {
        const fileName = file.uri.split('/').pop() || '';
        return getEpisodeNumber(fileName) > 0;
      });

      // Mark as series if multiple episodes or has episode indicators
      group.isMovie = !(group.episodes.length > 1 || hasEpisodeIndicators);
      
      // Sort episodes by episode number if it's a series
      if (!group.isMovie) {
        group.episodes.sort((a, b) => {
          const aName = a.uri.split('/').pop() || '';
          const bName = b.uri.split('/').pop() || '';
          return getEpisodeNumber(aName) - getEpisodeNumber(bName);
        });
      }
    });

    return Object.values(groups);
  };

  return (
    <View className="mt-14 px-2 w-full h-full">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl">Downloads</Text>
        <View className="flex-row gap-x-7 items-center">
          {isSelecting && (
            <MaterialCommunityIcons
              name="close"
              size={28}
              color={primary}
              onPress={() => {
                setGroupSelected([]);
                setIsSelecting(false);
              }}
            />
          )}
          {isSelecting && groupSelected.length > 0 && (
            <MaterialCommunityIcons
              name="delete-outline"
              size={28}
              color={primary}
              onPress={deleteFiles}
            />
          )}
        </View>
      </View>

      <FlashList
        data={groupMediaFiles()}
        numColumns={3}
        estimatedItemSize={150}
        ListEmptyComponent={() => (
          !loading && (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-center text-lg">Looks Empty Here!</Text>
            </View>
          )
        )}
        renderItem={({item}) => (
          <TouchableOpacity
            className={`flex-1 m-0.5 rounded-lg overflow-hidden ${
              isSelecting && groupSelected.includes(item.episodes[0].uri)
                ? 'bg-quaternary'
                : 'bg-tertiary'
            }`}
            onLongPress={() => {
              if (MMKV.getBool('hapticFeedback') !== false) {
                RNReactNativeHapticFeedback.trigger('effectTick', {
                  enableVibrateFallback: true,
                  ignoreAndroidSystemSettings: false,
                });
              }
              setGroupSelected(item.episodes.map(ep => ep.uri));
              setIsSelecting(true);
            }}
            onPress={() => {
              if (isSelecting) {
                if (MMKV.getBool('hapticFeedback') !== false) {
                  RNReactNativeHapticFeedback.trigger('effectTick', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                }
                if (groupSelected.includes(item.episodes[0].uri)) {
                  setGroupSelected(groupSelected.filter(f => f !== item.episodes[0].uri));
                } else {
                  setGroupSelected([...groupSelected, item.episodes[0].uri]);
                }
                if (groupSelected.length === 1 && groupSelected[0] === item.episodes[0].uri) {
                  setIsSelecting(false);
                  setGroupSelected([]);
                }
              } else {
                // Direct play for movies, navigate to episodes for series
                if (item.isMovie) {
                  const file = item.episodes[0];
                  const fileName = file.uri.split('/').pop() || '';
                  navigation.navigate('Player', {
                    episodeList: [{title: fileName, link: file.uri}],
                    linkIndex: 0,
                    type: '',
                    directUrl: file.uri,
                    primaryTitle: item.title,
                    poster: {},
                    providerValue: 'vega',
                  });
                } else {
                  navigation.navigate('SeriesEpisodes', {
                    series: item.title,
                    episodes: item.episodes,
                    thumbnails: thumbnails,
                  });
                }
              }
            }}>
            <View className="relative aspect-[2/3]">
              {item.thumbnail ? (
                <Image
                  source={{uri: item.thumbnail}}
                  className="w-full h-full rounded-t-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-quaternary rounded-t-lg" />
              )}
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                <Text className="text-white text-xs" numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.isMovie && (
                  <Text className="text-white text-xs opacity-70">
                    {item.episodes.length} episodes
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default Downloads;
