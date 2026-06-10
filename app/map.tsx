import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreMap } from '@/components/explore/explore-map';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ExploreMap style={StyleSheet.absoluteFill} />

      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityLabel="Back"
        accessibilityRole="button"
      >
        <View style={styles.backGlass} pointerEvents="none">
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        </View>
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  backGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
