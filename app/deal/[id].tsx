import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DealDetailSpine, roleToDealLens, type DealLensKey } from '@/components/deal';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { getBrandDealDetail } from '@/lib/data/mock-brand-data';
import { useRole } from '@/lib/providers/role-provider';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function lensFromParam(value: string | string[] | undefined): DealLensKey | undefined {
  const role = normalizeParam(value);
  if (role === 'brand' || role === 'athlete' || role === 'ad' || role === 'agent') {
    return role;
  }
  return undefined;
}

export default function DealDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; role?: string }>();
  const { role } = useRole();
  const id = normalizeParam(params.id);
  const detail = id ? getBrandDealDetail(id) : undefined;
  const initialLens = lensFromParam(params.role) ?? roleToDealLens(role);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {detail ? (
        <DealDetailSpine detail={detail} initialLens={initialLens} onBack={() => router.back()} />
      ) : (
        <DealNotFound onBack={() => router.back()} />
      )}
    </>
  );
}

function DealNotFound({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.notFound, { paddingTop: insets.top + 72 }]}>
      <DarkGradientBg />
      <Text style={styles.notFoundTitle}>Deal not found</Text>
      <Text style={styles.notFoundBody}>
        We couldn't find that deal. It may have been closed or moved.
      </Text>
      <Pressable onPress={onBack} style={styles.notFoundButton} accessibilityRole="button">
        <Text style={styles.notFoundButtonText}>Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 18,
  },
  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  notFoundBody: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 330,
  },
  notFoundButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notFoundButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
