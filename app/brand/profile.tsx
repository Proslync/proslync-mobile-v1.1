// ── BRAND COMPANY PROFILE (full-screen route) ────────────
// Sprint 2.1 (PLAN.md §2.1 — W20/W32). Renders the
// `BrandCompanyProfileCard` for the brand id passed in the URL
// (default `brand-puma-hoops`). Header offers a search affordance
// that routes to `/brand/search`.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandCompanyProfileCard } from '@/components/brand/brand-company-profile-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { EmptyState } from '@/components/shared/ui-kit';
import { useBrandProfile } from '@/hooks/use-brand-companies';
import { DEFAULT_BRAND_ID } from '@/lib/data/mock-brand-companies';

export default function BrandProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ brandId?: string }>();
  const brandId =
    typeof params.brandId === 'string' && params.brandId
      ? params.brandId
      : DEFAULT_BRAND_ID;

  const { data, isLoading } = useBrandProfile(brandId);

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Brand profile</Text>
          <Text style={styles.headerSub}>
            HQ · employees · revenue · recent news
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/brand/search')}
          style={styles.iconBtn}
          accessibilityLabel="Search brand directory"
          accessibilityRole="button"
        >
          <Ionicons name="search" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <EmptyState
            icon="hourglass-outline"
            title="Loading brand profile"
            body="Loading verified brand record from the directory."
          />
        ) : !data ? (
          <EmptyState
            icon="business-outline"
            title="Brand not found"
            body={`No directory record for ${brandId}. Tap the search icon above to find a verified brand.`}
          />
        ) : (
          <BrandCompanyProfileCard profile={data} activeDealsCount={0} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  iconBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  headerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  content: { gap: 16, paddingHorizontal: 16, paddingTop: 8 },
});
