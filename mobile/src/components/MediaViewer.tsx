import { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ReportMedia } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_HEIGHT = SCREEN_WIDTH * 0.75;

interface Props {
  media: ReportMedia[];
}

export default function MediaViewer({ media }: Props) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = ({ item }: { item: ReportMedia }) => {
    if (item.type === 'video') {
      return (
        <View style={styles.mediaItem}>
          <Video
            ref={videoRef}
            source={{ uri: item.url }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping
            useNativeControls
          />
        </View>
      );
    }

    return (
      <View style={styles.mediaItem}>
        <Image source={{ uri: item.url }} style={styles.media} resizeMode="cover" />
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={media}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />
      {media.length > 1 && (
        <View style={[styles.dots, { backgroundColor: colors.bg }]}>
          {media.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.textSecondary },
                i === activeIndex && { backgroundColor: colors.accent, width: 20 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaItem: { width: SCREEN_WIDTH, height: MEDIA_HEIGHT, backgroundColor: '#000' },
  media: { width: '100%', height: '100%' },
  playBtn: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
