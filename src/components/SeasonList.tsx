import {
  View,
  Text,
  Animated,
  Platform,
  UIManager,
  LayoutAnimation,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Link} from '../lib/getInfo';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {EpisodeLink, getEpisodeLinks} from '../lib/getEpisodesLink';
import {MotiView} from 'moti';
import {Skeleton} from 'moti/skeleton';
import {RootStackParamList} from '../App';
import Downloader from './Downloader';
import {MmmkvCache} from '../App';

const SeasonList = ({
  LinkList,
  poster,
  title,
}: {
  LinkList: Link[];
  poster: string;
  title: string;
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [acc, setAcc] = useState<string>('');
  const [actEp, setActEp] = useState<string>('');
  const [episodeList, setEpisodeList] = useState<EpisodeLink[]>([]);
  const [episodeLoading, setEpisodeLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchList = async () => {
      if (!actEp) return;
      setEpisodeLoading(true);
      const cacheEpisodes = await MmmkvCache.getItem(actEp);
      if (cacheEpisodes) {
        setEpisodeList(JSON.parse(cacheEpisodes as string));
        console.log('cache', JSON.parse(cacheEpisodes as string));
        setEpisodeLoading(false);
      }
      const episodes = await getEpisodeLinks(actEp);
      if (episodes.length === 0) return;
      MmmkvCache.setItem(actEp, JSON.stringify(episodes));
      // console.log(episodes);
      setEpisodeList(episodes);
      setEpisodeLoading(false);
    };
    fetchList();
  }, [actEp]);

  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  return (
    <MotiView
      animate={{backgroundColor: '#0000'}}
      delay={0}
      //@ts-ignore
      transition={{
        type: 'timing',
      }}>
      <Text className="text-white text-lg font-semibold mb-2">Streams</Text>
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {LinkList.map((link, i) => (
          <View
            className="bg-quaternary min-w-full p-2 rounded-md"
            key={link.title + i}>
            <Pressable
              className="text-white font-medium px-1 gap-1"
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setAcc(acc === link.title ? '' : link.title);
                setActEp(link.episodesLink || '');
                actEp === link.episodesLink ? '' : setEpisodeList([]);
              }}>
              <Text className="text-primary">
                {link.title.match(
                  /^(?:\[?[^\[\{]+)(?=\{[^\}]+\}|\[[^\]]+\]|$)/,
                )?.[0]?.length! > 0
                  ? link.title.match(
                      /^(?:\[?[^\[\{]+)(?=\{[^\}]+\}|\[[^\]]+\]|$)/,
                    )?.[0]
                  : link.title}
              </Text>
              <View className="flex-row items-center flex-wrap gap-1">
                <Text className="text-xs">
                  {link.title.match(/{([^}]+)}/)?.[1] ||
                    link.title.match(/\[([^\]]+)\]/)?.[1]}
                </Text>
                <Text className="text-xs">
                  {'•'}
                  {link.title.match(/(\d+(?:\.\d+)?)([KMGT]B(?:\/E)?)/g)?.[0]}
                </Text>
                <Text className="text-xs">
                  {'•'}
                  {link.title.match(/\d+p\b/)?.[0]}
                </Text>
              </View>
            </Pressable>
            <Animated.ScrollView
              style={{
                maxHeight: acc === link.title ? '100%' : 0,
                minHeight: acc === link.title ? 120 : 0,
                overflow: 'hidden',
              }}>
              <View className="w-full justify-center items-center gap-y-2 mt-3 p-2">
                {!episodeLoading &&
                  episodeList?.length > 0 &&
                  episodeList?.map((episode, i) => (
                    <View
                      key={episode.link + i}
                      className="w-full justify-center items-center gap-2 flex-row">
                      <View className="flex-row w-full justify-between gap-2 items-center">
                        <TouchableOpacity
                          className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                          onPress={() =>
                            navigation.navigate('Player', {
                              link: episode.link,
                              type: 'series',
                              title: title,
                              file:
                                link.title
                                  .replaceAll(' ', '_')
                                  .replaceAll('/', '') +
                                episode.title.replaceAll(' ', '_') +
                                '.mkv',
                              poster: poster,
                            })
                          }>
                          <Ionicons
                            name="play-circle"
                            size={28}
                            color="tomato"
                          />
                          <Text className="text-white">{episode.title}</Text>
                        </TouchableOpacity>
                        <Downloader
                          link={episode.link}
                          type="series"
                          fileName={
                            link.title
                              .replaceAll(' ', '_')
                              .replaceAll('/', '') +
                            episode.title.replaceAll(' ', '_') +
                            '.mkv'
                          }
                        />
                      </View>
                    </View>
                  ))}
                {episodeLoading &&
                  [...Array(5).keys()].map(i => (
                    <View
                      key={'itm' + i}
                      style={{width: '100%', alignItems: 'center'}}>
                      <Skeleton colorMode={'dark'} width={'90%'} height={48} />
                    </View>
                  ))}
              </View>
              {link.movieLinks && (
                <View className="w-full justify-center items-center p-2 gap-2 flex-row">
                  <View className="flex-row w-full justify-between gap-2 items-center">
                    <TouchableOpacity
                      className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                      onPress={() =>
                        navigation.navigate('Player', {
                          link: link.movieLinks,
                          type: 'movie',
                          title: title,
                          file: link.title.replaceAll(' ', '_') + '.mkv',
                          poster: poster,
                        })
                      }>
                      <Ionicons name="play-circle" size={28} color="tomato" />
                      <Text className="text-white">Play</Text>
                    </TouchableOpacity>
                    <Downloader
                      link={link.movieLinks}
                      type="movie"
                      fileName={link.title.replaceAll(' ', '_') + '.mkv'}
                    />
                  </View>
                </View>
              )}
            </Animated.ScrollView>
          </View>
        ))}
        {LinkList.length === 0 && (
          <Text className="text-white text-lg font-semibold min-h-20">
            No Streams Available
          </Text>
        )}
      </View>
    </MotiView>
  );
};

export default SeasonList;
