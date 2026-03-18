import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useVenue } from '@/hooks/use-venue-query';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}

function InfoRow({ icon, label, value, onPress, colors, isDark }: InfoRowProps) {
  const content = (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const }]}>
        {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={16} color={colors.textTertiary} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function VenueInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const venueId = id ? Number(id) : undefined;
  const { data: venue, isLoading } = useVenue(venueId);

  if (isLoading || !venue) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Venue Info</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  const location = [venue.city, venue.state].filter(Boolean).join(', ') || venue.address;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Venue Info</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Venue Name Header */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.nameSection}>
            <View style={[styles.logoPlaceholder, { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const }]}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />}
              <Ionicons name="business" size={36} color={colors.textTertiary} />
            </View>
            <Text style={[styles.venueName, { color: colors.text }]}>{venue.name}</Text>
            {venue.description ? (
              <Text style={[styles.venueDescription, { color: colors.textSecondary }]}>
                {venue.description}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Details Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.detailsCard}>
            {venue.address ? (
              <InfoRow
                icon="location-outline"
                label="Address"
                value={venue.address}
                onPress={
                  venue.latitude && venue.longitude
                    ? () => Linking.openURL(`maps:?ll=${Number(venue.latitude)},${Number(venue.longitude)}&q=${encodeURIComponent(venue.name)}`)
                    : undefined
                }
                colors={colors}
                isDark={isDark}
              />
            ) : null}

            {venue.phoneNumber ? (
              <InfoRow
                icon="call-outline"
                label="Phone"
                value={venue.phoneNumber}
                onPress={() => Linking.openURL(`tel:${venue.phoneNumber}`)}
                colors={colors}
                isDark={isDark}
              />
            ) : null}

            {venue.email ? (
              <InfoRow
                icon="mail-outline"
                label="Email"
                value={venue.email}
                onPress={() => Linking.openURL(`mailto:${venue.email}`)}
                colors={colors}
                isDark={isDark}
              />
            ) : null}

            {venue.website ? (
              <InfoRow
                icon="globe-outline"
                label="Website"
                value={venue.website}
                onPress={() => Linking.openURL(venue.website!)}
                colors={colors}
                isDark={isDark}
              />
            ) : null}

            {location && !venue.address ? (
              <InfoRow
                icon="navigate-outline"
                label="Location"
                value={location}
                colors={colors}
                isDark={isDark}
              />
            ) : null}
          </GlassSurface>
        </Animated.View>

        {/* Coordinates */}
        {venue.latitude != null && venue.longitude != null && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.detailsCard}>
              <InfoRow
                icon="pin-outline"
                label="Coordinates"
                value={`${Number(venue.latitude).toFixed(6)}, ${Number(venue.longitude).toFixed(6)}`}
                colors={colors}
                isDark={isDark}
              />
            </GlassSurface>
          </Animated.View>
        )}
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
  nameSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  venueName: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  venueDescription: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  detailsCard: {
    padding: 4,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
