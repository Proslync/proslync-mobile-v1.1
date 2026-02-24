// Create Event Screen - Multi-step form with FormProvider pattern

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useToast } from '@/components/shared/toast';
import {
  BasicInfoStep,
  DateTimeStep,
  LocationStep,
  DetailsStep,
  PricingStep,
} from '@/components/event-form';
import type { EventFormStep } from '@/hooks';
import { useCreateEvent, useEventForm } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

// Step rendering configuration
const STEP_CONFIG: Record<
  EventFormStep,
  {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    component: React.ComponentType;
  }
> = {
  basic: { title: 'Basic Info', icon: 'create-outline', component: BasicInfoStep },
  datetime: { title: 'Date & Time', icon: 'calendar-outline', component: DateTimeStep },
  location: { title: 'Location', icon: 'location-outline', component: LocationStep },
  details: { title: 'Details', icon: 'settings-outline', component: DetailsStep },
  pricing: { title: 'Pricing', icon: 'pricetag-outline', component: PricingStep },
};

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();

  // Form hook
  const {
    form,
    currentStepIndex,
    steps,
    isFirstStep,
    isLastStep,
    goNext,
    goBack: formGoBack,
    canGoNext,
  } = useEventForm();

  // Mutation hook
  const createEvent = useCreateEvent();

  // Get current step config
  const currentStepKey = steps[currentStepIndex];
  const CurrentStepComponent = STEP_CONFIG[currentStepKey]?.component;

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

  // Final submit handler - called only when form is valid
  const onSubmit = (data: EventFormData) => {
    console.log('[CreateEvent] Submitting:', JSON.stringify(data, null, 2));

    const parsedData = parseEventFormData(data);
    createEvent.mutate(
      {
        data: parsedData,
        flyerUri: data.flyerUri,
        shouldPublish: true,
      },
      {
        onSuccess: ({ event }) => {
          showSuccess('Event created successfully!');
          router.replace(`/event/${event.id}`);
        },
        onError: (error) => {
          console.error('[CreateEvent] Mutation error:', error);
          showError(error.message || 'Failed to create event. Please try again.');
        },
      }
    );
  };

  // Error handler for invalid submit
  const onSubmitError = (errors: Record<string, any>) => {
    console.log('[CreateEvent] Validation errors:', errors);

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

  const accentColor = isDark ? '#FFFFFF' : '#3897F0';

  return (
    <FormProvider {...form}>
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFFFFF' }]}>
        {isDark && <DarkGradientBg />}

        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Event</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((stepKey, index) => {
            const config = STEP_CONFIG[stepKey];
            return (
              <View key={stepKey} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                    index <= currentStepIndex && {
                      backgroundColor: accentColor,
                    },
                  ]}
                >
                  <Ionicons
                    name={config.icon}
                    size={16}
                    color={
                      index <= currentStepIndex
                        ? isDark ? '#000' : '#fff'
                        : colors.textTertiary
                    }
                  />
                </View>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                      index < currentStepIndex && {
                        backgroundColor: accentColor,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
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
            {CurrentStepComponent && <CurrentStepComponent />}
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
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: accentColor,
                  },
                  !canGoNext && styles.buttonDisabled,
                ]}
                onPress={form.handleSubmit(onSubmit, onSubmitError)}
                disabled={!canGoNext || createEvent.isPending}
              >
                {createEvent.isPending ? (
                  <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={isDark ? '#000' : '#fff'} />
                    <Text style={[styles.actionButtonText, { color: isDark ? '#000' : '#fff' }]}>
                      Create Event
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: accentColor,
                  },
                  !canGoNext && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canGoNext}
              >
                <Text style={[styles.actionButtonText, { color: isDark ? '#000' : '#fff' }]}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={20} color={isDark ? '#000' : '#fff'} />
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
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
