import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  TouchableNativeFeedback,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import React from 'react';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useContentStore from '../../lib/zustand/contentStore';
import {providersList, socialLinks} from '../../lib/constants';
import {startActivityAsync, ActivityAction} from 'expo-intent-launcher';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../App';
import {
  MaterialCommunityIcons,
  AntDesign,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import {SvgUri} from 'react-native-svg';


type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

const Settings = ({navigation}: Props) => {
  const {primary} = useThemeStore(state => state);
  const {provider, setProvider} = useContentStore(state => state);
  const {clearHistory} = useWatchHistoryStore(state => state);

  const renderProviderIcon = (uri: string) => (
    <Text>
      <SvgUri width={28} height={28} uri={uri} />
    </Text>
  );

  const renderProviderItem = (item: any, isSelected: boolean) => (
    <TouchableOpacity
      key={item.value}
      onPress={() => {
        setProvider(item);
        // Add haptic feedback
        if (MMKV.getBool('hapticFeedback') !== false) {
          ReactNativeHapticFeedback.trigger('virtualKey', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        }
        // Navigate to home screen
        navigation.navigate('HomeStack');
      }}
      className={`mr-3 rounded-lg ${
        isSelected ? 'bg-[#333333]' : 'bg-[#262626]'
      }`}
      style={{
        width: Dimensions.get('window').width * 0.3, // Shows 2.5 items
        height: 65, // Increased height
        borderWidth: 1.5,
        borderColor: isSelected ? primary : '#333333',
      }}>
      <View className="flex-col items-center justify-center h-full p-2">
        {renderProviderIcon(item.flag)}
        <Text numberOfLines={1} className="text-white text-xs font-medium text-center mt-2">
          {item.name}
        </Text>
        {isSelected && (
          <Text style={{ position: 'absolute', top: 6, right: 6 }}>
            <MaterialIcons name="check-circle" size={16} color={primary} />
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="w-full h-full bg-black" 
      contentContainerStyle={{
        paddingTop: StatusBar.currentHeight || 0
      }}>
      <View className="p-5">
        <Text className="text-2xl font-bold text-white mb-6">Settings</Text>
        
        {/* Content provider section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-1">Content Provider</Text>
          <View className="bg-[#1A1A1A] rounded-xl py-4">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 10,
              }}>
              {providersList.map(item => 
                renderProviderItem(item, provider.value === item.value)
              )}
            </ScrollView>
          </View>
        </View>

        {/* Main options section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-3">Options</Text>
          <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
            {/* Downloads */}
            <TouchableNativeFeedback
              onPress={() => navigation.navigate('Downloads')}
              background={TouchableNativeFeedback.Ripple('#333333', false)}>
              <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="folder-download" size={22} color={primary} />
                  <Text className="text-white ml-3 text-base">Downloads</Text>
                </View>
                <Feather name="chevron-right" size={20} color="gray" />
              </View>
            </TouchableNativeFeedback>

            {/* Subtitle Style */}
            <TouchableNativeFeedback
              onPress={async () => {
                if (MMKV.getBool('hapticFeedback') !== false) {
                  ReactNativeHapticFeedback.trigger('virtualKey', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                }
                await startActivityAsync(ActivityAction.CAPTIONING_SETTINGS);
              }}
              background={TouchableNativeFeedback.Ripple('#333333', false)}>
              <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="subtitles" size={22} color={primary} />
                  <Text className="text-white ml-3 text-base">Subtitle Style</Text>
                </View>
                <Feather name="chevron-right" size={20} color="gray" />
              </View>
            </TouchableNativeFeedback>

            {/* Disable Providers */}
            <TouchableNativeFeedback
              onPress={() => navigation.navigate('DisableProviders')}
              background={TouchableNativeFeedback.Ripple('#333333', false)}>
              <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
                <View className="flex-row items-center">
                  <MaterialIcons name="block" size={22} color={primary} />
                  <Text className="text-white ml-3 text-base">Disable Providers in Search</Text>
                </View>
                <Feather name="chevron-right" size={20} color="gray" />
              </View>
            </TouchableNativeFeedback>

            {/* Preferences */}
            <TouchableNativeFeedback
              onPress={() => navigation.navigate('Preferences')}
              background={TouchableNativeFeedback.Ripple('#333333', false)}>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <MaterialIcons name="room-preferences" size={22} color={primary} />
                  <Text className="text-white ml-3 text-base">Preferences</Text>
                </View>
                <Feather name="chevron-right" size={20} color="gray" />
              </View>
            </TouchableNativeFeedback>
          </View>
        </View>

        {/* Data Management section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-3">Data Management</Text>
          <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
            {/* Clear Cache */}
            <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
              <Text className="text-white text-base">Clear Cache</Text>
              <TouchableOpacity
                className="bg-[#262626] px-4 py-2 rounded-lg"
                onPress={() => {
                  if (MMKV.getBool('hapticFeedback') !== false) {
                    ReactNativeHapticFeedback.trigger('virtualKey', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                  MmmkvCache.clearStore();
                }}>
                <MaterialCommunityIcons name="delete-outline" size={20} color={primary} />
              </TouchableOpacity>
            </View>

            {/* Clear Watch History */}
            <View className="flex-row items-center justify-between p-4">
              <Text className="text-white text-base">Clear Watch History</Text>
              <TouchableOpacity
                className="bg-[#262626] px-4 py-2 rounded-lg"
                onPress={() => {
                  if (MMKV.getBool('hapticFeedback') !== false) {
                    ReactNativeHapticFeedback.trigger('virtualKey', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                  clearHistory();
                }}>
                <MaterialCommunityIcons name="delete-outline" size={20} color={primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About section */}
        <View className="mb-6">
          <Text className="text-gray-400 text-sm mb-3">About</Text>
          <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
            <TouchableNativeFeedback
              onPress={() => navigation.navigate('About')}
              background={TouchableNativeFeedback.Ripple('#333333', false)}>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <Feather name="info" size={22} color={primary} />
                  <Text className="text-white ml-3 text-base">About</Text>
                </View>
                <Feather name="chevron-right" size={20} color="gray" />
              </View>
            </TouchableNativeFeedback>
          </View>
        </View>

        {/* Social Links - Moved up and adjusted spacing */}
        <View className="flex-row items-center justify-center mt-2 mb-4">
        <TouchableOpacity
          className="flex-col items-center justify-center"
          onPress={() => Linking.openURL(socialLinks.github)}>
          <AntDesign name="github" size={24} color="white" />
          <Text className="text-white text-xs mt-2">
            Give a Star <Text>⭐</Text>
          </Text>
     </TouchableOpacity>
        </View>
      </View>

   </ScrollView>
  );
};

export default Settings;
