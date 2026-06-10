// ── ATHLETE DISCLOSURE DETAIL (Sprint 3.4) ───────────────
// Full-screen render of a single NIL Go-shaped `ComplianceDisclosure`.
// Reads via `useDisclosure(id)`, renders through `DisclosureForm`. The
// "Submit draft" CTA is visual-only when `reviewState === 'draft'` — the
// underlying mock fixture is not mutated.
//
// Deep-link target: `status://athlete/disclosures/<id>`.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExportPacketButton } from '@/components/compliance/export-packet-button';
import { DisclosureForm } from '@/components/disclosure/disclosure-form';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  EmptyState,
  RADIUS_MD,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import { useDisclosure, useUpdateDisclosure } from '@/hooks/use-disclosures';
import type { ComplianceDisclosure } from '@/lib/types/compliance-disclosure.types';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AthleteDisclosureDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = normalizeParam(params.id);
  const { data: disclosure, isLoading } = useDisclosure(id);
  const updateMutation = useUpdateDisclosure();
  const insets = useSafeAreaInsets();
  const [submitted, setSubmitted] = React.useState(false);
  const [savedTick, setSavedTick] = React.useState(0);

  const handleSave = React.useCallback(
    (patch: Partial<ComplianceDisclosure>) => {
      if (!id) return;
      updateMutation.mutate(
        { id, patch },
        {
          onSuccess: (data) => {
            if (data) setSavedTick((tick) => tick + 1);
          },
        },
      );
    },
    [id, updateMutation],
  );

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/athlete/disclosures');
    }
  }, [router]);

  const showSubmitCta =
    Boolean(disclosure) && disclosure?.reviewState === 'draft' && !submitted;

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
              <Text style={styles.kicker}>Disclosure packet</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {disclosure
                  ? `${disclosure.counterparties.brand.name} — ${disclosure.counterparties.athlete.name}`
                  : 'Disclosure'}
              </Text>
            </View>
          </View>

          {!disclosure ? (
            <EmptyState
              icon={isLoading ? 'hourglass-outline' : 'document-text-outline'}
              title={isLoading ? 'Loading disclosure' : 'Disclosure not found'}
              body={
                isLoading
                  ? 'One moment — pulling the NIL disclosure packet.'
                  : 'We could not find a disclosure with this id. Return to the list and try again.'
              }
            />
          ) : (
            <>
              <Pressable
                onPress={() =>
                  router.push('/school/approval-queue?focus=pending')
                }
                style={styles.trackPill}
                accessibilityRole="link"
                accessibilityLabel="Track in approval queue — opens school approval queue"
              >
                <Ionicons
                  name="git-pull-request-outline"
                  size={13}
                  color={TONE_COLOR.accent}
                />
                <Text style={styles.trackPillText}>Track in approval queue</Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={TONE_COLOR.accent}
                />
              </Pressable>
              <DisclosureForm
                disclosure={disclosure}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
                savedTick={savedTick}
              />
              <ExportPacketButton
                kind="disclosure"
                subjectId={disclosure.id}
                subjectLabel={`${disclosure.counterparties.brand.name} — ${disclosure.counterparties.athlete.name}`}
              />
            </>
          )}

          {showSubmitCta ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.submitCta}
              accessibilityRole="button"
              accessibilityLabel="Submit draft to school review"
              onPress={() => setSubmitted(true)}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#000000" />
              <Text style={styles.submitText}>Submit draft to school review</Text>
            </TouchableOpacity>
          ) : null}

          {submitted ? (
            <View style={styles.submittedNote}>
              <Ionicons name="checkmark-circle-outline" size={16} color={TONE_COLOR.success} />
              <Text style={styles.submittedText}>
                Draft submitted to school review.
              </Text>
            </View>
          ) : null}
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
    gap: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    alignItems: 'flex-start',
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
    marginTop: 2,
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 24,
    marginTop: 2,
  },
  submitCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS_MD,
    backgroundColor: TONE_COLOR.accent,
    marginTop: 4,
  },
  submitText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  submittedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.success}55`,
    backgroundColor: `${TONE_COLOR.success}14`,
  },
  submittedText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  trackPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.accent}55`,
    backgroundColor: `${TONE_COLOR.accent}1A`,
  },
  trackPillText: {
    color: TONE_COLOR.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
