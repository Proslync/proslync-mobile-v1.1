// Edit Event Screen - Multi-step form with FormProvider pattern

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useToast } from '@/components/shared/toast';
import {
  BasicInfoStep,
  DateTimeStep,
  LocationStep,
  DetailsStep,
} from '@/components/event-form';
import type { EventFormStep } from '@/hooks';
import { useEditEventForm, useUpdateEvent } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { eventsApi } from '@/lib/api/events';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import type { Event } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { FormProvider } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Step configuration
const STEPS: {
  key: EventFormStep;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
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

  // Loading and event state
  const [isLoading, setIsLoading] = React.useState(true);
  const [event, setEvent] = React.useState<Event | null>(null);
  const [existingFlyerUrl, setExistingFlyerUrl] = React.useState<string | null>(null);

  // Form hook
  const {
    form,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    goNext,
    goBack: formGoBack,
    canGoNext,
    resetWithEvent,
  } = useEditEventForm();

  // Mutation hook
  const updateEvent = useUpdateEvent();

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

        // Populate form with event data
        resetWithEvent({
          name: eventData.name,
          description: eventData.description,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          location: eventData.location,
          maxCapacity: eventData.maxCapacity,
          minimumAge: eventData.minimumAge,
          isPublic: eventData.isPublic,
        });

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

  const handleBack = () => {
    if (isFirstStep) {
      router.back();
    } else {
      formGoBack();
    }
  };

  const handleNext = async () => {
    await goNext();
  };

  // Clear existing flyer when user removes it
  const handleFlyerRemoved = () => {
    setExistingFlyerUrl(null);
  };

  // Final submit handler - called only when form is valid
  const onSubmit = (data: EventFormData) => {
    if (!event) return;

    console.log('[EditEvent] Submitting:', JSON.stringify(data, null, 2));

    const parsedData = parseEventFormData(data);
    updateEvent.mutate(
      {
        eventId: event.id,
        data: parsedData,
        flyerUri: data.flyerUri,
      },
      {
        onSuccess: () => {
          showSuccess('Event updated successfully!');
          router.back();
        },
        onError: (error) => {
          console.error('[EditEvent] Mutation error:', error);
          showError(error.message || 'Failed to update event. Please try again.');
        },
      }
    );
  };

  // Error handler for invalid submit
  const onSubmitError = (errors: Record<string, any>) => {
    console.log('[EditEvent] Validation errors:', errors);

    const errorMessages = Object.entries(errors)
      .map(([field, error]) => {
        const fieldName =
          field === 'name'
            ? 'Event name'
            : field === 'location'
              ? 'Location'
              : field === 'startDate'
                ? 'Start date'
                : field === 'endDate'
                  ? 'End date'
                  : field;
        return `${fieldName}: ${error?.message || 'Invalid'}`;
      })
      .filter(Boolean)
      .join(', ');

    showError(errorMessages || 'Please fix errors in the form');
  };

  // Render current step component
  const renderStepContent = () => {
    switch (STEPS[currentStepIndex]?.key) {
      case 'basic':
        return (
          <BasicInfoStep
            existingFlyerUrl={existingFlyerUrl}
            onFlyerRemoved={handleFlyerRemoved}
          />
        );
      case 'datetime':
        return <DateTimeStep />;
      case 'location':
        return <LocationStep />;
      case 'details':
        return <DetailsStep />;
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading event...</Text>
      </View>
    );
  }

  return (
    <FormProvider {...form}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}

        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Event</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View key={step.key} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
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
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
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
          <View
            style={[
              styles.bottomActions,
              { paddingBottom: insets.bottom + 16, borderTopColor: colors.border },
            ]}
          >
            {isLastStep ? (
              <TouchableOpacity
                style={[styles.submitButton, !canGoNext && styles.buttonDisabled]}
                onPress={form.handleSubmit(onSubmit, onSubmitError)}
                disabled={!canGoNext || updateEvent.isPending}
              >
                {updateEvent.isPending ? (
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
                style={[styles.nextButton, !canGoNext && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={!canGoNext}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </FormProvider>
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
});
