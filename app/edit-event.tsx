import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { eventsApi, UpdateEventDto } from '@/lib/api/events';
import { useToast } from '@/components/shared/toast';
import type { Event } from '@/lib/types/events.types';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';

type Step = 'basic' | 'datetime' | 'location' | 'details';

const STEPS: { key: Step; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'basic', title: 'Basic Info', icon: 'create-outline' },
  { key: 'datetime', title: 'Date & Time', icon: 'calendar-outline' },
  { key: 'location', title: 'Location', icon: 'location-outline' },
  { key: 'details', title: 'Details', icon: 'settings-outline' },
];

export default function EditEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();

  const [currentStep, setCurrentStep] = React.useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [event, setEvent] = React.useState<Event | null>(null);

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [flyerUri, setFlyerUri] = React.useState<string | null>(null);
  const [existingFlyerUrl, setExistingFlyerUrl] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 4 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const [location, setLocation] = React.useState('');
  const [maxCapacity, setMaxCapacity] = React.useState('');
  const [minimumAge, setMinimumAge] = React.useState('21');
  const [isPublic, setIsPublic] = React.useState(true);

  // Load event data
  React.useEffect(() => {
    async function loadEvent() {
      if (!id) {
        showError('No event ID provided');
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        const eventId = parseInt(id, 10);
        if (isNaN(eventId)) {
          throw new Error('Invalid event ID');
        }

        const eventData = await eventsApi.getEvent(eventId);
        setEvent(eventData);

        // Populate form fields
        setName(eventData.name || '');
        setDescription(eventData.description || '');
        setLocation(eventData.location || '');
        setMaxCapacity(eventData.maxCapacity?.toString() || '');
        setMinimumAge(eventData.minimumAge?.toString() || '21');
        setIsPublic(eventData.isPublic ?? true);

        if (eventData.startDate) {
          setStartDate(new Date(eventData.startDate));
        }
        if (eventData.endDate) {
          setEndDate(new Date(eventData.endDate));
        }

        // Set existing flyer URL
        if (eventData.flyer?.url) {
          setExistingFlyerUrl(eventData.flyer.url);
        } else if (eventData.imageUrl) {
          setExistingFlyerUrl(eventData.imageUrl);
        }
      } catch (error: any) {
        console.error('[EditEvent] Error loading event:', error);
        showError(error?.message || 'Failed to load event');
        router.back();
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const canGoNext = () => {
    switch (currentStep) {
      case 'basic':
        return name.trim().length > 0;
      case 'datetime':
        return startDate < endDate;
      case 'location':
        return location.trim().length > 0;
      case 'details':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    } else {
      router.back();
    }
  };

  const pickFlyer = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError('Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFlyerUri(result.assets[0].uri);
      setExistingFlyerUrl(null); // Clear existing flyer when new one is selected
    }
  };

  const removeFlyer = () => {
    setFlyerUri(null);
    setExistingFlyerUrl(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting || !event) return;

    setIsSubmitting(true);
    try {
      const eventData: UpdateEventDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: location.trim(),
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
        minimumAge: minimumAge ? parseInt(minimumAge, 10) : undefined,
        isPublic,
      };

      await eventsApi.updateEvent(event.id, eventData);

      // Upload new flyer if selected
      if (flyerUri) {
        try {
          await eventsApi.uploadFlyer(event.id, flyerUri);
          console.log('[EditEvent] Flyer uploaded successfully');
        } catch (flyerError) {
          console.log('[EditEvent] Could not upload flyer:', flyerError);
        }
      }

      showSuccess('Event updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('[EditEvent] Error:', error);
      showError(error?.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const displayFlyerUri = flyerUri || existingFlyerUrl;

  // Dynamic styles
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.textTertiary,
    },
    headerTitle: {
      color: colors.text,
    },
    stepTitle: {
      color: colors.text,
    },
    input: {
      backgroundColor: colors.input,
      color: colors.text,
      borderColor: colors.inputBorder,
    },
    helperText: {
      color: colors.textTertiary,
    },
    dateButton: {
      backgroundColor: colors.input,
      borderColor: colors.inputBorder,
    },
    dateButtonText: {
      color: colors.text,
    },
    switchLabel: {
      color: colors.text,
    },
    switchDescription: {
      color: colors.textTertiary,
    },
    progressDot: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    progressLine: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    bottomActions: {
      borderTopColor: colors.border,
    },
    flyerPickerButton: {
      backgroundColor: colors.input,
      borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    flyerPickerHint: {
      color: colors.textTertiary,
    },
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>What's your event called?</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={name}
              onChangeText={setName}
              placeholder="Event name"
              placeholderTextColor={colors.placeholder}
            />
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle, { marginTop: 24 }]}>Describe your event</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicStyles.input]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell people what to expect..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.stepTitle, dynamicStyles.stepTitle, { marginTop: 24 }]}>Event Flyer</Text>
            {displayFlyerUri ? (
              <View style={styles.flyerPreviewContainer}>
                <Image source={{ uri: displayFlyerUri }} style={styles.flyerPreview} />
                <TouchableOpacity style={styles.flyerRemoveButton} onPress={removeFlyer}>
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.flyerChangeButton} onPress={pickFlyer}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.flyerChangeText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.flyerPickerButton, dynamicStyles.flyerPickerButton]} onPress={pickFlyer}>
                <Ionicons name="image-outline" size={32} color="#8b5cf6" />
                <Text style={styles.flyerPickerText}>Add Event Flyer</Text>
                <Text style={[styles.flyerPickerHint, dynamicStyles.flyerPickerHint]}>Tap to upload an image</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        );

      case 'datetime':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>When does it start?</Text>
            <TouchableOpacity
              style={[styles.dateButton, dynamicStyles.dateButton]}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
              <Text style={[styles.dateButtonText, dynamicStyles.dateButtonText]}>
                {formatDate(startDate)} at {formatTime(startDate)}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.stepTitle, dynamicStyles.stepTitle, { marginTop: 24 }]}>When does it end?</Text>
            <TouchableOpacity
              style={[styles.dateButton, dynamicStyles.dateButton]}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
              <Text style={[styles.dateButtonText, dynamicStyles.dateButtonText]}>
                {formatDate(endDate)} at {formatTime(endDate)}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) {
                    setStartDate(date);
                    if (date >= endDate) {
                      setEndDate(new Date(date.getTime() + 4 * 60 * 60 * 1000));
                    }
                  }
                }}
                textColor={colors.text}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="spinner"
                minimumDate={startDate}
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
                textColor={colors.text}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            )}
          </Animated.View>
        );

      case 'location':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>Where is it happening?</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter address or venue name"
              placeholderTextColor={colors.placeholder}
            />
            <Text style={[styles.helperText, dynamicStyles.helperText]}>
              Enter the full address where your event will take place
            </Text>
          </Animated.View>
        );

      case 'details':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>Capacity</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              placeholder="Max attendees (optional)"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
            />

            <Text style={[styles.stepTitle, dynamicStyles.stepTitle, { marginTop: 24 }]}>Minimum Age</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={minimumAge}
              onChangeText={setMinimumAge}
              placeholder="21"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, dynamicStyles.switchLabel]}>Public Event</Text>
                <Text style={[styles.switchDescription, dynamicStyles.switchDescription]}>
                  Anyone can see and RSVP to your event
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', true: '#8b5cf6' }}
                thumbColor="#fff"
              />
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, dynamicStyles.container]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading event...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {isDark && <DarkGradientBg />}
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Edit Event</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {STEPS.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                dynamicStyles.progressDot,
                index <= currentStepIndex && styles.progressDotActive,
              ]}
            >
              <Ionicons
                name={step.icon}
                size={16}
                color={index <= currentStepIndex ? '#fff' : colors.textTertiary}
              />
            </View>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  dynamicStyles.progressLine,
                  index < currentStepIndex && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, dynamicStyles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          {currentStepIndex === STEPS.length - 1 ? (
            <TouchableOpacity
              style={[styles.submitButton, !canGoNext() && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!canGoNext() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, !canGoNext() && styles.buttonDisabled]}
              onPress={goNext}
              disabled={!canGoNext()}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#8b5cf6',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#8b5cf6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  switchDescription: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  flyerPickerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerPickerText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#8b5cf6',
    marginTop: 8,
  },
  flyerPickerHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  flyerPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  flyerPreview: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  flyerRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  flyerChangeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  flyerChangeText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
});
