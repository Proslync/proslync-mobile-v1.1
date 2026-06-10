// ── COMPLIANCE TRACK ──────────────────────────────────────
// Proslync's compliance differentiator. Every NIL deal carries three
// INDEPENDENT review tracks — `ncaaReview`, `schoolReview`, `ethicsReview`.
// Competitors (Opendorse, INFLCR, Athliance, MOGL) collapse compliance
// into a single status. We don't. This component encodes the
// independence visually: three side-by-side chips (compact) or three
// stacked rows (full), each carrying its own status, optional flag,
// optional `dueIn`, and optional reviewer note.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Compliance, type ComplianceState } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

import { ComplianceRing, type ComplianceRingState } from '@/components/shared/ui-kit/compliance-ring';
import { DataRow, type DataRowTone } from '@/components/shared/ui-kit/data-row';
import { StatusPill } from '@/components/shared/ui-kit/status-pill';
import type { Tone as StatusPillTone } from '@/components/shared/ui-kit/tokens';

// ── Public types ───────────────────────────────────────────
export type TrackKey = 'ncaa' | 'school' | 'ethics';
export type TrackStatus = 'pending' | 'approved' | 'flagged' | 'rejected' | 'not-required';
export type TrackFlag = 'info' | 'warn' | 'critical';

export interface TrackState {
  status: TrackStatus;
  /** Optional emphasis modifier. `critical` overrides tone → danger. */
  flag?: TrackFlag;
  /** e.g., "3 days", "tomorrow" — surfaced when status === 'pending'. */
  dueIn?: string;
  /** Optional short reviewer note, shown as a caption in the full variant. */
  note?: string;
}

export interface ComplianceTrackProps {
  tracks: {
    ncaa: TrackState;
    school: TrackState;
    ethics: TrackState;
  };
  /**
   * - `compact` (default): three side-by-side StatusPills.
   * - `full`: three stacked DataRows with reviewer notes.
   * - `compact-ring`: replaces the chips with a single
   *   <ComplianceRing> radial summary. Use on space-tight surfaces
   *   (deal-row trailing, AD console review queue, dashboard tile)
   *   where the chip-row layout doesn't fit. Existing `compact` and
   *   `full` callers are unaffected.
   */
  size?: 'compact' | 'full' | 'compact-ring';
  onTrackPress?: (track: TrackKey) => void;
}

// ── Public maps ────────────────────────────────────────────
export const TRACK_LABEL = {
  ncaa: 'NCAA',
  school: 'School',
  ethics: 'Ethics',
} as const;

// Status → status-pill tone (public). Note: StatusPill's `Tone` type does
// NOT include `'default'` — `pending` therefore degrades to StatusPill's
// `'info'` tone internally (see `STATUS_TO_PILL_TONE` below). The exported
// `TRACK_STATUS_TONE` keeps the `'default' | 'success' | 'warning' | 'danger' | 'muted'`
// shape from the spec so consumers can reason about semantic intent
// independent of the visual primitive.
export const TRACK_STATUS_TONE: Record<TrackStatus, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
  pending: 'default',
  approved: 'success',
  flagged: 'warning',
  rejected: 'danger',
  'not-required': 'muted',
};

export const TRACK_STATUS_LABEL: Record<TrackStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  flagged: 'Flagged',
  rejected: 'Rejected',
  'not-required': 'N/A',
};

// ── Internal maps ──────────────────────────────────────────
// Map the public TrackStatus vocabulary onto the semantic Compliance
// palette in constants/colors.ts. Note the casing transform on the
// `'not-required' → notRequired` boundary — the token export uses
// camelCase, the public prop keeps the hyphenated form for backwards
// compat with existing call sites.
const STATUS_TO_COMPLIANCE: Record<TrackStatus, ComplianceState> = {
  pending: 'pending',
  approved: 'pass',
  flagged: 'flagged',
  rejected: 'rejected',
  'not-required': 'notRequired',
};

// StatusPill's `Tone` doesn't have `default`. Map `pending → info` so
// the chip still reads as an informational/neutral signal. GAP: a true
// "default/neutral" tone in StatusPill would be cleaner; flagged for
// follow-up. NOTE: also no `default` tone here.
const STATUS_TO_PILL_TONE: Record<TrackStatus, StatusPillTone> = {
  pending: 'info',
  approved: 'success',
  flagged: 'warning',
  rejected: 'danger',
  'not-required': 'muted',
};

// Status → DataRow tone (used by the full variant). DataRow does accept
// `'default'`, so this map is a 1:1 with the public `TRACK_STATUS_TONE`.
const STATUS_TO_DATAROW_TONE: Record<TrackStatus, DataRowTone> = {
  pending: 'default',
  approved: 'success',
  flagged: 'warning',
  rejected: 'danger',
  'not-required': 'muted',
};

// Flag icons — used as Ionicons name. `info` is intentionally absent
// (no-op visually; reserved for tooltip / screen-reader content).
const FLAG_ICON: Record<Exclude<TrackFlag, 'info'>, keyof typeof Ionicons.glyphMap> = {
  warn: 'warning-outline',
  critical: 'alert-circle',
};

// ── Helpers ────────────────────────────────────────────────

/**
 * Resolve the effective tones for a track, applying the flag override:
 *   - `flag === 'critical'` ALWAYS forces the visual to `danger`,
 *     regardless of the underlying status. The status is preserved in
 *     the label text so the user still sees what the review track said.
 *   - `flag === 'warn'` does not change tone; the icon prefix carries
 *     the emphasis.
 *   - `flag === 'info'` is a no-op visually.
 */
function resolveTones(state: TrackState): {
  pillTone: StatusPillTone;
  dataRowTone: DataRowTone;
  compliance: (typeof Compliance)[ComplianceState];
} {
  if (state.flag === 'critical') {
    // critical override → resolve to Compliance.rejected (Status.critical-toned).
    return {
      pillTone: 'danger',
      dataRowTone: 'danger',
      compliance: Compliance.rejected,
    };
  }
  return {
    pillTone: STATUS_TO_PILL_TONE[state.status],
    dataRowTone: STATUS_TO_DATAROW_TONE[state.status],
    compliance: Compliance[STATUS_TO_COMPLIANCE[state.status]],
  };
}

function compactLabel(key: TrackKey, state: TrackState): string {
  const base = TRACK_LABEL[key];
  if (state.status === 'pending' && state.dueIn) {
    return `${base} · ${state.dueIn}`;
  }
  return base;
}

// ── Component ──────────────────────────────────────────────

export function ComplianceTrack({
  tracks,
  size = 'compact',
  onTrackPress,
}: ComplianceTrackProps) {
  if (size === 'compact-ring') {
    return <CompactRingVariant tracks={tracks} />;
  }
  if (size === 'compact') {
    return <CompactVariant tracks={tracks} onTrackPress={onTrackPress} />;
  }
  return <FullVariant tracks={tracks} onTrackPress={onTrackPress} />;
}

// ── Compact-ring variant ───────────────────────────────────
// Lifts the ComplianceRing primitive into ComplianceTrack so call
// sites that already speak the TrackState vocabulary don't have to
// re-derive ring state inline. The TrackStatus → ComplianceRingState
// mapping is 1:1 — both vocabularies share the same five values.

const TRACK_TO_RING_STATE: Record<TrackStatus, ComplianceRingState> = {
  pending: 'pending',
  approved: 'approved',
  flagged: 'flagged',
  rejected: 'rejected',
  'not-required': 'not-required',
};

function CompactRingVariant({ tracks }: Pick<ComplianceTrackProps, 'tracks'>) {
  // `flag === 'critical'` should still escalate visually — mirror the
  // `resolveTones` rule: critical forces the per-track state to
  // 'rejected' for the ring's color choice.
  const ringState = (key: TrackKey): ComplianceRingState => {
    const state = tracks[key];
    if (state.flag === 'critical') return 'rejected';
    return TRACK_TO_RING_STATE[state.status];
  };

  return (
    <ComplianceRing
      ncaa={ringState('ncaa')}
      school={ringState('school')}
      ethics={ringState('ethics')}
      size={56}
    />
  );
}

// ── Compact variant ────────────────────────────────────────

function CompactVariant({
  tracks,
  onTrackPress,
}: Pick<ComplianceTrackProps, 'tracks' | 'onTrackPress'>) {
  const keys: TrackKey[] = ['ncaa', 'school', 'ethics'];
  return (
    <View style={styles.compactRow}>
      {keys.map((key) => {
        const state = tracks[key];
        const { pillTone } = resolveTones(state);
        const icon: keyof typeof Ionicons.glyphMap | undefined =
          state.flag === 'critical'
            ? FLAG_ICON.critical
            : state.flag === 'warn'
              ? FLAG_ICON.warn
              : undefined;

        const pill = (
          <StatusPill
            label={compactLabel(key, state)}
            tone={pillTone}
            icon={icon}
          />
        );

        if (!onTrackPress) {
          return <View key={key}>{pill}</View>;
        }

        return (
          <Pressable
            key={key}
            onPress={() => onTrackPress(key)}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
            accessibilityRole="button"
            accessibilityLabel={`${TRACK_LABEL[key]} review — ${TRACK_STATUS_LABEL[state.status]}`}
          >
            {pill}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Full variant ───────────────────────────────────────────

function FullVariant({
  tracks,
  onTrackPress,
}: Pick<ComplianceTrackProps, 'tracks' | 'onTrackPress'>) {
  const { colors } = useAppTheme();
  const keys: TrackKey[] = ['ncaa', 'school', 'ethics'];

  // Aggregate reviewer notes for the footer line.
  const notes: string[] = keys
    .map((k) => tracks[k].note)
    .filter((n): n is string => Boolean(n && n.trim().length > 0));

  return (
    <View>
      {keys.map((key, idx) => {
        const state = tracks[key];
        const { dataRowTone, compliance } = resolveTones(state);
        const isLast = idx === keys.length - 1;

        const trailing = renderTrailing(state, colors.textSecondary, compliance);

        return (
          <DataRow
            key={key}
            label={TRACK_LABEL[key]}
            value={TRACK_STATUS_LABEL[state.status]}
            tone={dataRowTone}
            trailing={trailing}
            onPress={onTrackPress ? () => onTrackPress(key) : undefined}
            isLastInGroup={isLast}
          />
        );
      })}

      {notes.length > 0 ? (
        <View style={styles.notesRow}>
          <Text
            style={[styles.notesText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notes.join(' · ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Trailing element for the full-variant DataRow:
 *   - `pending` + `dueIn`  → "Due in 3 days" caption next to the value.
 *   - otherwise + `flag` (warn/critical) → small flag icon (Ionicons).
 *   - else                  → undefined (DataRow renders just the value).
 *
 * Tone-coloured for legibility against the (currently) muted status text.
 */
function renderTrailing(
  state: TrackState,
  captionColor: string,
  compliance: (typeof Compliance)[ComplianceState],
): React.ReactNode {
  // ink reads correctly on the row's background; falls back to caption
  // grey for muted/notRequired since Status.muted.ink IS a grey already.
  const color = compliance.ink;

  if (state.status === 'pending' && state.dueIn) {
    return (
      <View style={styles.trailing}>
        <Text style={[styles.valueText, { color }]}>
          {TRACK_STATUS_LABEL.pending}
        </Text>
        <Text style={[styles.caption, { color: captionColor }]} numberOfLines={1}>
          {`Due in ${state.dueIn}`}
        </Text>
      </View>
    );
  }

  if (state.flag === 'warn' || state.flag === 'critical') {
    const iconName = state.flag === 'critical' ? FLAG_ICON.critical : FLAG_ICON.warn;
    return (
      <View style={styles.trailing}>
        <Text style={[styles.valueText, { color }]}>
          {TRACK_STATUS_LABEL[state.status]}
        </Text>
        <Ionicons name={iconName} size={14} color={color} />
      </View>
    );
  }

  return undefined;
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  compactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  trailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  valueText: {
    ...Typography.body,
    textAlign: 'right',
  },
  caption: {
    ...Typography.caption,
  },
  notesRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  notesText: {
    ...Typography.caption,
  },
});
