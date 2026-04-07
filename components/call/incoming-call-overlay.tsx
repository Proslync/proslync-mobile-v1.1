import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IncomingCallOverlayProps {
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallOverlay({
  callerName,
  callerAvatar,
  isVideo,
  onAccept,
  onDecline,
}: IncomingCallOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <GlassView
        {...liquidGlass.surface}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        {callerAvatar ? (
          <Image source={{ uri: callerAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <GlassView {...liquidGlass.fill} borderRadius={60} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="person" size={48} color="rgba(255,255,255,0.6)" />
          </View>
        )}

        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callType}>
          Incoming {isVideo ? 'video' : 'voice'} call...
        </Text>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onDecline}
          activeOpacity={0.8}
        >
          <GlassView
            {...liquidGlass.danger}
            borderRadius={35}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <GlassView
            {...liquidGlass.success}
            borderRadius={35}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name={isVideo ? 'videocam' : 'call'} size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
