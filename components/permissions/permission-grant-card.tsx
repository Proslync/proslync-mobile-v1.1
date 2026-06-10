// ── PERMISSION GRANT CARD ─────────────────────────────────
// One-grant tile for Sprint 3.7. Shows grantee identity (with the
// GranteeKind chip), consent level (full → success teal,
// summary → accent, withheld → muted), scopes as chip row, status
// pill, rationale, and the most recent audit timestamp.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type { ConsentLevel } from '@/lib/data/mock-nil-manager-data';
import type {
  GrantStatus,
  GranteeKind,
  PermissionGrant,
  PermissionScope,
} from '@/lib/types/permission-grant.types';

interface PermissionGrantCardProps {
  grant: PermissionGrant;
  onPress?: (grant: PermissionGrant) => void;
}

export function PermissionGrantCard({ grant, onPress }: PermissionGrantCardProps) {
  const granteeLabel = formatGranteeLabel(grant);
  const granteeSub = formatGranteeSubLabel(grant);
  const granteeKindLabel = formatGranteeKind(grant.grantee.kind);
  const levelTone = levelToTone(grant.level);
  const statusTone = statusToTone(grant.status);
  const lastEntry = grant.auditLog[grant.auditLog.length - 1];

  return (
    <Pressable
      onPress={onPress ? () => onPress(grant) : undefined}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Permission grant for ${granteeLabel}`}
    >
      <View style={styles.headRow}>
        <View style={styles.identityCol}>
          <View style={styles.kindChipRow}>
            <View style={styles.kindChip}>
              <Ionicons name={granteeKindIcon(grant.grantee.kind)} size={11} color="rgba(255,255,255,0.74)" />
              <Text style={styles.kindChipText}>{granteeKindLabel}</Text>
            </View>
            <StatusPill
              label={grant.level.toUpperCase()}
              tone={levelTone}
            />
          </View>
          <Text style={styles.granteeName} numberOfLines={1}>
            {granteeLabel}
          </Text>
          {granteeSub ? (
            <Text style={styles.granteeSub} numberOfLines={1}>
              {granteeSub}
            </Text>
          ) : null}
        </View>
        <StatusPill label={grant.status.toUpperCase()} tone={statusTone} />
      </View>

      <View style={styles.scopesRow}>
        {grant.scopes.map((scope) => (
          <View key={scope} style={styles.scopeChip}>
            <Text style={styles.scopeChipText}>{formatScope(scope)}</Text>
          </View>
        ))}
      </View>

      {grant.rationale ? (
        <Text style={styles.rationale} numberOfLines={3}>
          {grant.rationale}
        </Text>
      ) : null}

      {lastEntry ? (
        <Text style={styles.footer} numberOfLines={1}>
          Last update {formatRelative(lastEntry.at)} · {lastEntry.actor.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function levelToTone(level: ConsentLevel): Tone {
  if (level === 'full') return 'success';
  if (level === 'summary') return 'accent';
  return 'muted';
}

export function statusToTone(status: GrantStatus): Tone {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'info';
  if (status === 'paused') return 'warning';
  if (status === 'revoked') return 'danger';
  return 'muted';
}

export function formatGranteeKind(kind: GranteeKind): string {
  if (kind === 'role') return 'Role';
  if (kind === 'individual') return 'Individual';
  return 'Organization';
}

export function granteeKindIcon(kind: GranteeKind): keyof typeof Ionicons.glyphMap {
  if (kind === 'role') return 'people-outline';
  if (kind === 'individual') return 'person-outline';
  return 'business-outline';
}

export function formatGranteeLabel(grant: PermissionGrant): string {
  const { grantee } = grant;
  if (grantee.kind === 'role') {
    return formatRoleLabel(grantee.roleKey);
  }
  if (grantee.kind === 'individual') {
    return grantee.individualName ?? 'Individual';
  }
  return grantee.organizationName ?? 'Organization';
}

export function formatGranteeSubLabel(grant: PermissionGrant): string | undefined {
  if (grant.grantee.kind === 'individual') {
    return grant.grantee.individualRoleLabel;
  }
  if (grant.grantee.kind === 'role') {
    return 'All actors in this role';
  }
  return undefined;
}

function formatRoleLabel(role: string | undefined): string {
  if (!role) return 'Role';
  if (role === 'nilManager') return 'NIL Manager';
  if (role === 'player') return 'Athletes';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatScope(scope: PermissionScope): string {
  if (scope === 'comp-evidence') return 'Comp evidence';
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  const day = 86_400_000;
  const hour = 3_600_000;
  const min = 60_000;
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / min))}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  const days = Math.floor(diffMs / day);
  if (days < 60) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  headRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  identityCol: {
    flex: 1,
    gap: 5,
  },
  kindChipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  kindChip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  kindChipText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  granteeName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  granteeSub: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11.5,
    fontWeight: '600',
  },
  scopesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scopeChipText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  rationale: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

// Re-export tone constants in case future callers need to match.
export const PERMISSION_GRANT_TONES = TONE_COLOR;
