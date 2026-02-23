import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  StreamCall,
  useCallStateHooks,
  useCall,
  CallingState,
  VideoRenderer,
  hasVideo,
} from '@stream-io/video-react-native-sdk';
import { useCallProvider } from '@/lib/providers/call-provider';

const PIP_WIDTH = 120;
const PIP_HEIGHT = 160;

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Inner component that uses Stream call hooks (must be inside StreamCall)
function CallUI() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const call = useCall();
  const { endCall } = useCallProvider();
  const {
    useCallCallingState,
    useLocalParticipant,
    useRemoteParticipants,
    useCameraState,
    useMicrophoneState,
  } = useCallStateHooks();

  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const { camera, isMute: isCameraOff } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();

  const [callDuration, setCallDuration] = useState(0);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = callingState === CallingState.JOINED;
  const isRinging = callingState === CallingState.RINGING;
  const isJoining = callingState === CallingState.JOINING;
  const hasEnded = callingState === CallingState.LEFT;

  const primaryRemote = remoteParticipants[0];

  // Start duration timer when connected
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isConnected]);

  // Navigate back when call ends
  useEffect(() => {
    if (hasEnded) {
      router.back();
    }
  }, [hasEnded, router]);

  const handleEndCall = useCallback(async () => {
    await endCall();
    router.back();
  }, [endCall, router]);

  const toggleMicrophone = useCallback(async () => {
    await microphone.toggle();
  }, [microphone]);

  const toggleCamera = useCallback(async () => {
    await camera.toggle();
  }, [camera]);

  const flipCamera = useCallback(async () => {
    await camera.flip();
    setIsFrontCamera((prev) => !prev);
  }, [camera]);

  const getStatusText = () => {
    if (isConnected) return formatDuration(callDuration);
    if (isJoining) return 'Connecting...';
    if (isRinging) return 'Ringing...';
    return 'Calling...';
  };

  const getRemoteName = () => {
    if (primaryRemote?.name) return primaryRemote.name;
    if (primaryRemote?.userId) return primaryRemote.userId;
    return 'Unknown';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Remote Video (full screen) */}
      {isConnected && primaryRemote && hasVideo(primaryRemote) ? (
        <View style={styles.remoteVideoContainer}>
          <VideoRenderer
            participant={primaryRemote}
            trackType="videoTrack"
          />
        </View>
      ) : (
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {primaryRemote?.image ? (
              <Image
                source={{ uri: primaryRemote.image }}
                style={styles.avatarImage}
              />
            ) : (
              <Image
                source={DefaultAvatarImage}
                style={styles.avatarImage}
              />
            )}
          </View>
          <Text style={styles.callerName}>{getRemoteName()}</Text>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
        </View>
      )}

      {/* Local Video (PIP) */}
      {isConnected && localParticipant && hasVideo(localParticipant) && !isCameraOff && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.pipContainer, { top: insets.top + 16 }]}
        >
          <VideoRenderer
            participant={localParticipant}
            trackType="videoTrack"
            mirror
          />
        </Animated.View>
      )}

      {/* Status overlay when connected with video */}
      {isConnected && primaryRemote && hasVideo(primaryRemote) && (
        <Animated.View
          entering={FadeIn}
          style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}
        >
          <Text style={styles.overlayName}>{getRemoteName()}</Text>
          <Text style={styles.overlayDuration}>{formatDuration(callDuration)}</Text>
        </Animated.View>
      )}

      {/* Controls */}
      <Animated.View
        entering={FadeIn.delay(300)}
        style={[styles.controlsContainer, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.controlsRow}>
          {/* Mute */}
          <TouchableOpacity
            style={[styles.controlButton, isMicMuted && styles.controlButtonActive]}
            onPress={toggleMicrophone}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMicMuted ? 'mic-off' : 'mic'}
              size={28}
              color="#fff"
            />
            <Text style={styles.controlLabel}>
              {isMicMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          {/* Camera Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
            onPress={toggleCamera}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isCameraOff ? 'videocam-off' : 'videocam'}
              size={28}
              color="#fff"
            />
            <Text style={styles.controlLabel}>
              {isCameraOff ? 'Camera On' : 'Camera Off'}
            </Text>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={flipCamera}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            <Text style={styles.controlLabel}>End</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// Main screen — wraps CallUI in StreamCall
export default function CallScreen() {
  const { activeCall } = useCallProvider();
  const router = useStableRouter();

  // If there's no active call, go back
  useEffect(() => {
    if (!activeCall) {
      const timeout = setTimeout(() => {
        if (!activeCall) {
          router.back();
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [activeCall, router]);

  if (!activeCall) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.avatarContainer}>
          <Text style={styles.callStatus}>Connecting call...</Text>
        </View>
      </View>
    );
  }

  return (
    <StreamCall call={activeCall}>
      <CallUI />
    </StreamCall>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Remote video
  remoteVideoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  // Avatar (when no video)
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  callerName: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // PIP local video
  pipContainer: {
    position: 'absolute',
    right: 16,
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
  },
  overlayName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  overlayDuration: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  // Controls
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  controlLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  endCallButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff3b30',
  },
});
