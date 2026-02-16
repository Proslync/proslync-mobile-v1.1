import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useEvent, useEventMarketingStats, usePublishEvent } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { EventStatus } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATS_CONFIG = [
  { key: 'totalRSVPs', label: 'Total RSVPs', icon: 'people-outline' as const },
  { key: 'eventLinkViews', label: 'Page Views', icon: 'eye-outline' as const },
  { key: 'uniqueVisitors', label: 'Unique Visitors', icon: 'person-outline' as const },
  { key: 'conversionRate', label: 'Conversion Rate', icon: 'trending-up-outline' as const },
] as const;

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : undefined;
  const { data: event } = useEvent(eventId);
  const { data: stats, isLoading: statsLoading } = useEventMarketingStats(eventId);
  const publishEvent = usePublishEvent();

  const handleEdit = () => {
    router.push({ pathname: '/edit-event', params: { id: id! } });
  };

  const handleShare = async () => {
    const url = event?.publicUrl || `https://status.app/event/${id}`;
    await Share.share({
      message: `Check out ${event?.name || 'this event'} on Status!`,
      url,
    });
  };

  const handlePublish = () => {
    if (!eventId) return;
    Alert.alert('Publish Event', 'Are you sure you want to publish this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: () => publishEvent.mutate(eventId),
      },
    ]);
  };

  const formatStatValue = (key: string, value: number): string => {
    if (key === 'conversionRate') return `${value}%`;
    return value.toLocaleString();
  };

  const isDraft = event?.status === EventStatus.DRAFT;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Overview</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>

        {statsLoading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {STATS_CONFIG.map((stat, index) => {
              const value = stats?.[stat.key] ?? 0;
              return (
                <Animated.View
                  key={stat.key}
                  entering={FadeInDown.delay(index * 60).duration(300)}
                  style={styles.statItem}
                >
                  <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <Ionicons name={stat.icon} size={18} color={colors.textSecondary} />
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        {stat.label}
                      </Text>
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatStatValue(stat.key, value)}
                    </Text>
                  </GlassSurface>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

        <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.actions}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleEdit}>
            <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Edit Event</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </GlassSurface>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={handleShare}>
            <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
              <Ionicons name="share-outline" size={20} color={colors.text} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Share Event</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </GlassSurface>
          </TouchableOpacity>

          {isDraft && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePublish}
              disabled={publishEvent.isPending}
            >
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.actionRow}>
                <Ionicons name="rocket-outline" size={20} color={colors.text} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {publishEvent.isPending ? 'Publishing...' : 'Publish Event'}
                </Text>
                {publishEvent.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                )}
              </GlassSurface>
            </TouchableOpacity>
          )}
        </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
    marginTop: 8,
  },
  statsLoading: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    width: '47%',
    flexGrow: 1,
  },
  statCard: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
  },
  actions: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
