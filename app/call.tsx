import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useRouter, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  isTrackReference,
  useLocalParticipant,
  useRemoteParticipants,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useCall } from '@/lib/providers/call-provider';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { config } from '@/lib/config';

export default function CallScreen() {
  const { currentCall, endCall, onCallConnected } = useCall();
  const endingRef = React.useRef(false);
  const hadCallRef = React.useRef(false);

  // Track that we had an active call
  React.useEffect(() => {
    if (currentCall) {
      hadCallRef.current = true;
      endingRef.current = false;
    }
  }, [currentCall]);

  // Navigate back when call ends (local end OR remote end)
  React.useEffect(() => {
    if (!currentCall && hadCallRef.current) {
      hadCallRef.current = false;
      if (router.canGoBack()) {
        router.back();
      }
    }
  }, [currentCall]);

  const handleEnd = React.useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    await endCall();
  }, [endCall]);

  // Safety: if we land on this screen but no call materializes, go back
  React.useEffect(() => {
    if (currentCall) return;
    const timeout = setTimeout(() => {
      if (!currentCall && !hadCallRef.current) {
        if (router.canGoBack()) router.back();
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [currentCall]);

  if (!currentCall) return <View style={styles.container} />;

  const serverUrl = currentCall.wsUrl || config.livekit.serverUrl;

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <LiveKitRoom
        serverUrl={serverUrl}
        token={currentCall.token}
        connect={true}
        options={{ adaptiveStream: { pixelDensity: 'screen' } }}
        audio={true}
        video={currentCall.isVideo}
        onError={(err) => console.warn('[LiveKit] Room error:', err.message)}
        onDisconnected={() => {
          // Auto-end if LiveKit disconnects and we didn't initiate it
          if (!endingRef.current) {
            handleEnd();
          }
        }}
      >
        <RoomContent
          isVideo={currentCall.isVideo}
          recipientName={currentCall.recipientName}
          recipientAvatar={currentCall.recipientAvatar}
          callId={currentCall.callId}
          isOutgoing={currentCall.isOutgoing}
          onEnd={handleEnd}
          onCallConnected={onCallConnected}
        />
      </LiveKitRoom>
    </View>
  );
}

interface RoomContentProps {
  isVideo: boolean;
  recipientName: string;
  recipientAvatar?: string;
  callId: string;
  isOutgoing: boolean;
  onEnd: () => Promise<void>;
  onCallConnected: (callId: string) => void;
}

function RoomContent({
  isVideo,
  recipientName,
  recipientAvatar,
  callId,
  isOutgoing,
  onEnd,
  onCallConnected,
}: RoomContentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const hasRemoteParticipant = remoteParticipants.length > 0;

  const [duration, setDuration] = React.useState(0);
  const [isSpeaker, setIsSpeaker] = React.useState(isVideo);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedRef = React.useRef(false);

  // Get all camera tracks for video rendering
  const tracks = useTracks([Track.Source.Camera]);

  const remoteCameraTrack = tracks.find(
    (t) => isTrackReference(t) && t.participant.sid !== localParticipant?.sid,
  );
  const localCameraTrack = tracks.find(
    (t) => isTrackReference(t) && t.participant.sid === localParticipant?.sid,
  );

  // Report call connected to CallKit when remote participant joins
  React.useEffect(() => {
    if (hasRemoteParticipant && !connectedRef.current) {
      connectedRef.current = true;
      onCallConnected(callId);
    }
  }, [hasRemoteParticipant, callId, onCallConnected]);

  // Ringtone — play while waiting for remote participant
  const ringtonePlayer = useAudioPlayer(require('@/assets/sounds/ringtone.wav'));

  React.useEffect(() => {
    ringtonePlayer.loop = true;
    ringtonePlayer.volume = 0.7;
  }, [ringtonePlayer]);

  React.useEffect(() => {
    if (hasRemoteParticipant) {
      ringtonePlayer.pause();
      return;
    }

    const startRingtone = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
        ringtonePlayer.play();
      } catch (err) {
        console.error('Failed to play ringtone:', err);
      }
    };

    startRingtone();

    return () => {
      ringtonePlayer.pause();
    };
  }, [hasRemoteParticipant, ringtonePlayer]);

  // Duration timer — starts when remote joins
  React.useEffect(() => {
    if (hasRemoteParticipant) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasRemoteParticipant]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    await onEnd();
    // Navigation handled by the useEffect in CallScreen watching currentCall
  };

  const handleToggleMute = () => {
    localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const handleToggleCamera = () => {
    localParticipant?.setCameraEnabled(!isCameraEnabled);
  };

  const handleFlipCamera = async () => {
    const pub = localParticipant?.getTrackPublication(Track.Source.Camera);
    const track = pub?.track;
    if (track) {
      await track.restartTrack();
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeaker((s) => !s);
  };

  const statusText = hasRemoteParticipant
    ? formatDuration(duration)
    : isOutgoing
      ? 'Calling...'
      : 'Connecting...';

  const showCallerInfo = !isVideo || !hasRemoteParticipant || !(remoteCameraTrack && isTrackReference(remoteCameraTrack));

  return (
    <View style={styles.roomContainer}>
      {/* Local camera preview (full screen while ringing for video calls) */}
      {isVideo && !hasRemoteParticipant && localCameraTrack && isTrackReference(localCameraTrack) && (
        <VideoTrack
          trackRef={localCameraTrack}
          mirror={true}
          style={styles.remoteVideo}
        />
      )}

      {/* Remote video (full screen when active) */}
      {isVideo && hasRemoteParticipant && remoteCameraTrack && isTrackReference(remoteCameraTrack) && (
        <VideoTrack
          trackRef={remoteCameraTrack}
          style={styles.remoteVideo}
        />
      )}

      {/* Local video PiP when active */}
      {isVideo && hasRemoteParticipant && localCameraTrack && isTrackReference(localCameraTrack) && (
        <View style={[styles.localVideoPip, { top: insets.top + 16 }]}>
          <VideoTrack
            trackRef={localCameraTrack}
            mirror={true}
            style={styles.localVideoInner}
          />
        </View>
      )}

      {/* Caller info (shown when no remote video) */}
      {showCallerInfo && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.callerInfo, { paddingTop: insets.top + 80 }]}
        >
          {recipientAvatar ? (
            <Image
              source={{ uri: recipientAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <GlassView {...liquidGlass.fill} borderRadius={60} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="person" size={48} color="rgba(255,255,255,0.6)" />
            </View>
          )}
          <Text style={styles.name}>{recipientName}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </Animated.View>
      )}

      {/* Status overlay for active video calls */}
      {isVideo && hasRemoteParticipant && remoteCameraTrack && isTrackReference(remoteCameraTrack) && (
        <View style={[styles.videoStatusOverlay, { top: insets.top + 16 }]}>
          <Text style={styles.videoStatusName}>{recipientName}</Text>
          <Text style={styles.videoStatusTime}>{statusText}</Text>
        </View>
      )}

      {/* Controls */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          style={[styles.controlButton, !isMicrophoneEnabled && styles.controlActive]}
          onPress={handleToggleMute}
          activeOpacity={0.7}
        >
          <GlassView {...liquidGlass.fill} borderRadius={28} style={StyleSheet.absoluteFillObject} />
          <Ionicons
            name={isMicrophoneEnabled ? 'mic' : 'mic-off'}
            size={24}
            color="#fff"
          />
          <Text style={styles.controlLabel}>
            {isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          </Text>
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity
            style={[styles.controlButton, !isCameraEnabled && styles.controlActive]}
            onPress={handleToggleCamera}
            activeOpacity={0.7}
          >
            <GlassView {...liquidGlass.fill} borderRadius={28} style={StyleSheet.absoluteFillObject} />
            <Ionicons
              name={isCameraEnabled ? 'videocam' : 'videocam-off'}
              size={24}
              color="#fff"
            />
            <Text style={styles.controlLabel}>Camera</Text>
          </TouchableOpacity>
        )}

        {isVideo && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleFlipCamera}
            activeOpacity={0.7}
          >
            <GlassView {...liquidGlass.fill} borderRadius={28} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="camera-reverse" size={24} color="#fff" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, isSpeaker && styles.controlActive]}
          onPress={handleToggleSpeaker}
          activeOpacity={0.7}
        >
          <GlassView {...liquidGlass.fill} borderRadius={28} style={StyleSheet.absoluteFillObject} />
          <Ionicons
            name={isSpeaker ? 'volume-high' : 'volume-low'}
            size={24}
            color="#fff"
          />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call"
            size={28}
            color="#fff"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  roomContainer: {
    flex: 1,
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  localVideoPip: {
    position: 'absolute',
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  localVideoInner: {
    flex: 1,
  },
  callerInfo: {
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
  name: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  videoStatusOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
  },
  videoStatusName: {
    fontSize: 16,
    color: '#fff',
  },
  videoStatusTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 20,
    paddingHorizontal: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  controlActive: {
  },
  controlLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    position: 'absolute',
    bottom: -18,
  },
  endCallButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
