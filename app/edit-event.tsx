// Edit Event Screen — mirrors create-event/event detail layout, pre-filled with existing data

import { useToast } from '@/components/shared/toast';
import { PricingStep } from '@/components/event-form';
import { PromoCodeCard } from '@/components/pricing/promo-code-card';
import { CreatePromoCodeModal } from '@/components/pricing/create-promo-code-modal';
import { useEditEventForm, useUpdateEvent, useEvent, useGetPromoCodes, useCreatePromoCode, useDeletePromoCode, useTogglePromoCodeActive } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';
import { parseEventFormData, type EventFormData } from '@/lib/schemas/events';
import { DRESS_CODE_OPTIONS } from '@/lib/constants/dress-codes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Controller, FormProvider } from 'react-hook-form';
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
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');
const CARD_MARGIN = 16;

type EditTab = 'overview' | 'tables' | 'lineup' | 'map';

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  if (isLiquidGlassSupported) {
    return <LiquidGlassView effect="regular" style={style}>{children}</LiquidGlassView>;
  }
  return <View style={[style, { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>{children}</View>;
}

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

export default function EditEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();
  const { user: authUser } = useAuth();

  const eventId = id ? Number(id) : undefined;
  const { data: event, isLoading: isLoadingEvent } = useEvent(isNaN(eventId as number) ? undefined : eventId);

  const { form, canSubmit, isPaid, resetWithEvent } = useEditEventForm();
  const updateEvent = useUpdateEvent();

  const [activeTab, setActiveTab] = React.useState<EditTab>('overview');
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const [existingFlyerUrl, setExistingFlyerUrl] = React.useState<string | null>(null);
  const [promoModalVisible, setPromoModalVisible] = React.useState(false);

  // Promo codes (need existing event ID)
  const { data: promoCodes = [] } = useGetPromoCodes(eventId ?? 0);
  const createPromoCode = useCreatePromoCode(eventId ?? 0);
  const deletePromoCode = useDeletePromoCode(eventId ?? 0);
  const togglePromoActive = useTogglePromoCodeActive(eventId ?? 0);

  // Pre-fill form with event data
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
    } else if (event.imageUrl) {
      setExistingFlyerUrl(event.imageUrl);
    }
  }, [event]);

  const flyerUri = form.watch('flyerUri');
  const startDate = form.watch('startDate');
  const dressCode = form.watch('dressCode');
  const displayFlyer = flyerUri || existingFlyerUrl;

  const handlePickFlyer = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Photo library permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      form.setValue('flyerUri', result.assets[0].uri);
      form.setValue('flyerMediaType', result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handleDressCodePicker = () => {
    const options = [...DRESS_CODE_OPTIONS.map((o) => o.label), 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1 },
      (index) => { if (index < DRESS_CODE_OPTIONS.length) form.setValue('dressCode', DRESS_CODE_OPTIONS[index].value); },
    );
  };

  const onSubmit = (data: EventFormData) => {
    if (!event) return;
    const parsedData = parseEventFormData(data);
    updateEvent.mutate(
      { eventId: event.id, data: parsedData, flyerUri: data.flyerUri },
      {
        onSuccess: () => { showSuccess('Event updated!'); router.back(); },
        onError: (error) => showError(error.message || 'Failed to update event'),
      },
    );
  };

  const onSubmitError = () => showError('Please fill in all required fields');

  if (isLoadingEvent) {
    return (
      <View style={[s.container, s.loadingContainer]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={s.loadingText}>Loading event...</Text>
      </View>
    );
  }

  const renderOverview = () => (
    <Animated.View entering={FadeInDown.duration(400)}>
      {/* Organizer */}
      <GlassCard style={s.glassCard}>
        <View style={s.organizerInner}>
          <Image source={authUser?.avatar?.url ? { uri: authUser.avatar.url } : DefaultAvatarImage} style={s.organizerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.organizerName} numberOfLines={1}>{authUser?.firstName || authUser?.userName || 'You'}</Text>
            <Text style={s.organizerRole}>Organizer</Text>
          </View>
        </View>
      </GlassCard>

      {/* Flyer */}
      <GlassCard style={s.flyerCard}>
        <TouchableOpacity onPress={handlePickFlyer} activeOpacity={0.85} style={s.flyerTouch}>
          {displayFlyer ? (
            <Image source={{ uri: displayFlyer }} style={s.flyerImage} resizeMode="cover" />
          ) : (
            <View style={s.flyerPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="rgba(0,0,0,0.3)" />
              <Text style={s.flyerPlaceholderText}>Change Event Flyer</Text>
            </View>
          )}
        </TouchableOpacity>
      </GlassCard>

      {/* Details */}
      <GlassCard style={s.detailsCard}>
        <Controller control={form.control} name="name" render={({ field: { value, onChange } }) => (
          <TextInput style={s.eventNameInput} value={value} onChangeText={onChange} placeholder="Event name" placeholderTextColor="rgba(0,0,0,0.35)" maxLength={100} />
        )} />
        <TouchableOpacity style={s.dateRow} onPress={() => setShowStartPicker(true)}>
          <Ionicons name="calendar-outline" size={16} color="rgba(0,0,0,0.5)" />
          <Text style={s.dateText}>{formatDateDisplay(startDate)}</Text>
        </TouchableOpacity>
        <Controller control={form.control} name="location" render={({ field: { value, onChange } }) => (
          <View style={s.dateRow}>
            <Ionicons name="location-outline" size={16} color="rgba(0,0,0,0.5)" />
            <TextInput style={s.locationInput} value={value} onChangeText={onChange} placeholder="Event location" placeholderTextColor="rgba(0,0,0,0.35)" />
          </View>
        )} />
      </GlassCard>

      {/* Quick Details Grid */}
      <View style={s.gridRow}>
        <GlassCard style={s.gridCell}>
          <Text style={s.gridLabel}>DRESS CODE</Text>
          <TouchableOpacity onPress={handleDressCodePicker}>
            <Text style={s.gridValue}>{dressCode ? DRESS_CODE_OPTIONS.find((o) => o.value === dressCode)?.label || dressCode : 'None'}</Text>
          </TouchableOpacity>
        </GlassCard>
        <GlassCard style={s.gridCell}>
          <Text style={s.gridLabel}>AGE</Text>
          <Controller control={form.control} name="minimumAge" render={({ field: { value, onChange } }) => (
            <TextInput style={[s.gridValue, s.gridInput]} value={value || ''} onChangeText={onChange} placeholder="21+" placeholderTextColor="rgba(0,0,0,0.35)" keyboardType="number-pad" />
          )} />
        </GlassCard>
      </View>
      <View style={s.gridRow}>
        <GlassCard style={s.gridCell}>
          <Text style={s.gridLabel}>COVER</Text>
          <Controller control={form.control} name="doorCoverPrice" render={({ field: { value, onChange } }) => (
            <TextInput style={[s.gridValue, s.gridInput]} value={value || ''} onChangeText={onChange} placeholder="Free" placeholderTextColor="rgba(0,0,0,0.35)" keyboardType="decimal-pad" />
          )} />
        </GlassCard>
        <GlassCard style={s.gridCell}>
          <Text style={s.gridLabel}>DOORS</Text>
          <Text style={s.gridValue}>{formatDoorsTime(startDate)}</Text>
        </GlassCard>
      </View>

      {/* Description */}
      <GlassCard style={s.descriptionCard}>
        <Controller control={form.control} name="description" render={({ field: { value, onChange } }) => (
          <TextInput style={s.descriptionInput} value={value || ''} onChangeText={onChange} placeholder="Describe your event..." placeholderTextColor="rgba(0,0,0,0.35)" multiline maxLength={2000} textAlignVertical="top" />
        )} />
      </GlassCard>

      {/* Toggles */}
      <View style={s.toggleRow}>
        <GlassCard style={s.toggleCard}>
          <Text style={s.toggleLabel}>Public Event</Text>
          <Controller control={form.control} name="isPublic" render={({ field: { value, onChange } }) => <Switch value={value} onValueChange={onChange} />} />
        </GlassCard>
        <GlassCard style={s.toggleCard}>
          <Text style={s.toggleLabel}>Paid Event</Text>
          <Controller control={form.control} name="isPaid" render={({ field: { value, onChange } }) => <Switch value={value} onValueChange={onChange} />} />
        </GlassCard>
      </View>

      {/* Pricing — inline when paid */}
      {isPaid && (
        <>
          <GlassCard style={s.pricingContainer}>
            <PricingStep />
          </GlassCard>

          {/* Promo Codes */}
          <GlassCard style={s.pricingContainer}>
            <Text style={s.promoTitle}>Promo Codes</Text>
            {promoCodes.length === 0 ? (
              <Text style={s.promoEmpty}>No promo codes yet</Text>
            ) : (
              promoCodes.map((code) => (
                <PromoCodeCard
                  key={code.id}
                  promoCode={code}
                  readOnly={false}
                  onToggleActive={(promoId) => {
                    const promo = promoCodes.find((p) => p.id === promoId);
                    togglePromoActive.mutate({ promoId, isActive: !promo?.isActive });
                  }}
                  onEdit={() => {}}
                  onDelete={(promoId) => deletePromoCode.mutate(promoId)}
                />
              ))
            )}
            <TouchableOpacity style={s.addPromoBtn} onPress={() => setPromoModalVisible(true)} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color="#000" />
              <Text style={s.addPromoBtnText}>Add Promo Code</Text>
            </TouchableOpacity>
          </GlassCard>

          <CreatePromoCodeModal
            visible={promoModalVisible}
            onClose={() => setPromoModalVisible(false)}
            onSubmit={(data) => {
              createPromoCode.mutate(data, { onSuccess: () => setPromoModalVisible(false) });
            }}
            loading={createPromoCode.isPending}
          />
        </>
      )}

      {/* Date pickers */}
      {showStartPicker && (
        <Controller control={form.control} name="startDate" render={({ field: { value, onChange } }) => (
          <DateTimePicker value={value instanceof Date ? value : new Date()} mode="datetime" display="spinner" onChange={(_, date) => {
            setShowStartPicker(false);
            if (date) { onChange(date); const end = form.getValues('endDate'); if (end && date >= end) form.setValue('endDate', new Date(date.getTime() + 4 * 3600000)); setShowEndPicker(true); }
          }} themeVariant={isDark ? 'dark' : 'light'} />
        )} />
      )}
      {showEndPicker && (
        <Controller control={form.control} name="endDate" render={({ field: { value, onChange } }) => (
          <DateTimePicker value={value instanceof Date ? value : new Date(Date.now() + 4 * 3600000)} mode="datetime" display="spinner" minimumDate={form.getValues('startDate') || new Date()} onChange={(_, date) => {
            setShowEndPicker(false); if (date) onChange(date);
          }} themeVariant={isDark ? 'dark' : 'light'} />
        )} />
      )}
    </Animated.View>
  );

  const renderTables = () => (
    <View style={s.tabSection}>
      {isPaid ? <PricingStep /> : (
        <View style={s.emptyTab}>
          <Ionicons name="pricetag-outline" size={40} color="rgba(0,0,0,0.2)" />
          <Text style={s.emptyTabText}>Enable "Paid Event" on Overview to add pricing</Text>
        </View>
      )}
    </View>
  );

  const renderMap = () => (
    <View style={s.tabSection}>
      <GlassCard style={s.mapCard}>
        <Controller control={form.control} name="location" render={({ field: { value, onChange } }) => (
          <View style={s.mapInputRow}>
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
            <TextInput style={s.mapInput} value={value} onChangeText={onChange} placeholder="Search for a location" placeholderTextColor="rgba(0,0,0,0.35)" />
          </View>
        )} />
      </GlassCard>
      <View style={s.emptyTab}>
        <Ionicons name="map-outline" size={40} color="rgba(0,0,0,0.2)" />
        <Text style={s.emptyTabText}>Map preview will appear here</Text>
      </View>
    </View>
  );

  return (
    <FormProvider {...form}>
      <View style={[s.container, { backgroundColor: '#f2f2f2' }]}>
        {/* Pill row */}
        <View style={[s.pillRowContainer, { top: insets.top + 16 }]}>
          <View style={s.pillRowContent}>
            {(['overview', 'tables', 'lineup', 'map'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'overview' ? 'Overview' : tab === 'tables' ? 'Tables' : tab === 'lineup' ? 'Lineup' : 'Map';
              return (
                <Pressable key={tab} style={s.pillFilter} onPress={() => setActiveTab(tab)}>
                  <View style={s.pillGlassLayer} pointerEvents="none">
                    <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                  </View>
                  <Text style={[s.pillText, isActive && s.pillTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView style={s.flex} contentContainerStyle={[s.scrollContent, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'tables' && renderTables()}
            {activeTab === 'lineup' && (
              <View style={s.emptyTab}>
                <Ionicons name="people-outline" size={40} color="rgba(0,0,0,0.2)" />
                <Text style={s.emptyTabText}>Artist editing coming soon</Text>
              </View>
            )}
            {activeTab === 'map' && renderMap()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Top & bottom fades */}
        <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={s.topFade} pointerEvents="none" />
        <LinearGradient colors={['rgba(242,242,242,0)', '#f2f2f2']} style={s.bottomFade} pointerEvents="none" />

        {/* Bottom bar */}
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.bottomRow}>
            <TouchableOpacity style={s.bottomIcon} onPress={() => router.back()} activeOpacity={0.7}>
              <GlassView {...liquidGlass.surface} tintColor="rgba(0,0,0,0.06)" borderRadius={24} style={StyleSheet.absoluteFill} />
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveButton, (!canSubmit || updateEvent.isPending) && s.saveButtonDisabled]}
              onPress={form.handleSubmit(onSubmit, onSubmitError)}
              disabled={!canSubmit || updateEvent.isPending}
              activeOpacity={0.85}
            >
              {updateEvent.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
            <View style={s.bottomIcon} />
          </View>
        </View>
      </View>
    </FormProvider>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f2' },
  loadingText: { marginTop: 16, fontSize: 16, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.5)' },

  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  pillRowContainer: { position: 'absolute', left: CARD_MARGIN, right: CARD_MARGIN, zIndex: 100 },
  pillRowContent: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pillFilter: { flex: 1, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillGlassLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  pillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  pillTextActive: { color: 'rgba(0,0,0,0.8)' },

  scrollContent: { paddingHorizontal: CARD_MARGIN },

  glassCard: { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  organizerInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  organizerAvatar: { width: 36, height: 36, borderRadius: 18 },
  organizerName: { fontSize: 15, fontFamily: 'Lato_700Bold', color: '#000' },
  organizerRole: { fontSize: 12, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.5)', marginTop: 1 },

  flyerCard: { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  flyerTouch: { width: '100%' },
  flyerImage: { width: '100%', aspectRatio: 4 / 3 },
  flyerPlaceholder: { width: '100%', aspectRatio: 4 / 3, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  flyerPlaceholderText: { fontSize: 14, fontFamily: 'Lato_700Bold', color: 'rgba(0,0,0,0.35)', marginTop: 8 },

  detailsCard: { borderRadius: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 14, overflow: 'hidden', gap: 8 },
  eventNameInput: { fontSize: 20, fontFamily: 'Lato_700Bold', color: '#000', padding: 0 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.55)' },
  locationInput: { flex: 1, fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.55)', padding: 0 },

  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCell: { flex: 1, borderRadius: 14, padding: 14, overflow: 'hidden', alignItems: 'center', gap: 6 },
  gridLabel: { fontSize: 10, fontFamily: 'Lato_700Bold', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 },
  gridValue: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#000', textAlign: 'center' },
  gridInput: { padding: 0, minWidth: 50, textAlign: 'center' },

  descriptionCard: { borderRadius: 16, marginBottom: 10, padding: 14, overflow: 'hidden' },
  descriptionInput: { fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000', minHeight: 80, padding: 0, textAlignVertical: 'top' },

  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  pricingContainer: { borderRadius: 16, padding: 14, overflow: 'hidden', marginBottom: 10 },
  promoTitle: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#000', marginBottom: 8 },
  promoEmpty: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.4)', marginBottom: 12 },
  addPromoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.2)', paddingVertical: 12, marginTop: 8 },
  addPromoBtnText: { fontSize: 14, fontFamily: 'Lato_700Bold', color: '#000' },
  toggleCard: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 14, fontFamily: 'Lato_700Bold', color: '#000' },

  tabSection: { paddingTop: 8 },
  emptyTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTabText: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.4)', textAlign: 'center' },

  mapCard: { borderRadius: 16, overflow: 'hidden', padding: 14 },
  mapInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapInput: { flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000', padding: 0 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bottomIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  saveButton: { flex: 1, height: 48, borderRadius: 28, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
});
