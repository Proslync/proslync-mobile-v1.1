import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';

export default function QRCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { payload } = useLocalSearchParams<{
    payload: string;
  }>();
  const previousBrightness = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        previousBrightness.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
      } catch {}
    })();

    return () => {
      if (previousBrightness.current !== null) {
        Brightness.setBrightnessAsync(previousBrightness.current).catch(() => {});
      }
    };
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => router.back()}
    >
      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={28} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        {payload ? (
          <QRCode
            value={payload}
            size={300}
            color="#fff"
            backgroundColor="transparent"
          />
        ) : null}
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    padding: 24,
  },
});
