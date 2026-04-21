import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatISO, format } from 'date-fns';
import { CountryPicker } from '@/components/auth/country-picker';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { EventArtist } from '@/lib/types/artists.types';

function buildSpotifyEmbedHtml(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const idx = segments.findIndex((s) => s === 'playlist');
    if (idx === -1 || !segments[idx + 1]) return undefined;
    const src = `https://open.spotify.com/embed/playlist/${segments[idx + 1]}?utm_source=generator&theme=0`;
    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:transparent}</style>
</head><body>
<iframe style="border-radius:12px" src="${src}" width="100%" height="352" frameBorder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
</body></html>`;
  } catch {
    return undefined;
  }
}

// Reuse phone validation from auth flow
const STRIP_LEADING_ZERO = ['+380', '+44', '+49', '+33', '+39', '+34', '+81', '+82', '+61', '+55', '+972'];

interface ArtistFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitCreate?: (data: {
    phoneNumber: string;
    userName?: string;
    description?: string;
    startTime: string;
    endTime: string;
    playlistUrl?: string;
  }) => void;
  onSubmitEdit?: (data: {
    userName?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    playlistUrl?: string;
  }) => void;
  loading?: boolean;
  artist?: EventArtist | null;
}

export function ArtistFormModal({
  visible,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
  loading = false,
  artist,
}: ArtistFormModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const isEdit = !!artist;

  // Phone state (create only)
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Shared fields
  const [userName, setUserName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [playlistUrl, setPlaylistUrl] = useState('');

  // Picker visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Validation
  const [error, setError] = useState<string | null>(null);
  const [embedLoading, setEmbedLoading] = useState(true);

  // Spotify embed preview
  const embedHtml = useMemo(() => buildSpotifyEmbedHtml(playlistUrl), [playlistUrl]);

  // Reset / populate when modal opens
  useEffect(() => {
    if (!visible) return;
    setError(null);

    if (artist) {
      setUserName(artist.userName || artist.userFullName || '');
      setDescription(artist.description || '');
      setStartTime(new Date(artist.startTime));
      setEndTime(new Date(artist.endTime));
      setPlaylistUrl(artist.playlistUrl || '');
    } else {
      setCountryCode('+1');
      setPhoneNumber('');
      setUserName('');
      setDescription('');
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
      setPlaylistUrl('');
    }
  }, [visible, artist]);

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhone(text));
    if (error) setError(null);
  };

  const buildFullPhone = (): string => {
    let digits = phoneNumber.replace(/\D/g, '');
    if (STRIP_LEADING_ZERO.includes(countryCode) && digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    return `${countryCode}${digits}`;
  };

  const formatDateTime = (date: Date) => {
    try {
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return 'Select date & time';
    }
  };

  const handleSubmit = () => {
    if (!isEdit) {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length < 6) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }

    if (isEdit && onSubmitEdit) {
      onSubmitEdit({
        userName: userName.trim() || undefined,
        description: description.trim() || undefined,
        startTime: formatISO(startTime),
        endTime: formatISO(endTime),
        playlistUrl: playlistUrl.trim() || undefined,
      });
    } else if (onSubmitCreate) {
      onSubmitCreate({
        phoneNumber: buildFullPhone(),
        userName: userName.trim() || undefined,
        description: description.trim() || undefined,
        startTime: formatISO(startTime),
        endTime: formatISO(endTime),
        playlistUrl: playlistUrl.trim() || undefined,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top || 16, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEdit ? 'Edit Artist' : 'Add Artist'}
          </Text>
          <TouchableOpacity style={[styles.closeButton, { overflow: 'hidden' }]} onPress={onClose}>
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={16}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Phone Number (create only) */}
          {!isEdit && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
              <View style={[styles.phoneRow, { borderColor: colors.inputBorder, overflow: 'hidden' }]}>
                <GlassView
                  {...liquidGlass.fill}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <CountryPicker selectedCode={countryCode} onSelect={setCountryCode} />
                <Text style={[styles.dialCode, { color: colors.text }]}>{countryCode}</Text>
                <TextInput
                  style={[styles.phoneInput, { color: colors.text }]}
                  placeholder="(555) 555-5555"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  maxLength={14}
                  textContentType="telephoneNumber"
                />
              </View>
            </View>
          )}

          {/* Artist Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Artist Name</Text>
            <View style={[styles.input, { borderColor: colors.inputBorder, overflow: 'hidden' }]}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="Enter artist / stage name"
                placeholderTextColor={colors.placeholder}
                value={userName}
                onChangeText={setUserName}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <View style={[styles.input, styles.textArea, { borderColor: colors.inputBorder, overflow: 'hidden' }]}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <TextInput
                style={[styles.inputInner, { color: colors.text, minHeight: 52, paddingTop: 0 }]}
                placeholder="Artist bio or set description (optional)"
                placeholderTextColor={colors.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Start Time */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Start Time *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.inputBorder, overflow: 'hidden' }]}
              onPress={() => setShowStartPicker(true)}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDateTime(startTime)}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="datetime"
                display="spinner"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) {
                    setStartTime(date);
                    if (endTime <= date) {
                      setEndTime(new Date(date.getTime() + 2 * 60 * 60 * 1000));
                    }
                  }
                }}
                textColor={colors.text}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            )}
          </View>

          {/* End Time */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>End Time *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.inputBorder, overflow: 'hidden' }]}
              onPress={() => setShowEndPicker(true)}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDateTime(endTime)}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="datetime"
                display="spinner"
                minimumDate={startTime}
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndTime(date);
                }}
                textColor={colors.text}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            )}
          </View>

          {/* Spotify Playlist URL */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Spotify Playlist URL</Text>
            <View style={[styles.input, { borderColor: colors.inputBorder, overflow: 'hidden' }]}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <TextInput
                style={[styles.inputInner, { color: colors.text }]}
                placeholder="https://open.spotify.com/playlist/..."
                placeholderTextColor={colors.placeholder}
                value={playlistUrl}
                onChangeText={(text) => {
                  setPlaylistUrl(text);
                  setEmbedLoading(true);
                }}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {embedHtml && (
              <View style={styles.embedPreview}>
                <Text style={[styles.embedLabel, { color: colors.textTertiary }]}>Preview</Text>
                <View style={styles.embedContainer}>
                  {embedLoading && (
                    <View style={styles.embedLoader}>
                      <ActivityIndicator size="small" color={colors.textTertiary} />
                    </View>
                  )}
                  <WebView
                    source={{ html: embedHtml, baseUrl: 'https://open.spotify.com' }}
                    originWhitelist={['https://*']}
                    style={[styles.embed, embedLoading && styles.embedHidden]}
                    scrollEnabled={false}
                    bounces={false}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    onLoadEnd={() => setEmbedLoading(false)}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Error */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { overflow: 'hidden' }, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.7}
          >
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>
                {isEdit ? 'Save Changes' : 'Add Artist'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  inputInner: {
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  dialCode: {
    fontSize: 15,
    paddingRight: 4,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    paddingRight: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  embedPreview: {
    marginTop: 12,
  },
  embedLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  embedContainer: {
    height: 352,
    borderRadius: 12,
    overflow: 'hidden',
  },
  embed: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  embedHidden: {
    opacity: 0,
  },
  embedLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
