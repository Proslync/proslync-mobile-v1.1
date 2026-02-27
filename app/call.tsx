import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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
import { config } from '@/lib/config';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Avatar (guards against empty uri) ---

function CallAvatar({ uri, size = 120 }: { uri?: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatarLarge, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarPlaceholderLarge,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Ionicons name="person" size={size * 0.4} color="rgba(255,255,255,0.5)" />
    </View>
  );
}

// --- Control Button ---

function ControlButton({
  icon,
  label,
  onPress,
  active = false,
  danger = false,
  size = 56,
}: {
  icon: string;
  label?: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  size?: number;
}) {
  return (
    <TouchableOpacity style={styles.controlWrapper} onPress={onPress}>
      <View
        style={[
          styles.controlButton,
          { width: size, height: size, borderRadius: size / 2 },
          danger && styles.controlDanger,
          active && styles.controlActive,
        ]}
      >
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      {label && <Text style={styles.controlLabel}>{label}</Text>}
    </TouchableOpacity>
  );
}

// --- Room Content (inside LiveKitRoom) ---

function RoomContent({
  isVideo,
  recipientName,
  recipientImage,
  onEnd,
}: {
  isVideo: boolean;
  recipientName?: string;
  recipientImage?: string;
  onEnd: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const [speakerOn, setSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasRemoteParticipant = remoteParticipants.length > 0;

  // Get tracks
  const tracks = useTracks(
    isVideo
      ? [Track.Source.Camera, Track.Source.Microphone]
      : [Track.Source.Microphone],
  );

  // Start timer only when remote participant joins
  useEffect(() => {
    if (!hasRemoteParticipant) {
      // Reset timer if remote disconnects
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
      return;
    }

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasRemoteParticipant]);

  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleCamera = useCallback(async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  }, [localParticipant, isCameraEnabled]);

  const flipCamera = useCallback(async () => {
    const camTrack = localParticipant.getTrackPublication(Track.Source.Camera);
    if (camTrack?.track) {
      // @ts-ignore - restartTrack with facingMode works on React Native
      await camTrack.track.restartTrack({ facingMode: 'environment' });
    }
  }, [localParticipant]);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOn((prev) => !prev);
  }, []);

  // --- Still waiting for remote participant (Calling... state) ---
  if (!hasRemoteParticipant) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centeredContent}>
          <CallAvatar uri={recipientImage} />
          <Text style={styles.nameText}>{recipientName || 'Unknown'}</Text>
          <Text style={styles.statusText}>
            {isVideo ? 'Video calling...' : 'Calling...'}
          </Text>
        </View>

        <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
          <ControlButton
            icon="call"
            label="Cancel"
            onPress={onEnd}
            danger
            size={64}
          />
        </View>
      </View>
    );
  }

  // --- Active call: remote participant has joined ---

  // Separate remote vs local camera tracks
  const remoteCameraTracks = tracks.filter(
    (t) =>
      isTrackReference(t) &&
      t.source === Track.Source.Camera &&
      t.participant.sid !== localParticipant.sid,
  );
  const localCameraTrack = tracks.find(
    (t) =>
      isTrackReference(t) &&
      t.source === Track.Source.Camera &&
      t.participant.sid === localParticipant.sid,
  );

  if (isVideo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Remote video - full screen */}
        {remoteCameraTracks.length > 0 && isTrackReference(remoteCameraTracks[0]) ? (
          <VideoTrack
            trackRef={remoteCameraTracks[0]}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.centeredContent}>
            <CallAvatar uri={recipientImage} />
            <Text style={styles.nameText}>{recipientName || 'Unknown'}</Text>
          </View>
        )}

        {/* Local video - picture-in-picture */}
        {localCameraTrack && isTrackReference(localCameraTrack) && (
          <View style={[styles.pip, { top: insets.top + 16 }]}>
            <VideoTrack trackRef={localCameraTrack} style={styles.pipVideo} />
          </View>
        )}

        {/* Timer */}
        <View style={[styles.timerContainer, { top: insets.top + 12 }]}>
          <Text style={styles.timerText}>{formatDuration(duration)}</Text>
        </View>

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
          <ControlButton
            icon={isCameraEnabled ? 'videocam' : 'videocam-off'}
            label="Camera"
            onPress={toggleCamera}
            active={!isCameraEnabled}
          />
          <ControlButton
            icon={isMicrophoneEnabled ? 'mic' : 'mic-off'}
            label="Mute"
            onPress={toggleMute}
            active={!isMicrophoneEnabled}
          />
          <ControlButton icon="camera-reverse" label="Flip" onPress={flipCamera} />
          <ControlButton
            icon={speakerOn ? 'volume-high' : 'volume-mute'}
            label="Speaker"
            onPress={toggleSpeaker}
            active={!speakerOn}
          />
          <ControlButton icon="call" label="End" onPress={onEnd} danger />
        </View>
      </View>
    );
  }

  // Audio-only active call
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.centeredContent}>
        <CallAvatar uri={recipientImage} />
        <Text style={styles.nameText}>{recipientName || 'Unknown'}</Text>
        <Text style={styles.timerTextLarge}>{formatDuration(duration)}</Text>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <ControlButton
          icon={isMicrophoneEnabled ? 'mic' : 'mic-off'}
          label="Mute"
          onPress={toggleMute}
          active={!isMicrophoneEnabled}
        />
        <ControlButton
          icon={speakerOn ? 'volume-high' : 'volume-mute'}
          label="Speaker"
          onPress={toggleSpeaker}
          active={!speakerOn}
        />
        <ControlButton icon="call" label="End" onPress={onEnd} danger size={64} />
      </View>
    </View>
  );
}

// --- Main Call Screen ---

export default function CallScreen() {
  const { currentCall, endCall } = useCall();
  const endingRef = useRef(false);

  // Navigate back when call ends
  useEffect(() => {
    if (!currentCall && endingRef.current) {
      if (router.canGoBack()) {
        router.back();
      }
    }
  }, [currentCall]);

  // Reset ref when a new call starts
  useEffect(() => {
    if (currentCall) {
      endingRef.current = false;
    }
  }, [currentCall]);

  const handleEnd = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    await endCall();
  }, [endCall]);

  if (!currentCall) {
    // Brief flash before router.back() navigates away
    return <View style={styles.container} />;
  }

  const serverUrl = currentCall.wsUrl || config.livekit.serverUrl;

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={currentCall.token}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      audio={true}
      video={currentCall.isVideo}
      onDisconnected={() => {
        // Only auto-end if we didn't initiate the disconnect ourselves
        if (!endingRef.current) {
          handleEnd();
        }
      }}
    >
      <RoomContent
        isVideo={currentCall.isVideo}
        recipientName={currentCall.recipientName}
        recipientImage={currentCall.recipientImage}
        onEnd={handleEnd}
      />
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    marginBottom: 20,
  },
  avatarPlaceholderLarge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  timerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timerTextLarge: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
  },
  pip: {
    position: 'absolute',
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pipVideo: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  controlWrapper: {
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  controlActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  controlDanger: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  controlLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
});
