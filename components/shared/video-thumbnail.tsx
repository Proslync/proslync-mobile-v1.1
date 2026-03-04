import * as React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';

interface VideoThumbnailImageProps {
  videoUrl: string;
  style?: any;
  fallbackUri?: string;
}

const cache = new Map<string, string>();

export function VideoThumbnailImage({ videoUrl, style, fallbackUri }: VideoThumbnailImageProps) {
  const [uri, setUri] = React.useState<string | null>(cache.get(videoUrl) || fallbackUri || null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (cache.has(videoUrl)) {
      setUri(cache.get(videoUrl)!);
      return;
    }

    let cancelled = false;

    VideoThumbnails.getThumbnailAsync(videoUrl, { time: 500 })
      .then(({ uri: thumbUri }) => {
        if (!cancelled) {
          cache.set(videoUrl, thumbUri);
          setUri(thumbUri);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => { cancelled = true; };
  }, [videoUrl]);

  if (!uri || failed) {
    return (
      <View style={[style, styles.placeholder]}>
        <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.4)" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
