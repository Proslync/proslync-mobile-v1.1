// ── PERMISSION GRANT DETAIL ───────────────────────────────
// Sprint 3.7 detail view for one PermissionGrant. Renders the grant's
// header (reuses PermissionGrantCard for visual continuity), audit
// log timeline (latest first), and Pause / Revoke / Edit affordances
// that call into permissionGrantsApi and refresh the React Query
// cache. "Edit" toggles between consent levels (visual demo of
// `setLevel`) — full level / scope editing is a future iteration.

import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PermissionGrantCard,
  formatRelative,
} from '@/components/permissions/permission-grant-card';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  SectionCard,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import {
  ATHLETE_PERMISSION_GRANTS_KEY,
  PERMISSION_GRANT_KEY,
} from '@/hooks/use-permission-grants';
import { permissionGrantsApi } from '@/lib/api/permission-grants';
import type { ConsentLevel } from '@/lib/data/mock-nil-manager-data';
import type {
  PermissionGrant,
  PermissionGrantAuditAction,
} from '@/lib/types/permission-grant.types';

interface PermissionGrantDetailProps {
  grant: PermissionGrant;
}

const NEXT_LEVEL: Record<ConsentLevel, ConsentLevel> = {
  full: 'summary',
  summary: 'withheld',
  withheld: 'full',
};

export function PermissionGrantDetail({ grant }: PermissionGrantDetailProps) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState<null | 'pause' | 'revoke' | 'edit'>(null);

  const refresh = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [PERMISSION_GRANT_KEY, grant.id] });
    queryClient.invalidateQueries({
      queryKey: [ATHLETE_PERMISSION_GRANTS_KEY, grant.athleteId],
    });
  }, [grant.id, grant.athleteId, queryClient]);

  const onPause = React.useCallback(async () => {
    setBusy('pause');
    try {
      await permissionGrantsApi.updateGrantStatus(
        grant.id,
        grant.status === 'paused' ? 'active' : 'paused',
      );
      refresh();
    } finally {
      setBusy(null);
    }
  }, [grant.id, grant.status, refresh]);

  const onRevoke = React.useCallback(() => {
    Alert.alert(
      'Revoke this grant?',
      'The grantee will lose access immediately. The audit log keeps the full history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setBusy('revoke');
            try {
              await permissionGrantsApi.updateGrantStatus(grant.id, 'revoked');
              refresh();
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }, [grant.id, refresh]);

  const onEditLevel = React.useCallback(async () => {
    setBusy('edit');
    try {
      await permissionGrantsApi.setLevel(grant.id, NEXT_LEVEL[grant.level]);
      refresh();
    } finally {
      setBusy(null);
    }
  }, [grant.id, grant.level, refresh]);

  const auditDescending = React.useMemo(
    () => [...grant.auditLog].reverse(),
    [grant.auditLog],
  );

  const isRevoked = grant.status === 'revoked';

  return (
    <View style={styles.container}>
      <PermissionGrantCard grant={grant} />

      <View style={styles.actionsRow}>
        <ActionButton
          label={grant.status === 'paused' ? 'Resume' : 'Pause'}
          icon={grant.status === 'paused' ? 'play' : 'pause'}
          onPress={onPause}
          disabled={busy !== null || isRevoked}
          busy={busy === 'pause'}
        />
        <ActionButton
          label="Edit level"
          icon="options-outline"
          onPress={onEditLevel}
          disabled={busy !== null || isRevoked}
          busy={busy === 'edit'}
        />
        <ActionButton
          label="Revoke"
          icon="trash-outline"
          tone="danger"
          onPress={onRevoke}
          disabled={busy !== null || isRevoked}
          busy={busy === 'revoke'}
        />
      </View>

      <SectionCard title="Audit log" icon="time-outline" iconColor={TONE_COLOR.info}>
        <View style={styles.timeline}>
          {auditDescending.map((entry, index) => (
            <View key={`${entry.at}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineDotCol}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: actionTint(entry.action) },
                  ]}
                />
                {index < auditDescending.length - 1 ? (
                  <View style={styles.timelineLine} />
                ) : null}
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineAction}>
                  {formatAuditAction(entry.action)}
                </Text>
                <Text style={styles.timelineMeta} numberOfLines={1}>
                  {entry.actor.label} · {formatRelative(entry.at)}
                </Text>
                {entry.note ? (
                  <Text style={styles.timelineNote}>{entry.note}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Source" icon="link-outline" iconColor={TONE_COLOR.muted}>
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel} numberOfLines={2}>
            {grant.source.label}
          </Text>
          <Text style={styles.sourceMeta}>
            {(grant.source.kind === 'synthetic' ? 'verified' : grant.source.kind).toUpperCase()} · {grant.source.freshnessDays}d old
          </Text>
          {grant.source.caveat ? (
            <Text style={styles.sourceCaveat}>{grant.source.caveat}</Text>
          ) : null}
        </View>
      </SectionCard>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: 'neutral' | 'danger';
}

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  busy,
  tone = 'neutral',
}: ActionButtonProps) {
  const color = tone === 'danger' ? TONE_COLOR.danger : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        tone === 'danger' ? styles.actionBtnDanger : null,
        disabled ? styles.actionBtnDisabled : null,
        pressed ? styles.actionBtnPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={14} color={color} />
      )}
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function formatAuditAction(action: PermissionGrantAuditAction): string {
  if (action === 'updated-scopes') return 'Updated scopes';
  if (action === 'updated-level') return 'Updated level';
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function actionTint(action: PermissionGrantAuditAction): string {
  if (action === 'created') return TONE_COLOR.info;
  if (action === 'activated') return TONE_COLOR.success;
  if (action === 'paused') return TONE_COLOR.warning;
  if (action === 'revoked') return TONE_COLOR.danger;
  return TONE_COLOR.accent;
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  actionBtnDanger: {
    borderColor: 'rgba(255,69,58,0.40)',
    backgroundColor: 'rgba(255,69,58,0.10)',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 14,
    paddingTop: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 14,
    gap: 3,
  },
  timelineAction: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  timelineMeta: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineNote: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: CARD_BG_INSET,
  },
  sourceRow: {
    gap: 5,
  },
  sourceLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sourceMeta: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sourceCaveat: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
});
