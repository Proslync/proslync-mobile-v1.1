import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useCall } from '@/lib/providers/call-provider';
import { callkitService } from '@/lib/services/callkit-service';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  Room,
  RoomEvent,
  Track,
  LocalParticipant,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
  VideoTrack,
  ConnectionState,
} from '@livekit/react-native';

type CallState = 'ringing' | 'connecting' | 'active' | 'ended';

export default function CallScreen() {
  const params = useLocalSearchParams<{
    callId: string;
    recipientId: string;
    recipientName: string;
    recipientAvatar: string;
    isVideo: string;
    isIncoming: string;
    isGroupCall: string;
    livekitToken: string;
    livekitUrl: string;
  }>();

  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { endActiveCall } = useCall();

  const isVideo = params.isVideo === '1';
  const isIncoming = params.isIncoming === '1';
  const isGroupCall = params.isGroupCall === '1';

  const [callState, setCallState] = React.useState<CallState>(
    isIncoming ? 'connecting' : 'ringing',
  );
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isCameraOff, setIsCameraOff] = React.useState(!isVideo);
  const [isSpeaker, setIsSpeaker] = React.useState(isVideo);
  const [remoteVideoTracks, setRemoteVideoTracks] = React.useState<Map<string, VideoTrack>>(new Map());
  const [localVideoTrack, setLocalVideoTrack] = React.useState<VideoTrack | null>(null);
  const [participantCount, setParticipantCount] = React.useState(0);

  // Backward compat: single remote track for 1:1 calls
  const remoteVideoTrack = React.useMemo(() => {
    if (remoteVideoTracks.size === 0) return null;
    return remoteVideoTracks.values().next().value ?? null;
  }, [remoteVideoTracks]);

  const roomRef = React.useRef<Room | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // LiveKit room setup
  React.useEffect(() => {
    if (!params.livekitToken || !params.livekitUrl) return;

    let mounted = true;
    const room = new Room();
    roomRef.current = room;

    // Track subscribed — remote participant's track is available
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (!mounted) return;
      if (track.kind === Track.Kind.Video) {
        setRemoteVideoTracks((prev) => {
          const next = new Map(prev);
          next.set(participant.identity, track as VideoTrack);
          return next;
        });
      }
      setCallState('active');
      callkitService.reportCallConnected(params.callId!);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (!mounted) return;
      if (track.kind === Track.Kind.Video) {
        setRemoteVideoTracks((prev) => {
          const next = new Map(prev);
          next.delete(participant.identity);
          return next;
        });
      }
    });

    // Local track published
    room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
      if (!mounted) return;
      if (publication.track?.kind === Track.Kind.Video) {
        setLocalVideoTrack(publication.track as VideoTrack);
      }
    });

    // Participant connected — someone joined the room
    room.on(RoomEvent.ParticipantConnected, () => {
      if (!mounted) return;
      setCallState('active');
      setParticipantCount(room.remoteParticipants.size);
      callkitService.reportCallConnected(params.callId!);
    });

    // Participant disconnected — they left
    room.on(RoomEvent.ParticipantDisconnected, () => {
      if (!mounted) return;
      setParticipantCount(room.remoteParticipants.size);
      // For 1:1 calls, end when the other person leaves
      // For group calls, end only when everyone else has left
      if (room.remoteParticipants.size === 0) {
        setCallState('ended');
      }
    });

    // Room disconnected
    room.on(RoomEvent.Disconnected, () => {
      if (!mounted) return;
      setCallState('ended');
    });

    const connect = async () => {
      try {
        await room.connect(params.livekitUrl!, params.livekitToken!, {
          autoSubscribe: true,
        });
        if (!mounted) { room.disconnect(); return; }

        // Publish local tracks
        await room.localParticipant.enableMicrophone();
        if (isVideo) {
          await room.localParticipant.enableCamera();
        }

        // If participants are already in the room (e.g. incoming call, caller is waiting)
        if (room.remoteParticipants.size > 0) {
          setCallState('active');
          callkitService.reportCallConnected(params.callId!);
        }
      } catch (err) {
        console.error('[Call] LiveKit connect failed:', err);
        if (mounted) setCallState('ended');
      }
    };

    connect();

    return () => {
      mounted = false;
      room.disconnect();
      roomRef.current = null;
    };
  }, [params.livekitToken, params.livekitUrl, params.callId, isVideo]);

  // Ringing sound
  React.useEffect(() => {
    if (callState !== 'ringing' && callState !== 'connecting') return;

    let sound: Audio.Sound | null = null;
    let mounted = true;

    const playRingtone = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        const { sound: s } = await Audio.Sound.createAsync(
          require('@/assets/sounds/ringtone.wav'),
          { isLooping: true, volume: 0.7 },
        );
        if (!mounted) { await s.unloadAsync(); return; }
        sound = s;
        await s.playAsync();
      } catch (err) {
        console.error('Failed to play ringtone:', err);
      }
    };

    playRingtone();

    return () => {
      mounted = false;
      if (sound) {
        sound.stopAsync().then(() => sound!.unloadAsync()).catch(() => {});
      }
    };
  }, [callState]);

  // Duration timer
  React.useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Navigate back when call ends
  React.useEffect(() => {
    if (callState === 'ended') {
      const timeout = setTimeout(() => router.back(), 1000);
      return () => clearTimeout(timeout);
    }
  }, [callState, router]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    await endActiveCall();
    router.back();
  };

  const handleToggleMute = () => {
    const room = roomRef.current;
    if (!room) return;
    const newMuted = !isMuted;
    room.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  };

  const handleToggleCamera = () => {
    const room = roomRef.current;
    if (!room) return;
    const newOff = !isCameraOff;
    room.localParticipant.setCameraEnabled(!newOff);
    setIsCameraOff(newOff);
  };

  const handleFlipCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    // LiveKit RN handles camera switching via the local video track
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (pub?.track) {
      try {
        await (pub.track as any).switchCamera();
      } catch (err) {
        console.error('[Call] Failed to flip camera:', err);
      }
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeaker((s) => !s);
    // LiveKit RN handles audio routing internally
  };

  const statusText =
    callState === 'ringing'
      ? 'Ringing...'
      : callState === 'connecting'
        ? 'Connecting...'
        : callState === 'ended'
          ? 'Call Ended'
          : formatDuration(duration);

  // Use LiveKit's VideoView for rendering tracks
  const LiveKitVideoView = React.useMemo(() => {
    try {
      const { VideoView } = require('@livekit/react-native');
      return VideoView;
    } catch {
      return null;
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Remote video — single full screen for 1:1, grid for group */}
      {isVideo && callState === 'active' && LiveKitVideoView && remoteVideoTracks.size > 0 && (
        isGroupCall && remoteVideoTracks.size > 1 ? (
          <View style={styles.videoGrid}>
            {Array.from(remoteVideoTracks.entries()).map(([identity, track]) => (
              <View key={identity} style={[styles.videoGridItem, { width: remoteVideoTracks.size <= 2 ? '100%' : '50%', height: remoteVideoTracks.size <= 2 ? '50%' : '50%' }]}>
                <LiveKitVideoView
                  style={StyleSheet.absoluteFill}
                  videoTrack={track}
                  objectFit="cover"
                />
              </View>
            ))}
          </View>
        ) : (
          <LiveKitVideoView
            style={styles.remoteVideo}
            videoTrack={remoteVideoTrack!}
            objectFit="cover"
          />
        )
      )}

      {/* Local video preview (full screen while ringing/connecting) */}
      {isVideo && localVideoTrack && callState !== 'active' && callState !== 'ended' && LiveKitVideoView && (
        <LiveKitVideoView
          style={styles.remoteVideo}
          videoTrack={localVideoTrack}
          objectFit="cover"
          mirror
        />
      )}

      {/* Local video PiP when active */}
      {isVideo && localVideoTrack && callState === 'active' && LiveKitVideoView && (
        <View style={[styles.localVideoPip, { top: insets.top + 16 }]}>
          <LiveKitVideoView
            style={styles.localVideoInner}
            videoTrack={localVideoTrack}
            objectFit="cover"
            mirror
          />
        </View>
      )}

      {/* Caller info (shown when no remote video) */}
      {(!isVideo || !remoteVideoTrack || callState !== 'active') && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.callerInfo, { paddingTop: insets.top + 80 }]}
        >
          {params.recipientAvatar ? (
            <Image
              source={{ uri: params.recipientAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="rgba(255,255,255,0.6)" />
            </View>
          )}
          <Text style={styles.name}>{params.recipientName}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </Animated.View>
      )}

      {/* Status overlay for video calls */}
      {isVideo && remoteVideoTracks.size > 0 && callState === 'active' && (
        <View style={[styles.videoStatusOverlay, { top: insets.top + 16 }]}>
          <Text style={styles.videoStatusName}>{params.recipientName}</Text>
          <Text style={styles.videoStatusTime}>
            {statusText}{isGroupCall ? ` · ${participantCount + 1} people` : ''}
          </Text>
        </View>
      )}

      {/* Controls */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlActive]}
          onPress={handleToggleMute}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color="#fff"
          />
          <Text style={styles.controlLabel}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity
            style={[styles.controlButton, isCameraOff && styles.controlActive]}
            onPress={handleToggleCamera}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isCameraOff ? 'videocam-off' : 'videocam'}
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
            <Ionicons name="camera-reverse" size={24} color="#fff" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, isSpeaker && styles.controlActive]}
          onPress={handleToggleSpeaker}
          activeOpacity={0.7}
        >
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
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  videoGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  videoGridItem: {
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  videoStatusOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
  },
  videoStatusName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  videoStatusTime: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  controlActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  controlLabel: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
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
