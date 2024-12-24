import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, FlatList, Image, AppState } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Video as VideoType } from '../types';

const { width: WIDTH, height: HEIGHT } = Dimensions.get('window');

const MINI_PLAYER_WIDTH = WIDTH * 0.6;
const MINI_PLAYER_HEIGHT = MINI_PLAYER_WIDTH * (9/16);

interface VideoPlayerProps {
  source: any;
  isMinimized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  title?: string;
  videos?: VideoType[];
  onVideoSelect?: (video: VideoType) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  isMinimized,
  onMinimize,
  onMaximize,
  onClose,
  title,
  videos,
  onVideoSelect,
}) => {
  const videoViewRef = useRef<any>(null);
  const player = useVideoPlayer(source, player => {
    player.loop = true;
    player.play();
  });

  const translateY = useSharedValue(0);
  const [dimensions, setDimensions] = useState({
    width: WIDTH,
    height: HEIGHT,
  });
  const [isLandscape, setIsLandscape] = useState(false);
  const [isInPiPMode, setIsInPiPMode] = useState(false);

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        if (!isMinimized) {
          player.staysActiveInBackground = true;
          player.showNowPlayingNotification = true;
        }
      } else if (nextAppState === 'active') {
        if (!isMinimized && !isInPiPMode) {
          player.staysActiveInBackground = false;
          player.showNowPlayingNotification = false;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, isMinimized, isInPiPMode]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const isLandscapeMode = window.width > window.height;
      setIsLandscape(isLandscapeMode);
      setDimensions({
        width: window.width,
        height: window.height,
      });

      if (isLandscapeMode && !isMinimized) {
        ScreenOrientation.unlockAsync();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [isMinimized]);

  useEffect(() => {
    if (isMinimized) {
      player.staysActiveInBackground = true;
      player.showNowPlayingNotification = true;
    } else if (!isInPiPMode) {
      player.staysActiveInBackground = false;
      player.showNowPlayingNotification = false;
    }
  }, [isMinimized, isInPiPMode, player]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const onGestureEvent = useCallback(
    (event: any) => {
      const { translationY } = event.nativeEvent;

      if (translationY > 50 && !isMinimized && !isLandscape) {
        onMinimize();
      } else if (translationY < -50 && isMinimized) {
        onMaximize();
      }
    },
    [isMinimized, onMinimize, onMaximize, isLandscape]
  );

  const getPlayerDimensions = () => {
    if (isLandscape && !isMinimized) {
      return {
        width: dimensions.width,
        height: dimensions.height,
      };
    }
    if (isMinimized) {
      return {
        width: MINI_PLAYER_WIDTH,
        height: MINI_PLAYER_HEIGHT,
      };
    }
    return {
      width: dimensions.width,
      height: dimensions.width * (9/16),
    };
  };

  const togglePlaying = async () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleClose = () => {
    player.pause();
    player.staysActiveInBackground = false;
    player.showNowPlayingNotification = false;
    setIsInPiPMode(false);
    onClose();
  };

  const handleMiniPlayerPress = () => {
    if (isMinimized) {
      onMaximize();
    }
  };

  const handlePiPStop = () => {
    setIsInPiPMode(false);
    if (!isMinimized) {
      player.pause();
      player.staysActiveInBackground = false;
      player.showNowPlayingNotification = false;
      onClose();
    }
  };

  const renderRelatedVideo = ({ item }: { item: VideoType }) => {
    return (
      <TouchableOpacity
        style={styles.relatedVideoItem}
        onPress={() => onVideoSelect?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailCont}>
          <Image
            source={item.thumbnail}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        </View>
        <View style={styles.relatedVideoInfo}>
          <Text style={styles.relatedVideoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.views}>
            {item.views} views • {item.channel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const playerDimensions = getPlayerDimensions();

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent}>
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          isMinimized ? styles.minimizedContainer : styles.fullContainer,
          isLandscape && !isMinimized && styles.landscapeContainer,
        ]}
      >
        <TouchableOpacity
          activeOpacity={isMinimized ? 0.7 : 1}
          onPress={isMinimized ? handleMiniPlayerPress : undefined}
          style={[
            styles.playerContainer,
            { width: playerDimensions.width, height: playerDimensions.height }
          ]}
        >
          <VideoView
            ref={videoViewRef}
            style={styles.videoPlayer}
            player={player}
            contentFit="contain"
            allowsFullscreen={!isMinimized}
            allowsPictureInPicture={true}
            startsPictureInPictureAutomatically={true}
            nativeControls={!isMinimized}
            onPictureInPictureStart={() => {
              setIsInPiPMode(true);
              player.staysActiveInBackground = true;
              player.showNowPlayingNotification = true;
            }}
            onPictureInPictureStop={handlePiPStop}
          />
          {isMinimized && (
            <>
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlaying}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close-circle" size={20} color="white" />
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        {!isMinimized && !isLandscape && (
          <View style={styles.contentContainer}>
            <View style={styles.title}>
              <Text style={styles.titleText} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <FlatList
              data={videos}
              renderItem={renderRelatedVideo}
              keyExtractor={(item) => item.id}
              style={styles.vidsList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.space} />}
            />
          </View>
        )}

        {isMinimized && (
          <TouchableOpacity
            style={styles.minimizedOverlay}
            activeOpacity={0.8}
            onPress={handleMiniPlayerPress}
          >
            <View style={styles.expandHandle} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    height: HEIGHT - (WIDTH * (9/16)),
  },
  playerContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  fullContainer: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    zIndex: 999,
  },
  landscapeContainer: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  minimizedContainer: {
    width: MINI_PLAYER_WIDTH,
    height: MINI_PLAYER_HEIGHT,
    bottom: 80,
    right: 16,
    zIndex: 999,
    borderRadius: 8,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1002,
    padding: 4,
  },
  playPauseButton: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    zIndex: 1002,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
  },
  minimizedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
    zIndex: 1001,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandHandle: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1,
  },
  vidsList: {
    flex: 1,
    backgroundColor: '#000',
  },
  relatedVideoItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#000',
  },
  thumbnailCont: {
    width: 160,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  relatedVideoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  relatedVideoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  views: {
    color: '#999',
    fontSize: 12,
  },
  space: {
    height: 1,
    backgroundColor: '#222',
    marginHorizontal: 12,
  },
  title: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});