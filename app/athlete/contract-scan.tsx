// app/athlete/contract-scan.tsx
// NIL Contract Red-Flag Scanner screen.
// Athlete pastes deal text → instant plain-English red flags + risk level.
// Rule-based scanner (LLM_READY = false). Structured so a real LLM drops
// in later behind the same scanContract() interface.
// Footer always states: "Automated scan — not legal advice."

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { scanContract } from '@/lib/contracts/red-flags.mjs';
import type { ScanFlag, ScanResult } from '@/lib/contracts/red-flags.d';
import {
  SAMPLE_PREDATORY,
  SAMPLE_FAIR,
  SAMPLE_MIXED,
} from '@/lib/data/mock-contracts';

const COPPER = '#EB621A';
const RED_HIGH = '#FF3B30';
const AMBER_MED = '#FFD60A';
const GREEN_CLEAR = '#34C759';
const CARD_BG = '#1C1C1E';
const MUTED = 'rgba(255,255,255,0.45)';

// ── Severity colour helpers ────────────────────────────────────────────────────

function severityColor(sev: ScanFlag['severity']): string {
  if (sev === 'high') return RED_HIGH;
  if (sev === 'medium') return AMBER_MED;
  return MUTED;
}

function levelColor(level: ScanResult['level']): string {
  if (level === 'high-risk') return RED_HIGH;
  if (level === 'caution') return AMBER_MED;
  return GREEN_CLEAR;
}

function levelLabel(level: ScanResult['level']): string {
  if (level === 'high-risk') return 'HIGH RISK';
  if (level === 'caution') return 'CAUTION';
  return 'CLEAR';
}

// ── Sample chips ───────────────────────────────────────────────────────────────

const SAMPLES = [
  { label: 'Predatory', text: SAMPLE_PREDATORY },
  { label: 'Fair', text: SAMPLE_FAIR },
  { label: 'Mixed', text: SAMPLE_MIXED },
] as const;

// ── Flag card ─────────────────────────────────────────────────────────────────

function FlagCard({ flag }: { flag: ScanFlag }) {
  const color = severityColor(flag.severity);
  return (
    <View style={flagStyles.card}>
      <View style={[flagStyles.stripe, { backgroundColor: color }]} />
      <View style={flagStyles.body}>
        <View style={flagStyles.headerRow}>
          <View style={[flagStyles.sevPill, { backgroundColor: `${color}22` }]}>
            <Text style={[flagStyles.sevText, { color }]}>
              {flag.severity.toUpperCase()}
            </Text>
          </View>
          <Text style={flagStyles.title} numberOfLines={2}>
            {flag.title}
          </Text>
        </View>
        <Text style={flagStyles.why}>{flag.why}</Text>
        <View style={flagStyles.excerptBox}>
          <Text style={flagStyles.excerptText} numberOfLines={3}>
            {flag.excerpt}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ContractScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = React.useState('');
  const [result, setResult] = React.useState<ScanResult | null>(null);

  function handleScan() {
    if (!text.trim()) return;
    const r = scanContract(text);
    setResult(r);
  }

  function loadSample(sample: string) {
    setText(sample.trim());
    setResult(null);
  }

  const issueCount = result?.flags.length ?? 0;
  const color = result ? levelColor(result.level) : COPPER;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 44 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Contract check</Text>
            <View style={styles.backBtn} pointerEvents="none" />
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Paste deal terms below to spot red flags before you sign.
          </Text>

          {/* Sample chips */}
          <View style={styles.chipRow}>
            <Text style={styles.chipLabel}>Load sample:</Text>
            {SAMPLES.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={styles.chip}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Load ${s.label} sample contract`}
                onPress={() => loadSample(s.text)}
              >
                <Text style={styles.chipText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={8}
            placeholder="Paste contract terms here…"
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={(t) => {
              setText(t);
              setResult(null);
            }}
            textAlignVertical="top"
            accessibilityLabel="Contract text input"
          />

          {/* Scan CTA */}
          <TouchableOpacity
            style={[styles.scanBtn, !text.trim() && styles.scanBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleScan}
            disabled={!text.trim()}
            accessibilityRole="button"
            accessibilityLabel="Scan contract"
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
            <Text style={styles.scanBtnText}>SCAN CONTRACT</Text>
          </TouchableOpacity>

          {/* Results */}
          {result !== null ? (
            <View style={styles.resultsSection}>
              {/* Overall risk banner */}
              <View
                style={[
                  styles.riskBanner,
                  { borderColor: `${color}55`, backgroundColor: `${color}18` },
                ]}
              >
                <View style={[styles.riskIconBubble, { backgroundColor: `${color}22` }]}>
                  <Ionicons
                    name={
                      result.level === 'clear'
                        ? 'checkmark-circle'
                        : result.level === 'caution'
                        ? 'warning'
                        : 'alert-circle'
                    }
                    size={24}
                    color={color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.riskLevel, { color }]}>
                    {levelLabel(result.level)}
                  </Text>
                  <Text style={styles.riskMeta}>
                    {issueCount === 0
                      ? 'No issues detected'
                      : `${issueCount} issue${issueCount > 1 ? 's' : ''} found · score ${result.score}`}
                  </Text>
                </View>
              </View>

              {/* Clean state */}
              {result.level === 'clear' ? (
                <View style={styles.clearCard}>
                  <Ionicons name="checkmark-circle" size={36} color={GREEN_CLEAR} />
                  <Text style={styles.clearTitle}>No major red flags found</Text>
                  <Text style={styles.clearBlurb}>
                    This contract looks clean based on our automated rule checks.
                    Still, have a licensed sports attorney review before signing.
                  </Text>
                </View>
              ) : (
                <View style={styles.flagList}>
                  {result.flags.map((flag) => (
                    <FlagCard key={flag.id} flag={flag} />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {/* Footer — always visible */}
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={13} color={MUTED} />
            <Text style={styles.footerText}>
              Automated scan — not legal advice.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chipLabel: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}66`,
    backgroundColor: 'rgba(235,98,26,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipText: {
    color: COPPER,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 20,
    padding: 14,
    minHeight: 160,
    fontFamily: undefined,
  },
  scanBtn: {
    backgroundColor: COPPER,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  scanBtnDisabled: {
    opacity: 0.42,
  },
  scanBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultsSection: {
    gap: 12,
  },
  riskBanner: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  riskIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  riskMeta: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  clearCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${GREEN_CLEAR}33`,
  },
  clearTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  clearBlurb: {
    color: MUTED,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  flagList: {
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  footerText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    flex: 1,
  },
});

const flagStyles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: 13,
    gap: 7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sevPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  sevText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  title: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
    flex: 1,
    lineHeight: 18,
  },
  why: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  excerptBox: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 8,
    padding: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  excerptText: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
});
