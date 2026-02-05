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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { eventsApi, CreateEventDto } from '@/lib/api/events';
import { useToast } from '@/components/shared/toast';

type Step = 'basic' | 'datetime' | 'location' | 'details';

const STEPS: { key: Step; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'basic', title: 'Basic Info', icon: 'create-outline' },
  { key: 'datetime', title: 'Date & Time', icon: 'calendar-outline' },
  { key: 'location', title: 'Location', icon: 'location-outline' },
  { key: 'details', title: 'Details', icon: 'settings-outline' },
];

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [currentStep, setCurrentStep] = React.useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [flyerUri, setFlyerUri] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 4 * 60 * 60 * 1000)); // 4 hours later
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const [location, setLocation] = React.useState('');
  const [maxCapacity, setMaxCapacity] = React.useState('');
  const [minimumAge, setMinimumAge] = React.useState('21');
  const [isPublic, setIsPublic] = React.useState(true);

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
      aspect: [3, 4], // Portrait aspect ratio for flyers
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFlyerUri(result.assets[0].uri);
    }
  };

  const removeFlyer = () => {
    setFlyerUri(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const eventData: CreateEventDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: location.trim(),
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
        minimumAge: minimumAge ? parseInt(minimumAge, 10) : undefined,
        isPublic,
      };

      const event = await eventsApi.createEvent(eventData);

      // Upload flyer if selected
      if (flyerUri) {
        try {
          await eventsApi.uploadFlyer(event.id, flyerUri);
          console.log('[CreateEvent] Flyer uploaded successfully');
        } catch (flyerError) {
          console.log('[CreateEvent] Could not upload flyer:', flyerError);
          // Continue anyway - event is created
        }
      }

      // Auto-publish the event so it appears in feed
      try {
        await eventsApi.publishEvent(event.id);
      } catch (publishError) {
        console.log('[CreateEvent] Could not auto-publish:', publishError);
      }

      showSuccess('Event created successfully!');
      router.replace(`/event/${event.id}`);
    } catch (error: any) {
      console.error('[CreateEvent] Error:', error);
      showError(error?.message || 'Failed to create event. Please try again.');
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your event called?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Event name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
            />
            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Describe your event</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell people what to expect..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Event Flyer</Text>
            {flyerUri ? (
              <View style={styles.flyerPreviewContainer}>
                <Image source={{ uri: flyerUri }} style={styles.flyerPreview} />
                <TouchableOpacity style={styles.flyerRemoveButton} onPress={removeFlyer}>
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.flyerChangeButton} onPress={pickFlyer}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.flyerChangeText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.flyerPickerButton} onPress={pickFlyer}>
                <Ionicons name="image-outline" size={32} color="#8b5cf6" />
                <Text style={styles.flyerPickerText}>Add Event Flyer</Text>
                <Text style={styles.flyerPickerHint}>Tap to upload an image</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        );

      case 'datetime':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>When does it start?</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
              <Text style={styles.dateButtonText}>
                {formatDate(startDate)} at {formatTime(startDate)}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>When does it end?</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
              <Text style={styles.dateButtonText}>
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
                    // Auto-adjust end date if needed
                    if (date >= endDate) {
                      setEndDate(new Date(date.getTime() + 4 * 60 * 60 * 1000));
                    }
                  }
                }}
                textColor="#fff"
                themeVariant="dark"
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
                textColor="#fff"
                themeVariant="dark"
              />
            )}
          </Animated.View>
        );

      case 'location':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Where is it happening?</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter address or venue name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
            />
            <Text style={styles.helperText}>
              Enter the full address where your event will take place
            </Text>
          </Animated.View>
        );

      case 'details':
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Capacity</Text>
            <TextInput
              style={styles.input}
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              placeholder="Max attendees (optional)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
            />

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Minimum Age</Text>
            <TextInput
              style={styles.input}
              value={minimumAge}
              onChangeText={setMinimumAge}
              placeholder="21"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Public Event</Text>
                <Text style={styles.switchDescription}>
                  Anyone can see and RSVP to your event
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8b5cf6' }}
                thumbColor="#fff"
              />
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {STEPS.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                index <= currentStepIndex && styles.progressDotActive,
              ]}
            >
              <Ionicons
                name={step.icon}
                size={16}
                color={index <= currentStepIndex ? '#fff' : 'rgba(255,255,255,0.4)'}
              />
            </View>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.progressLine,
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
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
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
                  <Text style={styles.submitButtonText}>Create Event</Text>
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
    backgroundColor: '#000',
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
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#8b5cf6',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
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
    color: '#fff',
  },
  switchDescription: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
    color: 'rgba(255,255,255,0.5)',
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
