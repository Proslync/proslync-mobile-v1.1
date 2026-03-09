import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useStableRouter } from '@/hooks/use-stable-router';
import { GlassSurface } from '@/components/glass/glass-surface';
import { useVenue } from '@/hooks/use-venue-query';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useAuth } from '@/lib/providers/auth-provider';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SavedAccount {
  id: number;
  phoneNumber: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}

const SECTIONS = [
  { key: 'info', label: 'Info', subtitle: 'Venue details and settings', icon: 'information-circle-outline' as const },
  { key: 'events', label: 'Events', subtitle: 'Events at this venue', icon: 'calendar-outline' as const },
  { key: 'tables', label: 'Tables', subtitle: 'Manage table sections', icon: 'grid-outline' as const },
  { key: 'menu', label: 'Menu', subtitle: 'Manage food & drink items', icon: 'restaurant-outline' as const },
  { key: 'followers', label: 'Followers', subtitle: 'View venue followers', icon: 'people-outline' as const },
  { key: 'analytics', label: 'Analytics', subtitle: 'View detailed insights', icon: 'stats-chart-outline' as const },
];

function getStatusColor(status?: string): string {
  switch (status) {
    case 'active': return '#22c55e';
    case 'pending': return '#f59e0b';
    case 'inactive': return 'rgba(255,255,255,0.4)';
    default: return 'rgba(255,255,255,0.4)';
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'pending': return 'Pending';
    case 'inactive': return 'Inactive';
    default: return status || 'Unknown';
  }
}

export default function ManageVenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { user, switchAccount } = useAuth();
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [errorAlert, setErrorAlert] = React.useState<{ title: string; message: string } | null>(null);

  const venueId = id ? Number(id) : undefined;
  const { data: venue, isLoading } = useVenue(venueId);

  // Check if current user is NOT the venue owner (show login button)
  const isOwner = user && venue?.ownerId ? user.id === venue.ownerId : true;

  const handleLoginAsVenue = React.useCallback(async () => {
    if (!venue?.ownerId) return;
    setIsSwitching(true);
    try {
      const stored = await AsyncStorage.getItem('saved_accounts');
      if (!stored) {
        setErrorAlert({ title: 'Account Not Found', message: 'The venue owner account is not saved on this device. Add it via the account switcher first.' });
        return;
      }
      const accounts: SavedAccount[] = JSON.parse(stored);
      const ownerAccount = accounts.find((a) => a.id === venue.ownerId);
      if (!ownerAccount || !ownerAccount.accessToken) {
        setErrorAlert({ title: 'Account Not Found', message: 'The venue owner account is not saved on this device. Add it via the account switcher first.' });
        return;
      }
      const success = await switchAccount(ownerAccount.accessToken, ownerAccount.refreshToken);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorAlert({ title: 'Switch Failed', message: 'Could not log into the venue account. The session may have expired.' });
      }
    } catch {
      setErrorAlert({ title: 'Error', message: 'Failed to switch accounts.' });
    } finally {
      setIsSwitching(false);
    }
  }, [venue?.ownerId, switchAccount, router]);

  const handleSectionPress = (sectionKey: string) => {
    router.push(`/manage-venue/${id}/${sectionKey}`);
  };

  if (isLoading || !venue) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Venue</Text>
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
      <ConfirmModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        title={errorAlert?.title || 'Error'}
        message={errorAlert?.message || ''}
        alertOnly
        icon="alert-circle-outline"
      />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Venue</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Venue Info Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.venueInfo}>
            <View style={styles.venueInfoRow}>
              <View style={[styles.venueLogoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="business" size={28} color={colors.textTertiary} />
              </View>
              <View style={styles.venueDetails}>
                <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={2}>
                  {venue.name}
                </Text>
                {location ? (
                  <Text style={[styles.venueAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                    {location}
                  </Text>
                ) : null}
                {venue.phoneNumber ? (
                  <Text style={[styles.venuePhone, { color: colors.textTertiary }]} numberOfLines={1}>
                    {venue.phoneNumber}
                  </Text>
                ) : null}
                <View style={styles.venueMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(venue.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(venue.status)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(500).springify()}
          style={styles.menuSection}
        >
          <View style={[styles.menuList, { backgroundColor: colors.cardElevated }]}>
            {SECTIONS.map((section) => (
              <TouchableOpacity
                key={section.key}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSectionPress(section.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: colors.cardElevated }]}>
                  <Ionicons name={section.icon} size={22} color={colors.text} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>{section.label}</Text>
                  <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{section.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Login as Venue Owner */}
        {!isOwner && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(500).springify()}
            style={styles.loginSection}
          >
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.cardElevated }]}
              onPress={handleLoginAsVenue}
              activeOpacity={0.7}
              disabled={isSwitching}
            >
              {isSwitching ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={colors.text} />
                  <Text style={[styles.loginButtonText, { color: colors.text }]}>
                    Login to Venue Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
  venueInfo: {
    padding: 16,
  },
  venueInfoRow: {
    flexDirection: 'row',
  },
  venueLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueDetails: {
    flex: 1,
    marginLeft: 14,
  },
  venueName: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 2,
  },
  venuePhone: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 8,
  },
  venueMeta: {
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
  menuSection: {
    marginTop: 20,
  },
  menuList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  loginSection: {
    marginTop: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
});
