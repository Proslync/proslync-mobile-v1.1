// Chat Thread Screen - Instagram/Snapchat-style messaging
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
import { useChannel, type ChatMessage } from '@/hooks/use-channel';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme, type ThemeColors } from '@/hooks/use-app-theme';

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

// Message Bubble Component - Instagram/Snapchat style
function MessageBubble({
  message,
  isGroupStart,
  showTime,
  onImagePress,
  colors,
  isDark,
}: {
  message: ChatMessage;
  isGroupStart?: boolean;
  showTime?: boolean;
  onImagePress?: (url: string) => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const isOwn = message.isOwn;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = message.text && message.text.trim().length > 0;

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

      <View style={styles.messageContent}>
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
        {hasText && (
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
        )}

        {/* Timestamp */}
        {showTime && (
          <Text style={[styles.messageTime, { color: colors.textTertiary }, isOwn && styles.messageTimeOwn]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        )}
      </View>
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
function TypingIndicator({ visible, userName, colors, isDark }: { visible: boolean; userName?: string; colors: ThemeColors; isDark: boolean }) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.typingContainer}>
      <View style={[styles.typingBubble, { backgroundColor: isDark ? colors.cardElevated : 'rgba(0, 0, 0, 0.06)' }]}>
        <AnimatedDot delay={0} isDark={isDark} />
        <AnimatedDot delay={200} isDark={isDark} />
        <AnimatedDot delay={400} isDark={isDark} />
      </View>
      {userName && <Text style={[styles.typingText, { color: colors.textTertiary }]}>{userName} is typing...</Text>}
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
      Alert.alert('Error', 'Failed to play voice message');
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
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.voiceWaveformBar,
                {
                  height: 4 + Math.random() * 12,
                  backgroundColor: isOwn
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(0,149,246,0.4)',
                },
              ]}
            />
          ))}
          {/* Progress overlay */}
          <Animated.View style={[styles.voiceProgressOverlay, progressStyle]}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.voiceWaveformBar,
                  {
                    height: 4 + Math.random() * 12,
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
        Alert.alert('Permission Required', 'Please allow microphone access to send voice messages.');
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
      Alert.alert('Error', 'Failed to start recording. Please try again.');
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

      // Send the audio if we have a valid URI and duration > 0
      if (uri && duration > 0) {
        onSendAudio(uri, duration);
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

      {/* Pending media preview */}
      {pendingMedia.length > 0 && !isRecording && (
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

      <View style={styles.composerInner}>
        {/* Camera button */}
        {!isRecording && (
          <TouchableOpacity
            style={styles.composerButton}
            onPress={onOpenCamera}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#405DE6', '#833AB4', '#C13584']}
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
              Tap mic to send, or cancel
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
    </View>
  );
}

// Empty Chat State
function EmptyChat({ userName, colors }: { userName?: string; colors: ThemeColors }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyAvatarContainer}>
        <LinearGradient
          colors={['#405DE6', '#833AB4', '#C13584', '#E1306C', '#F56040']}
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
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const scrollToBottomOpacity = useSharedValue(0);
  const { colors, isDark } = useAppTheme();

  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const {
    messages,
    channelInfo,
    isLoading,
    error,
    isTyping,
    sendMessage,
    sendVoiceMessage,
    sendTypingStart,
  } = useChannel(conversationId);

  // Group messages by day and consecutive sender
  const messageGroups = React.useMemo((): MessageGroup[] => {
    const groups: MessageGroup[] = [];
    let currentDay: string | null = null;
    let lastSenderId: string | null = null;

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.createdAt);
      const dayKey = msgDate.toDateString();

      if (dayKey !== currentDay) {
        groups.push({ type: 'day', date: msgDate });
        currentDay = dayKey;
        lastSenderId = null;
      }

      const isGroupStart = msg.userId !== lastSenderId;
      const nextMsg = messages[index + 1];
      const showTime =
        !nextMsg ||
        nextMsg.userId !== msg.userId ||
        nextMsg.createdAt.getTime() - msg.createdAt.getTime() > 5 * 60 * 1000;

      groups.push({
        type: 'message',
        message: msg,
        isGroupStart,
        showTime,
      });
      lastSenderId = msg.userId;
    });

    return groups;
  }, [messages]);

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
        Alert.alert('Error', 'Failed to send voice message. Please try again.');
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

  const handleProfilePress = useCallback(() => {
    if (channelInfo?.otherMember) {
      router.push({
        pathname: '/user/[username]',
        params: {
          username: channelInfo.otherMember.name || channelInfo.otherMember.id,
          userId: channelInfo.otherMember.id,
        },
      });
    }
  }, [channelInfo, router]);

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
            colors={colors}
            isDark={isDark}
          />
        );
      }

      return null;
    },
    [colors, isDark]
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

      {/* Header - Instagram style */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatarContainer}>
            <Avatar uri={channelInfo?.otherMember?.image} size={40} colors={colors} />
            {channelInfo?.isOnline && <View style={[styles.onlineIndicator, { borderColor: colors.background }]} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {channelInfo?.name || 'Chat'}
            </Text>
            <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
              {channelInfo?.isOnline ? 'Active now' : 'Tap to view profile'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="call-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="videocam-outline" size={26} color={colors.text} />
        </TouchableOpacity>
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
          onContentSizeChange={() => {
            if (flatListRef.current && messages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={<EmptyChat userName={channelInfo?.name} colors={colors} />}
          ListFooterComponent={
            isTyping ? <TypingIndicator visible={isTyping} userName={channelInfo?.name} colors={colors} isDark={isDark} /> : null
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 36,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  typingText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.45)',
    marginLeft: 8,
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
});
