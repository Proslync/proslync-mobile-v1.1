// Create Event Screen - Single-page form with all fields

import { useToast } from '@/components/shared/toast';
import {
  BasicInfoStep,
  DateTimeStep,
  LocationStep,
  DetailsStep,
  PricingStep,
} from '@/components/event-form';
import { ArtistFormModal } from '@/components/artists/artist-form-modal';
import { useCreateEvent, useEventForm } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import { artistsApi } from '@/lib/api/artists';
import type { CreateEventArtistRequest } from '@/lib/types/artists.types';
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

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { isDark } = useAppTheme();

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const { form, canSubmit, isPaid } = useEventForm();
  const createEvent = useCreateEvent();

  const [pendingArtists, setPendingArtists] = React.useState<CreateEventArtistRequest[]>([]);
  const [showArtistModal, setShowArtistModal] = React.useState(false);

  const handleAddArtist = React.useCallback((data: CreateEventArtistRequest) => {
    setPendingArtists((prev) => [...prev, data]);
    setShowArtistModal(false);
  }, []);

  const handleRemoveArtist = React.useCallback((index: number) => {
    setPendingArtists((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = (data: EventFormData) => {
    const parsedData = parseEventFormData(data);
    createEvent.mutate(
      {
        data: parsedData,
        flyerUri: data.flyerUri,
        shouldPublish: true,
      },
      {
        onSuccess: async ({ event }) => {
          for (const artist of pendingArtists) {
            try {
              await artistsApi.createEventArtist(event.id, artist);
            } catch (err) {
              console.warn('Failed to create artist:', err);
            }
          }
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
          <Text style={[styles.headerTitle, { color: t.primary }]}>Create Event</Text>
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
            <View style={[styles.divider, { backgroundColor: border }]} />

            {/* Artists Section */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionLabel, { color: t.primary }]}>Artists</Text>
              <Text style={[styles.sectionHint, { color: t.muted }]}>
                Add performers to your event lineup
              </Text>
              {pendingArtists.map((artist, index) => (
                <View
                  key={index}
                  style={[styles.artistRow, { borderColor: border }]}
                >
                  <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={12} style={StyleSheet.absoluteFill} />
                  <Ionicons name="musical-notes-outline" size={18} color={t.tertiary} />
                  <View style={styles.artistInfo}>
                    <Text style={[styles.artistName, { color: t.primary }]} numberOfLines={1}>
                      {artist.userName || artist.phoneNumber}
                    </Text>
                    {artist.description ? (
                      <Text style={[styles.artistDesc, { color: t.muted }]} numberOfLines={1}>
                        {artist.description}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveArtist(index)} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={20} color={t.muted} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addArtistBtn, { borderColor: border }]}
                onPress={() => setShowArtistModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={t.tertiary} />
                <Text style={[styles.addArtistText, { color: t.tertiary }]}>Add Artist</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <ArtistFormModal
            visible={showArtistModal}
            onClose={() => setShowArtistModal(false)}
            onSubmitCreate={handleAddArtist}
          />

          {/* Bottom Action */}
          <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16, borderTopColor: border }]}>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
              onPress={form.handleSubmit(onSubmit, onSubmitError)}
              disabled={!canSubmit || createEvent.isPending}
            >
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />
              {createEvent.isPending ? (
                <ActivityIndicator color={t.primary} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={t.primary} />
                  <Text style={[styles.submitButtonText, { color: t.primary }]}>Create Event</Text>
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
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  artistDesc: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  addArtistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  addArtistText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
});
