// Chat Thread Screen - Instagram/Snapchat-style messaging
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import { useConversation, type ChatMessage, type ChannelMember } from '@/hooks/use-conversation';
import { useCall } from '@/lib/providers/call-provider';
import { useRemoveMember, useLeaveConversation, useUpdateConversation } from '@/hooks/use-conversations';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { MiniEventCard } from '@/components/chat/mini-event-card';
import { MiniVenueCard } from '@/components/chat/mini-venue-card';
import { MiniUserCard } from '@/components/chat/mini-user-card';
import { useAppTheme, type ThemeColors } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;

// Default avatar component with white background
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

interface MessageGroup {
  type: 'day' | 'message';
  date?: Date;
  message?: ChatMessage;
  isGroupStart?: boolean;
  showTime?: boolean;
  isLastOwnBeforeRead?: boolean;
}

interface PendingMedia {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

function formatDayHeader(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Day Separator Component
function DaySeparator({ date, colors }: { date: Date; colors: ThemeColors }) {
  return (
    <Animated.View entering={FadeIn} style={styles.daySeparator}>
      <Text style={[styles.daySeparatorText, { color: colors.textTertiary }]}>{formatDayHeader(date)}</Text>
    </Animated.View>
  );
}

// System Message Row (call events, etc.)
function SystemMessageRow({ message, colors }: { message: ChatMessage; colors: ThemeColors }) {
  const isCallEnded = message.systemEvent === 'call_ended';
  const isMissedOrDeclined =
    message.systemEvent === 'call_missed' || message.systemEvent === 'call_declined';
  const isVideo = message.callType === 'video';

  const iconName = isVideo ? 'videocam' : 'call';
  const iconColor = isCallEnded ? '#34c759' : '#FF3B30';

  return (
    <View style={styles.systemMessageRow}>
      <View style={styles.systemMessageContent}>
        <Ionicons name={iconName} size={14} color={iconColor} />
        <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
          {message.text}
        </Text>
        <Text style={[styles.systemMessageTime, { color: colors.textTertiary }]}>
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// Message Bubble Component - Instagram/Snapchat style
function MessageBubble({
  message,
  isGroupStart,
  showTime,
  onImagePress,
  onLongPress,
  colors,
  isDark,
  isLastOwnBeforeRead,
  readAt,
  isGroupChat,
  isConciergeChat,
}: {
  message: ChatMessage;
  isGroupStart?: boolean;
  showTime?: boolean;
  onImagePress?: (url: string) => void;
  onLongPress?: (message: ChatMessage) => void;
  colors: ThemeColors;
  isDark: boolean;
  isLastOwnBeforeRead?: boolean;
  readAt?: Date | null;
  isGroupChat?: boolean;
  isConciergeChat?: boolean;
}) {
  // System messages render as centered rows, not bubbles
  if (message.isSystem) {
    return <SystemMessageRow message={message} colors={colors} />;
  }

  const isOwn = message.isOwn;
  const isSystem = message.isSystem;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = message.text && message.text.trim().length > 0;

  // System messages render as centered, styled differently
  if (isSystem) {
    return (
      <View style={styles.systemMessageRow}>
        <View style={styles.systemMessageBubble}>
          <Text style={styles.systemMessageText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Check for audio attachments
  const audioAttachment = message.attachments?.find((att) => att.type === 'audio');
  const hasAudio = !!audioAttachment;

  // Render attachments (images/videos - not audio)
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    // Filter out audio attachments (handled separately)
    const visualAttachments = message.attachments.filter((att) => att.type !== 'audio');
    if (visualAttachments.length === 0) return null;

    return visualAttachments.map((attachment, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => onImagePress?.(attachment.url)}
        activeOpacity={0.9}
        style={styles.attachmentContainer}
      >
        <Image
          source={{ uri: attachment.thumbUrl || attachment.url }}
          style={[
            styles.attachmentImage,
            {
              width: MAX_IMAGE_WIDTH,
              height: attachment.height && attachment.width
                ? (MAX_IMAGE_WIDTH * attachment.height) / attachment.width
                : MAX_IMAGE_WIDTH * 1.2,
            },
          ]}
          resizeMode="cover"
        />
        {attachment.type === 'video' && (
          <View style={styles.videoPlayIcon}>
            <Ionicons name="play" size={32} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {/* Avatar for other user */}
      {!isOwn && isGroupStart && (
        <Avatar uri={message.userImage} size={28} colors={colors} />
      )}
      {!isOwn && !isGroupStart && <View style={styles.messageAvatarPlaceholder} />}

      <Pressable
        style={styles.messageContent}
        onLongPress={() => onLongPress?.(message)}
        delayLongPress={500}
      >
        {/* Sender name for group chats */}
        {isGroupChat && !isOwn && isGroupStart && (
          <Text style={[styles.senderName, { color: colors.textSecondary }]}>
            {message.userName}
          </Text>
        )}

        {/* Audio attachment - Voice message */}
        {hasAudio && audioAttachment && (
          <View style={[styles.bubbleWrapper, isOwn && styles.bubbleWrapperOwn]}>
            <VoiceMessagePlayer
              audioUrl={audioAttachment.url}
              duration={audioAttachment.duration}
              isOwn={isOwn}
              colors={colors}
              isDark={isDark}
            />
          </View>
        )}

        {/* Visual Attachments (images/videos) */}
        {hasAttachments && !hasAudio && (
          <View style={[styles.attachmentWrapper, isOwn && styles.attachmentWrapperOwn]}>
            {renderAttachments()}
          </View>
        )}

        {/* Text bubble */}
        {hasText && (() => {
          const text = message.text || '';
          const hasRichTags = isConciergeChat && !isOwn && /\[(EVENT|VENUE|USER):\d+\]/.test(text);

          if (hasRichTags) {
            const parts: { type: 'text' | 'event' | 'venue' | 'user'; value: string }[] = [];
            let lastIndex = 0;
            const regex = /\[(EVENT|VENUE|USER):(\d+)\]/g;
            let match = regex.exec(text);
            while (match !== null) {
              if (match.index > lastIndex) {
                const chunk = text.slice(lastIndex, match.index).trim();
                if (chunk) parts.push({ type: 'text', value: chunk });
              }
              parts.push({ type: match[1].toLowerCase() as 'event' | 'venue' | 'user', value: match[2] });
              lastIndex = match.index + match[0].length;
              match = regex.exec(text);
            }
            if (lastIndex < text.length) {
              const chunk = text.slice(lastIndex).trim();
              if (chunk) parts.push({ type: 'text', value: chunk });
            }

            return (
              <View style={[styles.bubbleWrapper, isOwn && styles.bubbleWrapperOwn]}>
                {parts.map((part, i) =>
                  part.type === 'event' ? (
                    <MiniEventCard key={`event-${part.value}-${i}`} eventId={Number(part.value)} />
                  ) : part.type === 'venue' ? (
                    <MiniVenueCard key={`venue-${part.value}-${i}`} venueId={Number(part.value)} />
                  ) : part.type === 'user' ? (
                    <MiniUserCard key={`user-${part.value}-${i}`} userId={Number(part.value)} />
                  ) : (
                    <View
                      key={`text-${i}`}
                      style={[
                        styles.messageBubble,
                        styles.messageBubbleOther,
                        { backgroundColor: isDark ? colors.cardElevated : '#f0f0f0' },
                        !isGroupStart && i === 0 && styles.messageBubbleGroupOther,
                      ]}
                    >
                      <Text style={[styles.messageText, { color: colors.text }]}>
                        {part.value}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            );
          }

          return (
            <View style={[styles.bubbleWrapper, isOwn && styles.bubbleWrapperOwn]}>
              <View
                style={[
                  styles.messageBubble,
                  isOwn ? styles.messageBubbleOwn : [styles.messageBubbleOther, { backgroundColor: isDark ? colors.cardElevated : '#f0f0f0' }],
                  !isGroupStart && (isOwn ? styles.messageBubbleGroupOwn : styles.messageBubbleGroupOther),
                ]}
              >
                <Text style={isOwn ? styles.messageTextOwn : [styles.messageText, { color: colors.text }]}>
                  {message.text}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Timestamp */}
        {showTime && (
          <Text style={[styles.messageTime, { color: colors.textTertiary }, isOwn && styles.messageTimeOwn]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        )}

        {/* Read receipt - "Seen at X:XX" */}
        {isLastOwnBeforeRead && readAt && (
          <View style={[styles.readReceiptRow, isOwn && styles.readReceiptRowOwn]}>
            <Ionicons name="checkmark-done" size={12} color="#0095f6" />
            <Text style={styles.readReceiptText}>
              Seen {formatMessageTime(readAt)}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// Animated Typing Dot
function AnimatedDot({ delay, isDark }: { delay: number; isDark: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.typingDot, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }, animatedStyle]} />;
}

// Typing Indicator Component
function TypingIndicator({ visible, isConcierge, avatarUri, colors, isDark }: { visible: boolean; isConcierge?: boolean; avatarUri?: string; colors: ThemeColors; isDark: boolean }) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.typingContainer}>
      {isConcierge ? (
        <View style={styles.typingConciergeAvatar}>
          <Ionicons name="sparkles" size={12} color="#fff" />
        </View>
      ) : (
        <Avatar uri={avatarUri} size={28} colors={colors} />
      )}
      <View style={[styles.typingBubble, { backgroundColor: isDark ? colors.cardElevated : 'rgba(0, 0, 0, 0.06)' }]}>
        <AnimatedDot delay={0} isDark={isDark} />
        <AnimatedDot delay={200} isDark={isDark} />
        <AnimatedDot delay={400} isDark={isDark} />
      </View>
    </Animated.View>
  );
}

// Avatar component with white background for default avatar
function Avatar({ uri, size = 28, colors }: { uri?: string; size?: number; colors: ThemeColors }) {
  const hasCustomAvatar = uri && uri.length > 0;

  return (
    <View style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.background }]}>
      <Image
        source={hasCustomAvatar ? { uri } : DefaultAvatarImage}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    </View>
  );
}

// Generate stable waveform bar heights from a string seed
function generateWaveformBars(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = (hash * 16807 + 1) | 0;
    bars.push(4 + (((hash >>> 0) % 1000) / 1000) * 12);
  }
  return bars;
}

// Voice Message Player Component
function VoiceMessagePlayer({
  audioUrl,
  duration,
  isOwn,
  colors,
  isDark,
}: {
  audioUrl: string;
  duration?: number;
  isOwn: boolean;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const barHeights = useMemo(() => generateWaveformBars(audioUrl, 20), [audioUrl]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasFinished, setHasFinished] = useState(false);
  const progressAnim = useSharedValue(0);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadAndPlayAudio = async () => {
    try {
      setIsLoading(true);

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // If already loaded, handle play/pause/replay
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            // Pause
            await sound.pauseAsync();
            setIsPlaying(false);
          } else if (hasFinished || status.positionMillis >= (status.durationMillis || 0) - 100) {
            // Replay from beginning
            await sound.setPositionAsync(0);
            await sound.playAsync();
            setIsPlaying(true);
            setHasFinished(false);
            setPosition(0);
            progressAnim.value = 0;
          } else {
            // Resume
            await sound.playAsync();
            setIsPlaying(true);
          }
          setIsLoading(false);
          return;
        }
      }

      // Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setHasFinished(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      setErrorAlert('Failed to play voice message');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      const currentPosition = status.positionMillis / 1000;
      const totalDuration = status.durationMillis / 1000;

      setPosition(currentPosition);
      if (!audioDuration && totalDuration) {
        setAudioDuration(totalDuration);
      }

      // Update progress animation
      if (totalDuration > 0) {
        progressAnim.value = withTiming(currentPosition / totalDuration, { duration: 100 });
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setHasFinished(true);
        setPosition(0);
        progressAnim.value = withTiming(0, { duration: 200 });
      }
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  return (
    <View style={[styles.voiceMessageContainer, isOwn ? styles.voiceMessageOwn : [styles.voiceMessageOther, { backgroundColor: isDark ? colors.cardElevated : '#f0f0f0' }]]}>
      <TouchableOpacity
        style={[styles.voicePlayButton, isOwn ? styles.voicePlayButtonOwn : styles.voicePlayButtonOther]}
        onPress={loadAndPlayAudio}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOwn ? '#fff' : '#0095f6'} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={isOwn ? '#fff' : '#0095f6'}
          />
        )}
      </TouchableOpacity>

      <View style={styles.voiceWaveformContainer}>
        {/* Waveform visualization */}
        <View style={styles.voiceWaveform}>
          {barHeights.map((h, i) => (
            <View
              key={i}
              style={[
                styles.voiceWaveformBar,
                {
                  height: h,
                  backgroundColor: isOwn
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(0,149,246,0.4)',
                },
              ]}
            />
          ))}
          {/* Progress overlay */}
          <Animated.View style={[styles.voiceProgressOverlay, progressStyle]}>
            {barHeights.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.voiceWaveformBar,
                  {
                    height: h,
                    backgroundColor: isOwn ? '#fff' : '#0095f6',
                  },
                ]}
              />
            ))}
          </Animated.View>
        </View>

        {/* Duration */}
        <Text style={[styles.voiceDuration, { color: isDark && !isOwn ? colors.textSecondary : undefined }, isOwn && styles.voiceDurationOwn]}>
          {isPlaying ? formatTime(position) : formatTime(audioDuration)}
        </Text>
      </View>
    </View>
  );
}

// Modern Composer Component with Voice Recording
function Composer({
  onSend,
  onTyping,
  onPickImage,
  onOpenCamera,
  onSendAudio,
  placeholder,
  pendingMedia,
  onClearMedia,
  isSending,
  colors,
  isDark,
}: {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onPickImage: () => void;
  onOpenCamera: () => void;
  onSendAudio: (uri: string, duration: number) => void;
  placeholder?: string;
  pendingMedia: PendingMedia[];
  onClearMedia: (index: number) => void;
  isSending: boolean;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  // Review state: after recording stops, user can relisten before sending
  const [reviewAudio, setReviewAudio] = useState<{ uri: string; duration: number } | null>(null);
  const [reviewSound, setReviewSound] = useState<Audio.Sound | null>(null);
  const [isReviewPlaying, setIsReviewPlaying] = useState(false);
  const [reviewPosition, setReviewPosition] = useState(0);
  const insets = useSafeAreaInsets();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recording animation
  const recordingScale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      recordingScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      recordingScale.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, recordingScale]);

  const recordingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingScale.value }],
  }));

  // Cleanup review sound on unmount
  useEffect(() => {
    return () => {
      if (reviewSound) {
        reviewSound.unloadAsync().catch(() => {});
      }
    };
  }, [reviewSound]);

  const handleChangeText = (newText: string) => {
    setText(newText);
    if (onTyping && newText.length > 0) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {}, 2000);
    }
  };

  const handleSend = () => {
    if (text.trim() || pendingMedia.length > 0) {
      onSend(text.trim());
      setText('');
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorAlert('Please allow microphone access to send voice messages.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorAlert('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const duration = recordingDuration;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setIsRecording(false);
      setRecordingDuration(0);
      recordingRef.current = null;

      // Enter review mode instead of sending immediately
      if (uri && duration > 0) {
        setReviewAudio({ uri, duration });
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setIsRecording(false);
      setRecordingDuration(0);
      recordingRef.current = null;
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // Review mode: play/pause the recorded audio
  const toggleReviewPlayback = async () => {
    if (!reviewAudio) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (reviewSound) {
        const status = await reviewSound.getStatusAsync();
        if (status.isLoaded) {
          if (isReviewPlaying) {
            await reviewSound.pauseAsync();
            setIsReviewPlaying(false);
          } else if (status.positionMillis >= (status.durationMillis || 0) - 100) {
            await reviewSound.setPositionAsync(0);
            await reviewSound.playAsync();
            setIsReviewPlaying(true);
            setReviewPosition(0);
          } else {
            await reviewSound.playAsync();
            setIsReviewPlaying(true);
          }
          return;
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: reviewAudio.uri },
        { shouldPlay: true },
        (status: any) => {
          if (status.isLoaded) {
            setReviewPosition(status.positionMillis / 1000);
            if (status.didJustFinish) {
              setIsReviewPlaying(false);
              setReviewPosition(0);
            }
          }
        }
      );
      setReviewSound(newSound);
      setIsReviewPlaying(true);
    } catch (error) {
      console.error('Failed to play review audio:', error);
    }
  };

  // Confirm and send the reviewed audio
  const confirmReviewAudio = async () => {
    if (!reviewAudio) return;
    // Stop playback if playing
    if (reviewSound) {
      try { await reviewSound.stopAsync(); await reviewSound.unloadAsync(); } catch {}
    }
    onSendAudio(reviewAudio.uri, reviewAudio.duration);
    setReviewAudio(null);
    setReviewSound(null);
    setIsReviewPlaying(false);
    setReviewPosition(0);
  };

  // Discard the reviewed audio
  const discardReviewAudio = async () => {
    if (reviewSound) {
      try { await reviewSound.stopAsync(); await reviewSound.unloadAsync(); } catch {}
    }
    setReviewAudio(null);
    setReviewSound(null);
    setIsReviewPlaying(false);
    setReviewPosition(0);
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSend = text.trim().length > 0 || pendingMedia.length > 0;

  return (
    <View style={[styles.composerContainer, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Animated.View style={[styles.recordingDot, recordingAnimatedStyle]} />
          <Text style={styles.recordingText}>Recording {formatDuration(recordingDuration)}</Text>
          <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecordingButton}>
            <Text style={[styles.cancelRecordingText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Audio review bar */}
      {reviewAudio && !isRecording && (
        <View style={[styles.reviewBar, { borderColor: colors.border }]}>
          <TouchableOpacity onPress={discardReviewAudio} style={styles.reviewDeleteButton} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleReviewPlayback} style={styles.reviewPlayButton} activeOpacity={0.7}>
            <Ionicons name={isReviewPlaying ? 'pause' : 'play'} size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.reviewWaveformArea}>
            <View style={styles.reviewWaveformTrack}>
              <View
                style={[
                  styles.reviewWaveformProgress,
                  {
                    width: reviewAudio.duration > 0
                      ? `${Math.min((reviewPosition / reviewAudio.duration) * 100, 100)}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.reviewDuration, { color: colors.textSecondary }]}>
            {isReviewPlaying ? formatDuration(Math.floor(reviewPosition)) : formatDuration(reviewAudio.duration)}
          </Text>

          <TouchableOpacity onPress={confirmReviewAudio} style={styles.reviewSendButton} activeOpacity={0.7}>
            <Ionicons name="send" size={20} color="#0095f6" />
          </TouchableOpacity>
        </View>
      )}

      {/* Pending media preview */}
      {pendingMedia.length > 0 && !isRecording && !reviewAudio && (
        <View style={styles.pendingMediaContainer}>
          {pendingMedia.map((media, index) => (
            <View key={index} style={styles.pendingMediaItem}>
              <Image source={{ uri: media.uri }} style={styles.pendingMediaImage} />
              <TouchableOpacity
                style={[styles.pendingMediaRemove, { backgroundColor: colors.background }]}
                onPress={() => onClearMedia(index)}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!reviewAudio && (
        <View style={styles.composerInner}>
          {/* Camera button */}
          {!isRecording && (
            <TouchableOpacity
              style={styles.composerButton}
              onPress={onOpenCamera}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#007AFF', '#0095f6']}
                style={styles.cameraButtonGradient}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Input area */}
          {!isRecording ? (
            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <TextInput
                ref={inputRef}
                style={[styles.composerInput, { color: colors.text }]}
                value={text}
                onChangeText={handleChangeText}
                placeholder={placeholder || 'Message...'}
                placeholderTextColor={colors.placeholder}
                multiline
                maxLength={1000}
              />

              {/* Gallery button inside input */}
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={onPickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={24} color={colors.iconSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recordingInputWrapper}>
              <Text style={[styles.recordingInputText, { color: colors.textSecondary }]}>
                Tap stop to finish recording
              </Text>
            </View>
          )}

          {/* Send or Mic button */}
          {canSend && !isRecording ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={isSending}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#0095f6" />
              ) : (
                <Ionicons name="send" size={22} color="#0095f6" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonRecording]}
              onPress={handleMicPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={24}
                color={isRecording ? '#fff' : colors.iconSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// Empty Chat State
function EmptyChat({ userName, colors }: { userName?: string; colors: ThemeColors }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyAvatarContainer}>
        <LinearGradient
          colors={['#007AFF', '#0095f6']}
          style={styles.emptyAvatarGradient}
        >
          <Ionicons name="chatbubbles" size={40} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {userName ? `Say hi to ${userName}!` : 'Send a message or share a photo'}
      </Text>
    </View>
  );
}

// Image Viewer Modal
function ImageViewerModal({
  visible,
  imageUrl,
  onClose,
}: {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.imageViewerOverlay} onPress={onClose}>
        <TouchableOpacity
          style={[styles.imageViewerClose, { top: insets.top + 16 }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUrl }}
          style={styles.imageViewerImage}
          resizeMode="contain"
        />
      </Pressable>
    </Modal>
  );
}

// Loading Screen
function LoadingScreen({ insets, colors, isDark }: { insets: { top: number }; colors: ThemeColors; isDark: boolean }) {
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading chat...</Text>
      </View>
    </View>
  );
}

// Error Screen
function ErrorScreen({
  insets,
  onBack,
  error,
  colors,
  isDark,
}: {
  insets: { top: number };
  onBack: () => void;
  error: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load chat</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
      </View>
    </View>
  );
}

// Main Chat Screen
export default function ChatThreadScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const prevMessageCountRef = useRef(0);
  const scrollToBottomOpacity = useSharedValue(0);
  const { colors, isDark } = useAppTheme();

  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<ChannelMember | null>(null);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');

  const { user } = useAuth();
  const removeMemberMutation = useRemoveMember();
  const leaveConversationMutation = useLeaveConversation();
  const updateConversationMutation = useUpdateConversation();

  const {
    messages,
    channelInfo,
    isLoading,
    error,
    isTyping,
    currentUserId,
    otherReadAt,
    sendMessage,
    sendVoiceMessage,
    sendTypingStart,
    deleteMessage,
  } = useConversation(conversationId);

  const isConcierge = channelInfo?.type === 'system';

  // Video calls removed

  // Mute state (not yet supported by backend)
  // TODO: Add mute/unmute API when backend supports it

  // Group messages by day and consecutive sender
  const messageGroups = React.useMemo((): MessageGroup[] => {
    const groups: MessageGroup[] = [];
    let currentDay: string | null = null;
    let lastSenderId: string | null = null;

    // Find the last own message that was read by the other person
    let lastOwnReadMsgId: string | null = null;
    if (otherReadAt) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.isOwn && msg.createdAt.getTime() <= otherReadAt.getTime()) {
          lastOwnReadMsgId = msg.id;
          break;
        }
      }
    }

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.createdAt);
      const dayKey = msgDate.toDateString();

      if (dayKey !== currentDay) {
        groups.push({ type: 'day', date: msgDate });
        currentDay = dayKey;
        lastSenderId = null;
      }

      // System messages break message groups
      if (msg.isSystem) {
        groups.push({
          type: 'message',
          message: msg,
          isGroupStart: true,
          showTime: false,
        });
        lastSenderId = null;
        return;
      }

      const isGroupStart = msg.userId !== lastSenderId;
      const nextMsg = messages[index + 1];
      const showTime =
        !nextMsg ||
        nextMsg.isSystem ||
        nextMsg.userId !== msg.userId ||
        nextMsg.createdAt.getTime() - msg.createdAt.getTime() > 5 * 60 * 1000;

      groups.push({
        type: 'message',
        message: msg,
        isGroupStart,
        showTime,
        isLastOwnBeforeRead: msg.id === lastOwnReadMsgId,
      });
      lastSenderId = msg.userId;
    });

    return groups;
  }, [messages, otherReadAt]);

  // Auto-scroll to bottom when new messages arrive (not when loading older history)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    if (newCount > prevCount && prevCount > 0) {
      // New message(s) added — scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else if (prevCount === 0 && newCount > 0) {
      // Initial load — scroll to bottom without animation
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const { startCall, startGroupCall } = useCall();
  const isGroupChat = channelInfo?.type === 'group';
  const handleStartCall = useCallback(
    async (video: boolean) => {
      if (isGroupChat) {
        if (!conversationId) return;
        const groupName = channelInfo?.name || 'Group Call';
        startGroupCall(conversationId, groupName, video);
        return;
      }
      const otherId = Number(channelInfo?.otherMember?.id);
      if (!otherId) return;
      startCall(otherId, channelInfo?.otherMember?.name, channelInfo?.otherMember?.image, video);
    },
    [channelInfo, startCall, startGroupCall, isGroupChat, conversationId]
  );

  const handleSend = useCallback(
    async (text: string) => {
      try {
        setIsSending(true);
        const attachments = pendingMedia.map((m) => ({ type: m.type, uri: m.uri }));
        await sendMessage(text, attachments.length > 0 ? attachments : undefined);
        setPendingMedia([]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage, pendingMedia]
  );

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map((asset) => ({
          uri: asset.uri,
          type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
          width: asset.width,
          height: asset.height,
        }));
        setPendingMedia((prev) => [...prev, ...newMedia].slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to pick image:', err);
    }
  }, []);

  const handleOpenCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPendingMedia((prev) => [
          ...prev,
          {
            uri: asset.uri,
            type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
            width: asset.width,
            height: asset.height,
          },
        ].slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to open camera:', err);
    }
  }, []);

  const handleClearMedia = useCallback((index: number) => {
    setPendingMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSendAudio = useCallback(
    async (uri: string, duration: number) => {
      try {
        setIsSending(true);
        // Upload and send the voice message
        await sendVoiceMessage(uri, duration);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err) {
        console.error('Failed to send voice message:', err);
        setErrorAlert('Failed to send voice message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [sendVoiceMessage]
  );

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
      scrollToBottomOpacity.value = distanceFromBottom > 200 ? 1 : 0;
    },
    [scrollToBottomOpacity]
  );

  const scrollToBottomStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrollToBottomOpacity.value, { duration: 200 }),
    transform: [{ scale: withSpring(scrollToBottomOpacity.value) }],
  }));

  const handleHeaderPress = useCallback(() => {
    setShowChatInfo(true);
  }, []);

  const handleGoToProfile = useCallback(() => {
    setShowChatInfo(false);
    if (channelInfo?.otherMember) {
      router.push({
        pathname: '/user-profile/[userId]',
        params: {
          userId: channelInfo.otherMember.id,
        },
      });
    }
  }, [channelInfo, router]);

  const handleMuteToggle = useCallback(async () => {
    // Mute/unmute not yet supported by backend
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isMuted]);

  const handleBlock = useCallback(() => {
    setShowBlockConfirm(true);
  }, []);

  const handleRemoveMember = useCallback(async () => {
    if (!removeMemberTarget || !conversationId) return;
    try {
      await removeMemberMutation.mutateAsync({
        conversationId,
        userId: removeMemberTarget.id,
      });
    } catch {
      // Silently fail — mutation invalidation handles UI
    }
    setRemoveMemberTarget(null);
  }, [removeMemberTarget, conversationId, removeMemberMutation]);

  const handleLeaveGroup = useCallback(async () => {
    if (!conversationId) return;
    try {
      await leaveConversationMutation.mutateAsync(conversationId);
      setShowChatInfo(false);
      setShowLeaveConfirm(false);
      router.back();
    } catch {
      // Silently fail
    }
  }, [conversationId, leaveConversationMutation, router]);

  const handleSaveGroupName = useCallback(async () => {
    if (!conversationId || !editGroupName.trim()) return;
    try {
      await updateConversationMutation.mutateAsync({
        conversationId,
        data: { name: editGroupName.trim() },
      });
      setIsEditingGroupName(false);
    } catch {
      // Silently fail
    }
  }, [conversationId, editGroupName, updateConversationMutation]);

  const handleMemberPress = useCallback((member: ChannelMember) => {
    if (member.id === user?.id) return;
    setShowChatInfo(false);
    router.push({
      pathname: '/user-profile/[userId]',
      params: { userId: String(member.id) },
    });
  }, [user?.id, router]);

  const handleLongPressMessage = useCallback(
    (message: ChatMessage) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedMessage(message);
    },
    []
  );

  const handleUnsend = useCallback(async () => {
    if (!selectedMessage) return;
    try {
      await deleteMessage(selectedMessage.id);
    } catch {
      setErrorAlert('Failed to unsend message.');
    } finally {
      setSelectedMessage(null);
    }
  }, [selectedMessage, deleteMessage]);

  const handleCopyMessage = useCallback(async () => {
    if (!selectedMessage?.text) return;
    try {
      await Clipboard.setStringAsync(selectedMessage.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to copy:', err);
    } finally {
      setSelectedMessage(null);
    }
  }, [selectedMessage]);

  const renderItem = useCallback(
    ({ item }: { item: MessageGroup }) => {
      if (item.type === 'day' && item.date) {
        return <DaySeparator date={item.date} colors={colors} />;
      }

      if (item.type === 'message' && item.message) {
        return (
          <MessageBubble
            message={item.message}
            isGroupStart={item.isGroupStart}
            showTime={item.showTime}
            onImagePress={setViewerImage}
            onLongPress={handleLongPressMessage}
            colors={colors}
            isDark={isDark}
            isLastOwnBeforeRead={item.isLastOwnBeforeRead}
            readAt={otherReadAt}
            isGroupChat={isGroupChat}
            isConciergeChat={isConcierge}
          />
        );
      }

      return null;
    },
    [colors, isDark, handleLongPressMessage, otherReadAt]
  );

  if (isLoading) {
    return <LoadingScreen insets={insets} colors={colors} isDark={isDark} />;
  }

  if (error) {
    return (
      <ErrorScreen
        insets={insets}
        onBack={() => router.back()}
        error={error.message}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ConfirmModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        title="Error"
        message={errorAlert || ''}
        alertOnly
        icon="alert-circle-outline"
      />
      <ConfirmModal
        visible={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={() => {
          setShowBlockConfirm(false);
          setShowChatInfo(false);
          router.back();
        }}
        title="Block User"
        message={`Are you sure you want to block ${channelInfo?.name}? They won't be able to message you.`}
        confirmLabel="Block"
        destructive
        icon="ban"
      />

      {/* Header - Instagram style */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={isConcierge ? undefined : handleHeaderPress}
          activeOpacity={isConcierge ? 1 : 0.7}
          disabled={isConcierge}
        >
          <View style={styles.headerAvatarContainer}>
            {isConcierge ? (
              <View style={styles.conciergeHeaderAvatar}>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </View>
            ) : (
              <Avatar uri={channelInfo?.otherMember?.image} size={40} colors={colors} />
            )}
            {!isConcierge && channelInfo?.isOnline && <View style={[styles.onlineIndicator, { borderColor: colors.background }]} />}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {channelInfo?.name || 'Chat'}
              </Text>
              {channelInfo?.otherMember?.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.verified} />
              )}
            </View>
            <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
              {isConcierge
                ? 'AI Assistant'
                : channelInfo?.type === 'group'
                  ? `${channelInfo.memberCount} members`
                  : channelInfo?.isOnline ? 'Active now' : 'Tap to view profile'}
            </Text>
          </View>
        </TouchableOpacity>

        {!isConcierge && (
          <>
            <TouchableOpacity style={styles.headerRight} onPress={() => handleStartCall(false)}>
              <Ionicons name="call-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerRight} onPress={() => handleStartCall(true)}>
              <Ionicons name="videocam-outline" size={26} color={colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messageGroups}
          keyExtractor={(item, index) =>
            item.type === 'day'
              ? `day-${item.date?.toISOString()}`
              : `msg-${item.message?.id || index}`
          }
          renderItem={renderItem}
          contentContainerStyle={
            messages.length === 0
              ? styles.emptyList
              : styles.messagesList
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          inverted={false}
          ListEmptyComponent={<EmptyChat userName={channelInfo?.name} colors={colors} />}
          ListFooterComponent={
            isTyping ? <TypingIndicator visible={isTyping} isConcierge={isConcierge} avatarUri={channelInfo?.otherMember?.image} colors={colors} isDark={isDark} /> : null
          }
        />

        {/* Scroll to Bottom Button */}
        <Animated.View style={[styles.scrollToBottom, scrollToBottomStyle]}>
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { backgroundColor: isDark ? colors.cardElevated : '#f0f0f0', borderColor: colors.border }]}
            onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Composer */}
        <Composer
          onSend={handleSend}
          onTyping={sendTypingStart}
          onPickImage={handlePickImage}
          onOpenCamera={handleOpenCamera}
          onSendAudio={handleSendAudio}
          placeholder={`Message ${channelInfo?.name || ''}...`}
          pendingMedia={pendingMedia}
          onClearMedia={handleClearMedia}
          isSending={isSending}
          colors={colors}
          isDark={isDark}
        />
      </KeyboardAvoidingView>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={!!viewerImage}
        imageUrl={viewerImage || ''}
        onClose={() => setViewerImage(null)}
      />

      {/* Instagram-style Message Context Menu */}
      <Modal
        visible={!!selectedMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <Pressable
          style={styles.contextMenuOverlay}
          onPress={() => setSelectedMessage(null)}
        >
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

          <View style={styles.contextMenuContent}>
            {/* Selected message preview */}
            {selectedMessage && (
              <Animated.View entering={FadeIn.duration(150)} style={[styles.contextMessagePreview, selectedMessage.isOwn && styles.contextMessagePreviewOwn]}>
                {selectedMessage.text ? (
                  <View style={[
                    styles.messageBubble,
                    selectedMessage.isOwn ? styles.messageBubbleOwn : [styles.messageBubbleOther, { backgroundColor: isDark ? colors.cardElevated : '#f0f0f0' }],
                  ]}>
                    <Text style={selectedMessage.isOwn ? styles.messageTextOwn : [styles.messageText, { color: colors.text }]}>
                      {selectedMessage.text}
                    </Text>
                  </View>
                ) : selectedMessage.attachments?.[0] ? (
                  <Image
                    source={{ uri: selectedMessage.attachments[0].thumbUrl || selectedMessage.attachments[0].url }}
                    style={styles.contextPreviewImage}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={[styles.contextTimestamp, { color: colors.textTertiary }]}>
                  {formatMessageTime(selectedMessage.createdAt)}
                </Text>
              </Animated.View>
            )}

            {/* Action Menu */}
            <Animated.View entering={FadeInDown.delay(50).duration(200)} style={[styles.actionMenu, { backgroundColor: isDark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)' }]}>
              {selectedMessage?.text ? (
                <TouchableOpacity
                  style={[styles.actionMenuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                  onPress={handleCopyMessage}
                  activeOpacity={0.6}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.text} />
                  <Text style={[styles.actionMenuText, { color: colors.text }]}>Copy</Text>
                </TouchableOpacity>
              ) : null}

              {selectedMessage?.isOwn && (
                <TouchableOpacity
                  style={[styles.actionMenuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
                  onPress={handleUnsend}
                  activeOpacity={0.6}
                >
                  <Ionicons name="arrow-undo-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionMenuText, { color: '#FF3B30' }]}>Unsend</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionMenuItem, styles.actionMenuItemLast]}
                onPress={() => {
                  // Forward / More placeholder
                  setSelectedMessage(null);
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                <Text style={[styles.actionMenuText, { color: colors.text }]}>More</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Pressable>
      </Modal>

      {/* Chat Info Screen - Instagram style */}
      <Modal
        visible={showChatInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatInfo(false)}
      >
        <View style={[styles.chatInfoContainer, { backgroundColor: colors.background }]}>
          {isDark && <DarkGradientBg />}
          {/* Back button */}
          <View style={[styles.chatInfoHeader, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.chatInfoBackButton}
              onPress={() => setShowChatInfo(false)}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar + Name */}
            <View style={styles.chatInfoProfile}>
              <View style={styles.chatInfoAvatarWrapper}>
                {isGroupChat ? (
                  <View style={[styles.chatInfoGroupAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <Ionicons name="people" size={40} color={colors.textSecondary} />
                  </View>
                ) : (
                  <Avatar uri={channelInfo?.otherMember?.image} size={100} colors={colors} />
                )}
              </View>
              {isEditingGroupName ? (
                <View style={styles.chatInfoEditNameRow}>
                  <TextInput
                    style={[styles.chatInfoEditNameInput, { color: colors.text, borderColor: colors.border }]}
                    value={editGroupName}
                    onChangeText={setEditGroupName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveGroupName}
                    placeholder="Group name"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TouchableOpacity onPress={handleSaveGroupName} style={styles.chatInfoEditNameSave}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditingGroupName(false)} style={styles.chatInfoEditNameSave}>
                    <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={isGroupChat ? () => { setEditGroupName(channelInfo?.name || ''); setIsEditingGroupName(true); } : undefined}
                  activeOpacity={isGroupChat ? 0.7 : 1}
                  style={styles.chatInfoNameRow}
                >
                  <Text style={[styles.chatInfoName, { color: colors.text }]}>
                    {channelInfo?.name || 'Chat'}
                  </Text>
                  {isGroupChat && (
                    <Ionicons name="pencil" size={16} color={colors.textTertiary} style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              )}
              {isGroupChat && (
                <Text style={[styles.chatInfoSubtitle, { color: colors.textSecondary }]}>
                  {channelInfo?.memberCount} members
                </Text>
              )}
            </View>

            {/* Action buttons row */}
            <View style={styles.chatInfoActions}>
              {!isGroupChat && (
                <TouchableOpacity style={styles.chatInfoActionBtn} onPress={handleGoToProfile} activeOpacity={0.7}>
                  <View style={[styles.chatInfoActionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <Ionicons name="person-outline" size={22} color={colors.text} />
                  </View>
                  <Text style={[styles.chatInfoActionLabel, { color: colors.text }]}>Profile</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.chatInfoActionBtn} onPress={handleMuteToggle} activeOpacity={0.7}>
                <View style={[styles.chatInfoActionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                  <Ionicons name={isMuted ? 'notifications-off' : 'notifications-outline'} size={22} color={colors.text} />
                </View>
                <Text style={[styles.chatInfoActionLabel, { color: colors.text }]}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              {!isGroupChat && (
                <TouchableOpacity style={styles.chatInfoActionBtn} onPress={handleBlock} activeOpacity={0.7}>
                  <View style={[styles.chatInfoActionIcon, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
                    <Ionicons name="ban-outline" size={22} color="#FF3B30" />
                  </View>
                  <Text style={[styles.chatInfoActionLabel, { color: '#FF3B30' }]}>Block</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Group Members */}
            {isGroupChat && channelInfo?.members && (
              <View style={[styles.chatInfoSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.chatInfoSectionTitle, { color: colors.textTertiary }]}>
                  Members
                </Text>
                {channelInfo.members.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.chatInfoMemberRow}
                      onPress={() => handleMemberPress(member)}
                      activeOpacity={isSelf ? 1 : 0.7}
                    >
                      <Avatar uri={member.image} size={44} colors={colors} />
                      <View style={styles.chatInfoMemberInfo}>
                        <View style={styles.chatInfoMemberNameRow}>
                          <Text style={[styles.chatInfoMemberName, { color: colors.text }]} numberOfLines={1}>
                            {member.name}{isSelf ? ' (You)' : ''}
                          </Text>
                          {member.isVerified && (
                            <MaterialCommunityIcons name="check-decagram" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        {member.userName && (
                          <Text style={[styles.chatInfoMemberUsername, { color: colors.textTertiary }]} numberOfLines={1}>
                            @{member.userName}
                          </Text>
                        )}
                      </View>
                      {!isSelf && user?.id === channelInfo?.createdById && (
                        <TouchableOpacity
                          style={styles.chatInfoMemberAction}
                          onPress={() => setRemoveMemberTarget(member)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="person-remove-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Leave Group */}
            {isGroupChat && (
              <View style={[styles.chatInfoSection, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.chatInfoDangerRow}
                  onPress={() => setShowLeaveConfirm(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="exit-outline" size={22} color="#FF3B30" />
                  <Text style={styles.chatInfoDangerText}>Leave Group</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Remove member confirm */}
        <ConfirmModal
          visible={!!removeMemberTarget}
          onClose={() => setRemoveMemberTarget(null)}
          onConfirm={handleRemoveMember}
          title="Remove Member"
          message={`Remove ${removeMemberTarget?.name} from this group?`}
          confirmLabel="Remove"
          destructive
          icon="person-remove-outline"
        />

        {/* Leave group confirm */}
        <ConfirmModal
          visible={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={handleLeaveGroup}
          title="Leave Group"
          message="Are you sure you want to leave this group? You won't receive messages from this conversation anymore."
          confirmLabel="Leave"
          destructive
          icon="exit-outline"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  conciergeHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34c759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 1,
  },
  headerRight: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Content
  content: {
    flex: 1,
  },
  messagesList: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // Day separator
  daySeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  daySeparatorText: {
    fontSize: 12,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0, 0, 0, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
// System message
  systemMessageRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemMessageText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  systemMessageTime: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Lato_600SemiBold',
    marginBottom: 2,
    marginLeft: 4,
  },
  // Message styles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatarWrapper: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  bubbleWrapper: {
    alignItems: 'flex-start',
  },
  bubbleWrapperOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  messageBubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageBubbleOwn: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageBubbleGroupOther: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 22,
  },
  messageBubbleGroupOwn: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 22,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  messageTextOwn: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.45)',
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeOwn: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },
  readReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginLeft: 4,
    gap: 3,
  },
  readReceiptRowOwn: {
    justifyContent: 'flex-end',
    marginRight: 4,
    marginLeft: 0,
  },
  readReceiptText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: '#0095f6',
  },
  // Attachments
  attachmentWrapper: {
    marginBottom: 4,
  },
  attachmentWrapperOwn: {
    alignItems: 'flex-end',
  },
  attachmentContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
  },
  attachmentImage: {
    borderRadius: 18,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  videoPlayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  // Voice message player
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 200,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  voiceMessageOwn: {
    backgroundColor: '#007AFF',
  },
  voiceMessageOther: {
    backgroundColor: '#f0f0f0',
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voicePlayButtonOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  voicePlayButtonOther: {
    backgroundColor: 'rgba(0, 149, 246, 0.15)',
  },
  voiceWaveformContainer: {
    flex: 1,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
    overflow: 'hidden',
  },
  voiceWaveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  voiceDuration: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  voiceDurationOwn: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  typingConciergeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Composer
  composerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  pendingMediaContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 12,
    gap: 8,
  },
  pendingMediaItem: {
    position: 'relative',
  },
  pendingMediaImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  pendingMediaRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  composerInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  composerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  composerInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#1a1a1a',
    maxHeight: 100,
    paddingVertical: 4,
  },
  galleryButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#ff3b30',
    borderRadius: 22,
  },
  // Recording indicator
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
    marginRight: 10,
  },
  recordingText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#ff3b30',
  },
  cancelRecordingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelRecordingText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  // Audio review bar
  reviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 149, 246, 0.08)',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 149, 246, 0.2)',
    gap: 10,
  },
  reviewDeleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewWaveformArea: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewWaveformTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 149, 246, 0.2)',
    overflow: 'hidden',
  },
  reviewWaveformProgress: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#0095f6',
  },
  reviewDuration: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    minWidth: 32,
    textAlign: 'center',
  },
  reviewSendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  recordingInputText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
  },
  // Scroll to bottom
  scrollToBottom: {
    position: 'absolute',
    right: 16,
    bottom: 100,
  },
  scrollToBottomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyAvatarContainer: {
    marginBottom: 20,
  },
  emptyAvatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
  },
  // Image viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  // Instagram-style context menu
  contextMenuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuContent: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
    alignItems: 'stretch',
    gap: 8,
  },
  contextMessagePreview: {
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  contextMessagePreviewOwn: {
    alignItems: 'flex-end',
  },
  contextPreviewImage: {
    width: MAX_IMAGE_WIDTH * 0.6,
    height: MAX_IMAGE_WIDTH * 0.6,
    borderRadius: 18,
  },
  contextTimestamp: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  actionMenu: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  actionMenuItemLast: {
    borderBottomWidth: 0,
  },
  actionMenuText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  // Chat Info Screen
  chatInfoContainer: {
    flex: 1,
  },
  chatInfoHeader: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  chatInfoBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfoProfile: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  chatInfoAvatarWrapper: {
    marginBottom: 16,
  },
  chatInfoName: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
  },
  chatInfoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 24,
  },
  chatInfoActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  chatInfoActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfoActionLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  chatInfoGroupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInfoSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  chatInfoEditNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  chatInfoEditNameInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatInfoEditNameSave: {
    padding: 4,
  },
  chatInfoSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  chatInfoSectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chatInfoMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  chatInfoMemberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatInfoMemberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInfoMemberName: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
    flexShrink: 1,
  },
  chatInfoMemberUsername: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  chatInfoMemberAction: {
    padding: 8,
  },
  chatInfoDangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  chatInfoDangerText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#FF3B30',
  },
});
