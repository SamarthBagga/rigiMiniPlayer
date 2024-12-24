import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoPlayer } from './src/components/VideoPlayer';
import { Video, PlayerState } from './src/types';
import { Ionicons } from '@expo/vector-icons';
import { isPictureInPictureSupported } from 'expo-video';

const { width } = Dimensions.get('window');

const DEFAULT_VIDEOS: Video[] = [
  {
    id: 'video1',
    source: require('./assets/videos/video1.mp4'),
    title: 'video1',
    thumbnail: require('./assets/videos/th2.png'),
    duration: '00:15',
    views: '0 views',
    channel: 'Channel 1',
    uploadedAt: '2 days ago'
  },
  {
    id: 'video2',
    source: require('./assets/videos/video2.mp4'),
    title: 'video2',
    thumbnail: require('./assets/videos/th1.png'),
    duration: '00:05',
    views: '0 views',
    channel: 'Channel 2',
    uploadedAt: '1 week ago'
  },
  {
    id: 'video3',
    source: require('./assets/videos/video3.mp4'),
    title: 'video3',
    thumbnail: require('./assets/videos/th3.png'),
    duration: '00:14',
    views: '0 views',
    channel: 'Channel 3',
    uploadedAt: '1 week ago'
  },
  {
    id: 'video4',
    source: require('./assets/videos/video4.mp4'),
    title: 'video4',
    thumbnail: require('./assets/videos/th4.png'),
    duration: '00:23',
    views: '0 views',
    channel: 'Channel 4',
    uploadedAt: '1 week ago'
  },
];

export default function App() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isMinimized: false,
    currentVideo: null,
  });
  const [videos] = useState<Video[]>(DEFAULT_VIDEOS);
  const [isLandscape, setIsLandscape] = useState(false);
  const [supportsPiP, setSupportsPiP] = useState(false);

  useEffect(() => {
    const checkPiPSupport = async () => {
      const isPiPSupported = await isPictureInPictureSupported();
      setSupportsPiP(isPiPSupported);
    };

    const setupOrientation = async () => {
      await ScreenOrientation.unlockAsync();
    };

    checkPiPSupport();
    setupOrientation();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const renderVideoItem = ({ item }: { item: Video }) => {
    const isFullScreen = !!playerState.currentVideo && !playerState.isMinimized;
    
    return (
      <TouchableOpacity
        style={[
          styles.videoItem,
          isFullScreen ? styles.videoItemHorizontal : styles.videoItemGrid
        ]}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={item.thumbnail}
            style={[
              styles.thumbnail,
              isFullScreen && styles.thumbnailHorizontal
            ]}
            resizeMode="cover"
          />
          <View style={styles.playIconOverlay}>
            <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        </View>
        <View style={[
          styles.videoInfo,
          isFullScreen ? styles.videoInfoHorizontal : styles.videoInfoGrid
        ]}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.videoMetadata}>
            {item.views} views
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleVideoPress = async (video: Video) => {
    setPlayerState({
      isMinimized: false,
      currentVideo: video,
    });
  };

  const handleMinimize = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setPlayerState((prev) => ({ ...prev, isMinimized: true }));
  };

  const handleMaximize = async () => {
    await ScreenOrientation.unlockAsync();
    setPlayerState((prev) => ({ ...prev, isMinimized: false }));
  };

  const handleClose = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setPlayerState({
      isMinimized: false,
      currentVideo: null,
    });
  };

  if (isLandscape && playerState.currentVideo && !playerState.isMinimized) {
    return (
      <GestureHandlerRootView style={styles.landscapeContainer}>
        <View style={styles.landscapeContainer}>
          <VideoPlayer
            source={playerState.currentVideo.source}
            isMinimized={false}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onClose={handleClose}
            title={playerState.currentVideo.title}
            videos={videos.filter(v => v.id !== playerState.currentVideo?.id)}
            onVideoSelect={handleVideoPress}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>miniPlayerRigi</Text>
        </View>

        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.videoList}
          numColumns={playerState.currentVideo && !playerState.isMinimized ? 1 : 2}
          key={playerState.currentVideo && !playerState.isMinimized ? 'single' : 'double'}
          columnWrapperStyle={
            playerState.currentVideo && !playerState.isMinimized
              ? undefined
              : styles.videoGrid
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => 
            <View style={[
              styles.separator,
              playerState.currentVideo && !playerState.isMinimized
                ? styles.separatorHorizontal
                : styles.separatorGrid
            ]} />
          }
        />

        {playerState.currentVideo && (
          <VideoPlayer
            source={playerState.currentVideo.source}
            isMinimized={playerState.isMinimized}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onClose={handleClose}
            title={playerState.currentVideo.title}
            videos={videos.filter(v => v.id !== playerState.currentVideo?.id)}
            onVideoSelect={handleVideoPress}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF0000',
  },
  videoList: {
    padding: 8,
  },
  videoGrid: {
    justifyContent: 'space-between',
  },
  videoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  videoItemGrid: {
    flex: 1,
    margin: 6,
    maxWidth: (width - 36) / 2,
  },
  videoItemHorizontal: {
    flexDirection: 'row',
    margin: 6,
    alignItems: 'center',
    height: 80,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 90,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  thumbnailHorizontal: {
    width: 120,
    height: 80,
    borderRadius: 6,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  videoInfo: {
    padding: 8,
  },
  videoInfoGrid: {
    width: '100%',
  },
  videoInfoHorizontal: {
    flex: 1,
    paddingLeft: 12,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    lineHeight: 18,
  },
  videoMetadata: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    backgroundColor: '#e0e0e0',
  },
  separatorHorizontal: {
    height: 1,
    marginHorizontal: 6,
  },
  separatorGrid: {
    height: 0,
  },
});