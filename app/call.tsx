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
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
  RTCView,
} from 'react-native-webrtc';
import { useCall } from '@/lib/providers/call-provider';
import { callkitService } from '@/lib/services/callkit-service';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

type CallState = 'ringing' | 'connecting' | 'active' | 'ended';

export default function CallScreen() {
  const params = useLocalSearchParams<{
    callId: string;
    recipientId: string;
    recipientName: string;
    recipientAvatar: string;
    isVideo: string;
    isIncoming: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { endActiveCall, socketRef } = useCall();

  const isVideo = params.isVideo === '1';
  const isIncoming = params.isIncoming === '1';

  const [callState, setCallState] = React.useState<CallState>(
    isIncoming ? 'connecting' : 'ringing',
  );
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isCameraOff, setIsCameraOff] = React.useState(!isVideo);
  const [isSpeaker, setIsSpeaker] = React.useState(isVideo);
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = React.useRef<RTCIceCandidate[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // WebRTC setup
  React.useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !params.callId) return;

    let pc: RTCPeerConnection | null = null;
    let stream: MediaStream | null = null;
    let mounted = true;

    const setup = async () => {
      // 1. Get local media
      stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
      }) as MediaStream;
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      setLocalStream(stream);

      // 2. Create peer connection
      pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // 3. Add local tracks
      stream.getTracks().forEach(track => {
        pc!.addTrack(track, stream!);
      });

      // 4. Handle remote tracks
      pc.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0] as MediaStream);
          setCallState('active');
          // Tell CallKit the call is connected
          callkitService.reportCallConnected(params.callId!);
        }
      };

      // 5. Handle ICE candidates — send to peer via signaling
      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          socket.emit('call:ice-candidate', {
            callId: params.callId,
            targetUserId: Number(params.recipientId),
            candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc?.iceConnectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          if (mounted) setCallState('ended');
        }
      };

      // 6. Listen for remote ICE candidates
      const handleIceCandidate = async (data: { callId: string; candidate: any }) => {
        if (data.callId !== params.callId || !pc) return;
        try {
          const candidate = new RTCIceCandidate(data.candidate);
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      };
      socket.on('call:ice-candidate', handleIceCandidate);

      // Helper to flush pending ICE candidates
      const flushPendingCandidates = async () => {
        for (const candidate of pendingCandidatesRef.current) {
          try { await pc!.addIceCandidate(candidate); } catch {}
        }
        pendingCandidatesRef.current = [];
      };

      // 7. Role-specific signaling
      if (!isIncoming) {
        // CALLER: wait for call:accepted, then create & send offer
        const handleAccepted = async (data: { callId: string }) => {
          if (data.callId !== params.callId || !pc) return;
          if (mounted) setCallState('connecting');
          try {
            const offer = await pc.createOffer({});
            await pc.setLocalDescription(offer);
            socket.emit('call:offer', {
              callId: params.callId,
              recipientId: Number(params.recipientId),
              sdp: offer,
            });
          } catch (err) {
            console.error('Failed to create offer:', err);
          }
        };
        socket.on('call:accepted', handleAccepted);

        // Listen for answer from recipient
        const handleAnswer = async (data: { callId: string; sdp: any }) => {
          if (data.callId !== params.callId || !pc) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushPendingCandidates();
          } catch (err) {
            console.error('Failed to handle answer:', err);
          }
        };
        socket.on('call:answer', handleAnswer);
      } else {
        // RECIPIENT: wait for offer, then create & send answer
        const handleOffer = async (data: { callId: string; senderId: number; sdp: any }) => {
          if (data.callId !== params.callId || !pc) return;
          if (mounted) setCallState('connecting');
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushPendingCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call:answer', {
              callId: params.callId,
              callerId: data.senderId,
              sdp: answer,
            });
          } catch (err) {
            console.error('Failed to handle offer:', err);
          }
        };
        socket.on('call:offer', handleOffer);
      }
    };

    setup().catch((err) => {
      console.error('WebRTC setup failed:', err);
      if (mounted) setCallState('ended');
    });

    return () => {
      mounted = false;
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:accepted');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (pc) {
        pc.close();
        pcRef.current = null;
      }
    };
  }, [params.callId, params.recipientId, isIncoming, isVideo]);

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
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    pcRef.current?.close();
    pcRef.current = null;
    // endActiveCall also calls callkitService.endCall internally
    await endActiveCall();
    router.back();
  };

  const handleToggleMute = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const handleToggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  const handleFlipCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      (videoTrack as any)._switchCamera();
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeaker((s) => !s);
  };

  const statusText =
    callState === 'ringing'
      ? 'Ringing...'
      : callState === 'connecting'
        ? 'Connecting...'
        : callState === 'ended'
          ? 'Call Ended'
          : formatDuration(duration);

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Local camera preview (full screen while ringing/connecting for video calls) */}
      {isVideo && localStream && callState !== 'active' && callState !== 'ended' && (
        <RTCView
          style={styles.remoteVideo}
          streamURL={localStream.toURL()}
          objectFit="cover"
          mirror
        />
      )}

      {/* Remote video (full screen when active) */}
      {isVideo && remoteStream && callState === 'active' && (
        <RTCView
          style={styles.remoteVideo}
          streamURL={remoteStream.toURL()}
          objectFit="cover"
        />
      )}

      {/* Local video (PiP when active) */}
      {isVideo && localStream && callState === 'active' && (
        <View style={[styles.localVideoPip, { top: insets.top + 16 }]}>
          <RTCView
            style={styles.localVideoInner}
            streamURL={localStream.toURL()}
            objectFit="cover"
            mirror
          />
        </View>
      )}

      {/* Caller info (shown when no remote video) */}
      {(!isVideo || !remoteStream || callState !== 'active') && (
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
      {isVideo && remoteStream && callState === 'active' && (
        <View style={[styles.videoStatusOverlay, { top: insets.top + 16 }]}>
          <Text style={styles.videoStatusName}>{params.recipientName}</Text>
          <Text style={styles.videoStatusTime}>{statusText}</Text>
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
    backgroundColor: '#000',
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
