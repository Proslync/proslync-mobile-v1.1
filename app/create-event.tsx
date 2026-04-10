// Create Event Screen — mirrors event detail page layout but fully editable

import { useToast } from '@/components/shared/toast';
import { PricingStep } from '@/components/event-form';
import { ArtistFormModal } from '@/components/artists/artist-form-modal';
import { useCreateEvent, useEventForm } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import { artistsApi } from '@/lib/api/artists';
import type { CreateEventArtistRequest } from '@/lib/types/artists.types';
import { DRESS_CODE_OPTIONS } from '@/lib/constants/dress-codes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 16;

type CreateTab = 'overview' | 'tables' | 'lineup' | 'map';

function formatDateDisplay(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Select date & time';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDoorsTime(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'TBA';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { organizationId: orgIdParam } = useLocalSearchParams<{ organizationId?: string }>();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();
  const { user: authUser } = useAuth();

  const { form, canSubmit, isPaid } = useEventForm();
  const createEvent = useCreateEvent();

  const [activeTab, setActiveTab] = React.useState<CreateTab>('overview');
  const [pendingArtists, setPendingArtists] = React.useState<CreateEventArtistRequest[]>([]);
  const [showArtistModal, setShowArtistModal] = React.useState(false);
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  const flyerUri = form.watch('flyerUri');
  const startDate = form.watch('startDate');
  const dressCode = form.watch('dressCode');

  const handlePickFlyer = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Photo library permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      form.setValue('flyerUri', asset.uri);
      form.setValue('flyerMediaType', asset.type === 'video' ? 'video' : 'image');
    }
  };

  const handleDressCodePicker = () => {
    const options = [...DRESS_CODE_OPTIONS.map((o) => o.label), 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1 },
      (index) => {
        if (index < DRESS_CODE_OPTIONS.length) {
          form.setValue('dressCode', DRESS_CODE_OPTIONS[index].value);
        }
      },
    );
  };

  const onSubmit = (data: EventFormData) => {
    const parsedData = parseEventFormData(data);
    if (orgIdParam) parsedData.organizationId = parseInt(orgIdParam, 10);
    createEvent.mutate(
      { data: parsedData, flyerUri: data.flyerUri, shouldPublish: true },
      {
        onSuccess: async ({ event }) => {
          for (const artist of pendingArtists) {
            try { await artistsApi.createEventArtist(event.id, artist); } catch {}
          }
          showSuccess('Event created!');
          router.replace(`/event/${event.id}`);
        },
        onError: (error) => showError(error.message || 'Failed to create event'),
      },
    );
  };

  const onSubmitError = () => showError('Please fill in all required fields');

  const renderOverview = () => (
    <Animated.View entering={FadeInDown.duration(400)}>
      {/* Organizer */}
      <LiquidGlassView effect="regular" style={s.glassCard}>
        <View style={s.organizerInner}>
          <Image
            source={authUser?.avatar?.url ? { uri: authUser.avatar.url } : DefaultAvatarImage}
            style={s.organizerAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.organizerName, { color: colors.text }]} numberOfLines={1}>
              {authUser?.firstName || authUser?.userName || 'You'}
            </Text>
            <Text style={[s.organizerRole, { color: colors.textSecondary }]}>Organizer</Text>
          </View>
        </View>
      </LiquidGlassView>

      {/* Flyer */}
      <LiquidGlassView effect="regular" style={s.flyerCard}>
        <TouchableOpacity onPress={handlePickFlyer} activeOpacity={0.85} style={s.flyerTouch}>
          {flyerUri ? (
            <Image source={{ uri: flyerUri }} style={s.flyerImage} resizeMode="cover" />
          ) : (
            <View style={s.flyerPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="rgba(0,0,0,0.3)" />
              <Text style={s.flyerPlaceholderText}>Add Event Flyer</Text>
            </View>
          )}
        </TouchableOpacity>
      </LiquidGlassView>

      {/* Details */}
      <LiquidGlassView effect="regular" style={s.detailsCard}>
        <Controller
          control={form.control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={[s.eventNameInput, { color: colors.text }]}
              value={value}
              onChangeText={onChange}
              placeholder="Event name"
              placeholderTextColor="rgba(0,0,0,0.35)"
              maxLength={100}
            />
          )}
        />
        <TouchableOpacity style={s.dateRow} onPress={() => setShowStartPicker(true)}>
          <Ionicons name="calendar-outline" size={16} color="rgba(0,0,0,0.5)" />
          <Text style={[s.dateText, { color: colors.textSecondary }]}>
            {formatDateDisplay(startDate)}
          </Text>
        </TouchableOpacity>
        <Controller
          control={form.control}
          name="location"
          render={({ field: { value, onChange } }) => (
            <View style={s.dateRow}>
              <Ionicons name="location-outline" size={16} color="rgba(0,0,0,0.5)" />
              <TextInput
                style={[s.locationInput, { color: colors.textSecondary }]}
                value={value}
                onChangeText={onChange}
                placeholder="Event location"
                placeholderTextColor="rgba(0,0,0,0.35)"
              />
            </View>
          )}
        />
      </LiquidGlassView>

      {/* Quick Details Grid */}
      <View style={s.gridRow}>
        <LiquidGlassView effect="regular" style={s.gridCell}>
          <Text style={s.gridLabel}>DRESS CODE</Text>
          <TouchableOpacity onPress={handleDressCodePicker}>
            <Text style={[s.gridValue, { color: colors.text }]}>
              {dressCode ? DRESS_CODE_OPTIONS.find((o) => o.value === dressCode)?.label || dressCode : 'None'}
            </Text>
          </TouchableOpacity>
        </LiquidGlassView>
        <LiquidGlassView effect="regular" style={s.gridCell}>
          <Text style={s.gridLabel}>AGE</Text>
          <Controller
            control={form.control}
            name="minimumAge"
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[s.gridValue, s.gridInput, { color: colors.text }]}
                value={value || ''}
                onChangeText={onChange}
                placeholder="21+"
                placeholderTextColor="rgba(0,0,0,0.35)"
                keyboardType="number-pad"
              />
            )}
          />
        </LiquidGlassView>
      </View>
      <View style={s.gridRow}>
        <LiquidGlassView effect="regular" style={s.gridCell}>
          <Text style={s.gridLabel}>COVER</Text>
          <Controller
            control={form.control}
            name="doorCoverPrice"
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={[s.gridValue, s.gridInput, { color: colors.text }]}
                value={value || ''}
                onChangeText={onChange}
                placeholder="Free"
                placeholderTextColor="rgba(0,0,0,0.35)"
                keyboardType="decimal-pad"
              />
            )}
          />
        </LiquidGlassView>
        <LiquidGlassView effect="regular" style={s.gridCell}>
          <Text style={s.gridLabel}>DOORS</Text>
          <Text style={[s.gridValue, { color: colors.text }]}>
            {formatDoorsTime(startDate)}
          </Text>
        </LiquidGlassView>
      </View>

      {/* Description */}
      <LiquidGlassView effect="regular" style={s.descriptionCard}>
        <Controller
          control={form.control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={[s.descriptionInput, { color: colors.text }]}
              value={value || ''}
              onChangeText={onChange}
              placeholder="Describe your event..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
          )}
        />
      </LiquidGlassView>

      {/* Toggles */}
      <View style={s.toggleRow}>
        <LiquidGlassView effect="regular" style={s.toggleCard}>
          <Text style={[s.toggleLabel, { color: colors.text }]}>Public Event</Text>
          <Controller
            control={form.control}
            name="isPublic"
            render={({ field: { value, onChange } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </LiquidGlassView>
        <LiquidGlassView effect="regular" style={s.toggleCard}>
          <Text style={[s.toggleLabel, { color: colors.text }]}>Paid Event</Text>
          <Controller
            control={form.control}
            name="isPaid"
            render={({ field: { value, onChange } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </LiquidGlassView>
      </View>

      {/* Date pickers */}
      {showStartPicker && (
        <Controller
          control={form.control}
          name="startDate"
          render={({ field: { value, onChange } }) => (
            <DateTimePicker
              value={value instanceof Date ? value : new Date()}
              mode="datetime"
              display="spinner"
              onChange={(_, date) => {
                setShowStartPicker(false);
                if (date) {
                  onChange(date);
                  const endDate = form.getValues('endDate');
                  if (endDate && date >= endDate) {
                    form.setValue('endDate', new Date(date.getTime() + 4 * 3600000));
                  }
                  setShowEndPicker(true);
                }
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          )}
        />
      )}
      {showEndPicker && (
        <Controller
          control={form.control}
          name="endDate"
          render={({ field: { value, onChange } }) => (
            <DateTimePicker
              value={value instanceof Date ? value : new Date(Date.now() + 4 * 3600000)}
              mode="datetime"
              display="spinner"
              minimumDate={form.getValues('startDate') || new Date()}
              onChange={(_, date) => {
                setShowEndPicker(false);
                if (date) onChange(date);
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          )}
        />
      )}
    </Animated.View>
  );

  const renderTables = () => (
    <View style={s.tabSection}>
      {isPaid ? (
        <PricingStep />
      ) : (
        <View style={s.emptyTab}>
          <Ionicons name="pricetag-outline" size={40} color="rgba(0,0,0,0.2)" />
          <Text style={s.emptyTabText}>Enable "Paid Event" on Overview to add pricing</Text>
        </View>
      )}
    </View>
  );

  const renderLineup = () => (
    <View style={s.tabSection}>
      {pendingArtists.map((artist, index) => (
        <LiquidGlassView key={index} effect="regular" style={s.artistCard}>
          <View style={s.artistInner}>
            <Ionicons name="musical-notes-outline" size={18} color="rgba(0,0,0,0.5)" />
            <View style={{ flex: 1 }}>
              <Text style={[s.artistName, { color: colors.text }]} numberOfLines={1}>
                {artist.userName || artist.phoneNumber}
              </Text>
              {artist.description ? (
                <Text style={s.artistDesc} numberOfLines={1}>{artist.description}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => setPendingArtists((p) => p.filter((_, i) => i !== index))}>
              <Ionicons name="close-circle" size={20} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
          </View>
        </LiquidGlassView>
      ))}
      <TouchableOpacity style={s.addArtistBtn} onPress={() => setShowArtistModal(true)} activeOpacity={0.7}>
        <Ionicons name="add" size={20} color="#000" />
        <Text style={s.addArtistText}>Add Artist</Text>
      </TouchableOpacity>
      {pendingArtists.length === 0 && (
        <View style={s.emptyTab}>
          <Ionicons name="people-outline" size={40} color="rgba(0,0,0,0.2)" />
          <Text style={s.emptyTabText}>No artists added yet</Text>
        </View>
      )}
    </View>
  );

  const renderMap = () => (
    <View style={s.tabSection}>
      <LiquidGlassView effect="regular" style={s.mapCard}>
        <Controller
          control={form.control}
          name="location"
          render={({ field: { value, onChange } }) => (
            <View style={s.mapInputRow}>
              <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
              <TextInput
                style={s.mapInput}
                value={value}
                onChangeText={onChange}
                placeholder="Search for a location"
                placeholderTextColor="rgba(0,0,0,0.35)"
              />
            </View>
          )}
        />
      </LiquidGlassView>
      <View style={s.emptyTab}>
        <Ionicons name="map-outline" size={40} color="rgba(0,0,0,0.2)" />
        <Text style={s.emptyTabText}>Map preview will appear here</Text>
      </View>
    </View>
  );

  return (
    <FormProvider {...form}>
      <View style={[s.container, { backgroundColor: '#f2f2f2' }]}>
        {/* Fixed pill tab row */}
        <View style={[s.pillRowContainer, { top: insets.top + 16 }]}>
          <View style={s.pillRowContent}>
            {(['overview', 'tables', 'lineup', 'map'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'overview' ? 'Overview' : tab === 'tables' ? 'Tables' : tab === 'lineup' ? 'Lineup' : 'Map';
              return (
                <Pressable key={tab} style={s.pillFilter} onPress={() => setActiveTab(tab)}>
                  <View style={s.pillGlassLayer} pointerEvents="none">
                    <GlassView
                      {...liquidGlass.surface}
                      tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}
                      borderRadius={19}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                  <Text style={[s.pillText, isActive && s.pillTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Content */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView
            style={s.flex}
            contentContainerStyle={[s.scrollContent, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'tables' && renderTables()}
            {activeTab === 'lineup' && renderLineup()}
            {activeTab === 'map' && renderMap()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom action bar */}
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.bottomRow}>
            <TouchableOpacity style={s.bottomIcon} onPress={() => router.back()} activeOpacity={0.7}>
              <GlassView {...liquidGlass.surface} tintColor="rgba(0,0,0,0.06)" borderRadius={24} style={StyleSheet.absoluteFill} />
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.createButton, (!canSubmit || createEvent.isPending) && s.createButtonDisabled]}
              onPress={form.handleSubmit(onSubmit, onSubmitError)}
              disabled={!canSubmit || createEvent.isPending}
              activeOpacity={0.85}
            >
              {createEvent.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.createButtonText}>Create Event</Text>
              )}
            </TouchableOpacity>
            <View style={s.bottomIcon} />
          </View>
        </View>

        <ArtistFormModal
          visible={showArtistModal}
          onClose={() => setShowArtistModal(false)}
          onSubmitCreate={(data) => { setPendingArtists((p) => [...p, data]); setShowArtistModal(false); }}
        />
      </View>
    </FormProvider>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Pill row
  pillRowContainer: { position: 'absolute', left: CARD_MARGIN, right: CARD_MARGIN, zIndex: 100 },
  pillRowContent: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pillFilter: { flex: 1, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillGlassLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  pillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  pillTextActive: { color: 'rgba(0,0,0,0.8)' },

  // Scroll
  scrollContent: { paddingHorizontal: CARD_MARGIN },

  // Organizer
  glassCard: { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  organizerInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  organizerAvatar: { width: 36, height: 36, borderRadius: 18 },
  organizerName: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  organizerRole: { fontSize: 12, fontFamily: 'Lato_400Regular', marginTop: 1 },

  // Flyer
  flyerCard: { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  flyerTouch: { width: '100%' },
  flyerImage: { width: '100%', aspectRatio: 4 / 3 },
  flyerPlaceholder: { width: '100%', aspectRatio: 4 / 3, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  flyerPlaceholderText: { fontSize: 14, fontFamily: 'Lato_700Bold', color: 'rgba(0,0,0,0.35)', marginTop: 8 },

  // Details
  detailsCard: { borderRadius: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 14, overflow: 'hidden', gap: 8 },
  eventNameInput: { fontSize: 20, fontFamily: 'Lato_700Bold', padding: 0 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, fontFamily: 'Lato_400Regular' },
  locationInput: { flex: 1, fontSize: 14, fontFamily: 'Lato_400Regular', padding: 0 },

  // Grid
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCell: { flex: 1, borderRadius: 14, padding: 14, overflow: 'hidden', alignItems: 'center', gap: 6 },
  gridLabel: { fontSize: 10, fontFamily: 'Lato_700Bold', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 },
  gridValue: { fontSize: 16, fontFamily: 'Lato_700Bold', textAlign: 'center' },
  gridInput: { padding: 0, minWidth: 50, textAlign: 'center' },

  // Description
  descriptionCard: { borderRadius: 16, marginBottom: 10, padding: 14, overflow: 'hidden' },
  descriptionInput: { fontSize: 15, fontFamily: 'Lato_400Regular', minHeight: 80, padding: 0, textAlignVertical: 'top' },

  // Toggles
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  toggleCard: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 14, fontFamily: 'Lato_700Bold' },

  // Tab sections
  tabSection: { paddingTop: 8 },
  emptyTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTabText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.4)', textAlign: 'center' },

  // Artists
  artistCard: { borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  artistInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  artistName: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  artistDesc: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.5)', marginTop: 2 },
  addArtistBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.2)', paddingVertical: 14, marginBottom: 8 },
  addArtistText: { fontSize: 14, fontFamily: 'Lato_700Bold', color: '#000' },

  // Map
  mapCard: { borderRadius: 16, overflow: 'hidden', padding: 14 },
  mapInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapInput: { flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000', padding: 0 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bottomIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  createButton: { flex: 1, height: 48, borderRadius: 28, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  createButtonDisabled: { opacity: 0.4 },
  createButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
});
