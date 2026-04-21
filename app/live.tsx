import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [facing, setFacing] = React.useState<'front' | 'back'>('front');
  const [isLive, setIsLive] = React.useState(false);
  const device = useCameraDevice(facing);

  React.useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const goLive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLive(true);
  };

  const endLive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLive(false);
  };

  const flipCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((f) => (f === 'front' ? 'back' : 'front'));
  };

  const close = () => {
    if (isLive) endLive();
    router.back();
  };

  if (!hasPermission) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.permissionTitle}>Camera access required</Text>
        <Text style={styles.permissionBody}>Enable camera in Settings to go live.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionBtnText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionBtn, styles.permissionBtnGhost]} onPress={() => router.back()}>
          <Text style={styles.permissionBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          video
          audio
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.simMsg}>Camera preview unavailable{"\n"}(simulator has no camera — test on your phone)</Text>
        </View>
      )}

      {/* Top chrome */}
      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={close} activeOpacity={0.8}>
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>

        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}

        <TouchableOpacity style={styles.iconBtn} onPress={flipCamera} activeOpacity={0.8}>
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
          <Ionicons name="camera-reverse" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom — go live / end */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 30 }]}>
        {isLive ? (
          <TouchableOpacity style={styles.endBtn} onPress={endLive} activeOpacity={0.85}>
            <View style={styles.endBtnInner} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.goLiveBtn} onPress={goLive} activeOpacity={0.85}>
            <Text style={styles.goLiveText}>Go Live</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  permissionTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  permissionBody: { color: 'rgba(255,255,255,0.65)', fontSize: 15, textAlign: 'center', marginBottom: 10 },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6F3C',
    borderRadius: 999,
    minWidth: 180,
    alignItems: 'center',
  },
  permissionBtnGhost: { backgroundColor: 'rgba(255,255,255,0.08)' },
  permissionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFF' },
  liveBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  goLiveBtn: {
    backgroundColor: '#FF6F3C',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 220,
    alignItems: 'center',
  },
  goLiveText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  endBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnInner: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FF3B30' },
  simMsg: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },
});
