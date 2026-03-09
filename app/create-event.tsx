// Create Event Screen - Single-page form with all fields

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useToast } from '@/components/shared/toast';
import {
  BasicInfoStep,
  DateTimeStep,
  LocationStep,
  DetailsStep,
  PricingStep,
} from '@/components/event-form';
import { useCreateEvent, useEventForm } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function DoorCoverInput() {
  const { colors, isDark } = useAppTheme();
  const { control } = useFormContext<EventFormData>();

  return (
    <View style={sectionStyles.section}>
      <Text style={[sectionStyles.sectionTitle, { color: colors.text }]}>Door Cover</Text>
      <Text style={[sectionStyles.sectionSubtitle, { color: colors.textTertiary }]}>
        Optional cover charge at the door
      </Text>
      <Controller
        control={control}
        name="doorCoverPrice"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[sectionStyles.inputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <Text style={[sectionStyles.dollarSign, { color: colors.textSecondary }]}>$</Text>
            <TextInput
              style={[sectionStyles.amountInput, { color: colors.text }]}
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>
        )}
      />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  dollarSign: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Lato_400Regular',
  },
});

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();

  const { form, canSubmit, isPaid } = useEventForm();
  const createEvent = useCreateEvent();

  // Final submit handler
  const onSubmit = (data: EventFormData) => {
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
          console.error('Mutation error:', error);
          showError(error.message || 'Failed to create event. Please try again.');
        },
      }
    );
  };

  const onSubmitError = (errors: Record<string, any>) => {
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}

        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Event</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

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
            <BasicInfoStep />
            <View style={styles.divider} />
            <DateTimeStep />
            <View style={styles.divider} />
            <LocationStep />
            <View style={styles.divider} />
            <DetailsStep />
            <View style={styles.divider} />
            <DoorCoverInput />
            {isPaid && (
              <>
                <View style={styles.divider} />
                <PricingStep />
              </>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View
            style={[
              styles.bottomActions,
              { paddingBottom: insets.bottom + 16, borderTopColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: accentColor },
                !canSubmit && styles.buttonDisabled,
              ]}
              onPress={form.handleSubmit(onSubmit, onSubmitError)}
              disabled={!canSubmit || createEvent.isPending}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
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
