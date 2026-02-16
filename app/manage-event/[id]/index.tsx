import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useEvent } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { EventStatus } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' as const },
  { key: 'attendees', label: 'Attendees', icon: 'people-outline' as const },
  { key: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' as const },
  { key: 'pricing', label: 'Pricing', icon: 'pricetag-outline' as const },
  { key: 'marketing', label: 'Marketing', icon: 'megaphone-outline' as const },
  { key: 'payments', label: 'Payments', icon: 'card-outline' as const },
  { key: 'team', label: 'Team', icon: 'person-add-outline' as const },
  { key: 'artists', label: 'Artists', icon: 'musical-notes-outline' as const },
] as const;

function getStatusColor(status: EventStatus): string {
  switch (status) {
    case 'draft': return '#f59e0b';
    case 'published': return '#3b82f6';
    case 'active': return '#22c55e';
    case 'finished': return 'rgba(255,255,255,0.4)';
    case 'cancelled': return '#ef4444';
    default: return 'rgba(255,255,255,0.4)';
  }
}

function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'published': return 'Published';
    case 'active': return 'Live';
    case 'finished': return 'Ended';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateStr = start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} \u00B7 ${startTime} - ${endTime}`;
}

export default function ManageEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : undefined;
  const { data: event, isLoading } = useEvent(eventId);

  const handleSectionPress = (sectionKey: string) => {
    router.push(`/manage-event/${id}/${sectionKey}`);
  };

  if (isLoading || !event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Event</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  const flyerUrl = event.flyer?.url || event.imageUrl;
  const isPastEvent = event.status === EventStatus.FINISHED || event.status === EventStatus.CANCELLED;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Event</Text>
        {isPastEvent ? (
          <View style={styles.headerButton} />
        ) : (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push({ pathname: '/edit-event', params: { id: id! } })}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Info Section */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.eventInfo}>
            <View style={styles.eventInfoRow}>
              {flyerUrl ? (
                <Image
                  source={{ uri: flyerUrl }}
                  style={[styles.flyerImage, { backgroundColor: colors.backgroundSecondary }]}
                />
              ) : (
                <View style={[styles.flyerPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="calendar" size={28} color={colors.textTertiary} />
                </View>
              )}
              <View style={styles.eventDetails}>
                <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={2}>
                  {event.name}
                </Text>
                <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  {event.venue?.name || event.location || 'Location TBA'}
                </Text>
                <Text style={[styles.eventDate, { color: colors.textTertiary }]} numberOfLines={1}>
                  {formatDateRange(event.startDate, event.endDate)}
                </Text>
                <View style={styles.eventMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(event.status)}</Text>
                  </View>
                  {event.attendeeCount != null && (
                    <View style={styles.attendeeStat}>
                      <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
                      <Text style={[styles.attendeeText, { color: colors.textTertiary }]}>
                        {event.attendeeCount} RSVPs
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {/* Section Navigation Grid */}
        <View style={styles.grid}>
          {SECTIONS.map((section, index) => (
            <Animated.View
              key={section.key}
              entering={FadeInDown.delay(index * 40).duration(300)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSectionPress(section.key)}
                style={styles.gridItemTouchable}
              >
                <GlassSurface
                  fill="subtle"
                  border="subtle"
                  cornerRadius="lg"
                  style={styles.sectionCard}
                >
                  <Ionicons name={section.icon} size={28} color={colors.text} />
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    {section.label}
                  </Text>
                </GlassSurface>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
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
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  eventInfo: {
    padding: 16,
  },
  eventInfoRow: {
    flexDirection: 'row',
  },
  flyerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  flyerPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetails: {
    flex: 1,
    marginLeft: 14,
  },
  eventName: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  attendeeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeeText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 12,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
  },
  gridItemTouchable: {
    flex: 1,
  },
  sectionCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
});
