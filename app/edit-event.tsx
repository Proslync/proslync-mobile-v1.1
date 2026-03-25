// Edit Event Screen - Single-page form matching create event layout

import { useToast } from '@/components/shared/toast';
import {
  BasicInfoStep,
  DateTimeStep,
  LocationStep,
  DetailsStep,
  PricingStep,
} from '@/components/event-form';
import { useEditEventForm, useUpdateEvent, useEvent } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { GlassView } from 'expo-glass-effect';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  liquidGlass,
  glassBorder,
  glassText,
  glassSurfaceTint,
} from '@/constants/glass/liquid-glass';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function DoorCoverInput() {
  const { isDark } = useAppTheme();
  const { control } = useFormContext<EventFormData>();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  return (
    <View style={styles.formSection}>
      <Text style={[styles.sectionLabel, { color: t.primary }]}>Door Cover</Text>
      <Text style={[styles.sectionHint, { color: t.muted }]}>
        Optional cover charge at the door
      </Text>
      <Controller
        control={control}
        name="doorCoverPrice"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.glassInputRow, { borderColor: border }]}>
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={12} style={StyleSheet.absoluteFill} />
            <Text style={[styles.dollarSign, { color: t.tertiary }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: t.primary }]}
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              placeholderTextColor={t.faint}
              keyboardType="decimal-pad"
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>
        )}
      />
    </View>
  );
}

export default function EditEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const { isDark } = useAppTheme();

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const eventId = id ? Number(id) : undefined;
  const { data: event, isLoading } = useEvent(isNaN(eventId as number) ? undefined : eventId);
  const [existingFlyerUrl, setExistingFlyerUrl] = React.useState<string | null>(null);
  const [existingFlyerMediaType, setExistingFlyerMediaType] = React.useState<'image' | 'video' | null>(null);

  const { form, canSubmit, isPaid, resetWithEvent } = useEditEventForm();
  const updateEvent = useUpdateEvent();

  React.useEffect(() => {
    if (!event) return;
    resetWithEvent({
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      maxCapacity: event.maxCapacity,
      minimumAge: event.minimumAge,
      isPublic: event.isPublic,
      isPaid: event.isPaid,
      doorCoverPriceCents: event.doorCoverPriceCents,
    });
    if (event.flyer?.url) {
      setExistingFlyerUrl(event.flyer.url);
      setExistingFlyerMediaType(event.flyer.mimeType?.startsWith('video/') ? 'video' : 'image');
    } else if (event.imageUrl) {
      setExistingFlyerUrl(event.imageUrl);
      setExistingFlyerMediaType('image');
    }
  }, [event]);

  const handleFlyerRemoved = () => {
    setExistingFlyerUrl(null);
    setExistingFlyerMediaType(null);
  };

  const onSubmit = (data: EventFormData) => {
    if (!event) return;
    const parsedData = parseEventFormData(data);
    updateEvent.mutate(
      { eventId: event.id, data: parsedData, flyerUri: data.flyerUri },
      {
        onSuccess: () => {
          showSuccess('Event updated successfully!');
          router.back();
        },
        onError: (error) => {
          console.error('Mutation error:', error);
          showError(error.message || 'Failed to update event. Please try again.');
        },
      }
    );
  };

  const onSubmitError = (errors: Record<string, any>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, error]) => {
        const fieldName =
          field === 'name' ? 'Event name'
          : field === 'location' ? 'Location'
          : field === 'startDate' ? 'Start date'
          : field === 'endDate' ? 'End date'
          : field;
        return `${fieldName}: ${error?.message || 'Invalid'}`;
      })
      .filter(Boolean)
      .join(', ');
    showError(errorMessages || 'Please fix errors in the form');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <DarkGradientBg />
        <ActivityIndicator size="large" color={t.primary} />
        <Text style={[styles.loadingText, { color: t.muted }]}>Loading event...</Text>
      </View>
    );
  }

  return (
    <FormProvider {...form}>
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <DarkGradientBg />

        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            style={[styles.backButton, { borderColor: border }]}
            onPress={() => router.back()}
          >
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
            <Ionicons name="arrow-back" size={20} color={t.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.primary }]}>Edit Event</Text>
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
            <BasicInfoStep
              existingFlyerUrl={existingFlyerUrl}
              existingFlyerMediaType={existingFlyerMediaType}
              onFlyerRemoved={handleFlyerRemoved}
            />
            <View style={[styles.divider, { backgroundColor: border }]} />
            <DateTimeStep />
            <View style={[styles.divider, { backgroundColor: border }]} />
            <LocationStep />
            <View style={[styles.divider, { backgroundColor: border }]} />
            <DetailsStep />
            <View style={[styles.divider, { backgroundColor: border }]} />
            <DoorCoverInput />
            {isPaid && (
              <>
                <View style={[styles.divider, { backgroundColor: border }]} />
                <PricingStep />
              </>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16, borderTopColor: border }]}>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
              onPress={form.handleSubmit(onSubmit, onSubmitError)}
              disabled={!canSubmit || updateEvent.isPending}
            >
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />
              {updateEvent.isPending ? (
                <ActivityIndicator color={t.primary} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={t.primary} />
                  <Text style={[styles.submitButtonText, { color: t.primary }]}>Save Changes</Text>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  headerSpacer: {
    width: 36,
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
    marginVertical: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 12,
  },
  glassInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    overflow: 'hidden',
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
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
