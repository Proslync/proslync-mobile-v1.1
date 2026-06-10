// ── ATHLETE PERMISSION GRANT DETAIL ───────────────────────
// Sprint 3.7 (PLAN §3.7) full-screen render of one PermissionGrant.
// Deep-link target: `proslync://athlete/permissions/<grantId>`.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PermissionGrantDetail } from '@/components/permissions/permission-grant-detail';
import {
  formatGranteeLabel,
} from '@/components/permissions/permission-grant-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { usePermissionGrant } from '@/hooks/use-permission-grants';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AthletePermissionGrantDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = normalizeParam(params.id);
  const { data: grant, isLoading } = usePermissionGrant(id);
  const insets = useSafeAreaInsets();

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/athlete/permissions');
    }
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.kicker}>Permission grant</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {grant ? formatGranteeLabel(grant) : isLoading ? 'Loading' : 'Not found'}
              </Text>
            </View>
          </View>

          {grant ? (
            <PermissionGrantDetail grant={grant} />
          ) : isLoading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="hourglass-outline" size={28} color="rgba(255,255,255,0.62)" />
              <Text style={styles.emptyTitle}>Loading grant</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={28} color="rgba(255,255,255,0.62)" />
              <Text style={styles.emptyTitle}>Grant not found</Text>
              <Text style={styles.emptyBody}>
                This grant may have been revoked and purged. Try the permissions list to see what is still on record.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    gap: 16,
    paddingHorizontal: 16,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  flex: { flex: 1 },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  kicker: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
});
