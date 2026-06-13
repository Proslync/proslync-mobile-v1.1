// ── ROLE SWITCHER SHEET ───────────────────────────────────
// Production-grade persona picker. Replaces the four+ ad-hoc role-
// switcher patterns scattered across `_dev/`, `admin/`, the persona
// shells, and the legacy floating "AS <role>" pill. Built from
// `RoleSurface` tokens in `constants/colors.ts` so each row reads as
// "the <role> lane" without re-implementing per-screen accent math.
//
// Usage — open imperatively from a header / button:
//   const [open, setOpen] = useState(false);
//   const role = useRole();
//   <RoleSwitcherSheet
//     visible={open}
//     onDismiss={() => setOpen(false)}
//     activeRole={role.role}
//     roles={['player','coach','agent','brand','fan','school','nilManager']}
//     onSelect={(r) => { role.setRole(r); setOpen(false); }}
//   />
//
// Anti-pattern (banned by `proslync-role-accents-application` skill):
//   shouty solid-fill pills. The sheet uses surfaceSubtle backgrounds
//   so the active row reads as "lit" without competing with copper.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSurface } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { ProfileRole } from '@/lib/providers/role-provider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Canonical role meta. Keeps icons + display labels in one place so
// every consumer of the sheet inherits the same vocabulary.
export const ROLE_META: Record<ProfileRole, { label: string; icon: IconName; description: string }> = {
  player: {
    label: 'Athlete',
    icon: 'person-outline',
    description: 'Profile, deals, calendar',
  },
  coach: {
    label: 'Coach',
    icon: 'megaphone-outline',
    description: 'Roster + program oversight',
  },
  agent: {
    label: 'Agent',
    icon: 'briefcase-outline',
    description: 'Athletes + pipeline',
  },
  brand: {
    label: 'Brand',
    icon: 'pricetags-outline',
    description: 'Sponsor + athlete search',
  },
  fan: {
    label: 'Fan',
    icon: 'heart-outline',
    description: 'Follow + perks',
  },
  school: {
    label: 'School',
    icon: 'school-outline',
    description: 'AD audit + rev share',
  },
  nilManager: {
    label: 'NIL Manager',
    icon: 'shield-checkmark-outline',
    description: 'Compliance review + closing',
  },
  collective: {
    label: 'Collective',
    icon: 'people-circle-outline',
    description: 'Clearance pipeline + fan commerce',
  },
};

// Map role-provider's ProfileRole → RoleAccent key.
// (Player → athlete; nilManager → admin.)
function roleAccentKey(role: ProfileRole): keyof typeof RoleSurface {
  if (role === 'player') return 'athlete';
  if (role === 'nilManager') return 'admin';
  return role as keyof typeof RoleSurface;
}

export interface RoleSwitcherSheetProps {
  visible: boolean;
  onDismiss: () => void;
  /** Currently-active role. Renders with selected indicator. */
  activeRole: ProfileRole | null;
  /** Subset / order of roles to offer. Defaults to all 7. */
  roles?: ProfileRole[];
  onSelect: (role: ProfileRole) => void;
  /** Sheet header. Defaults to "Switch persona". */
  title?: string;
}

const DEFAULT_ROLES: ProfileRole[] = [
  'player',
  'coach',
  'agent',
  'brand',
  'fan',
  'school',
  'nilManager',
];

export function RoleSwitcherSheet({
  visible,
  onDismiss,
  activeRole,
  roles = DEFAULT_ROLES,
  onSelect,
  title = 'Switch persona',
}: RoleSwitcherSheetProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={onDismiss} accessibilityLabel="Close">
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <View style={styles.list}>
            {roles.map((role) => {
              const surface = RoleSurface[roleAccentKey(role)];
              const meta = ROLE_META[role];
              const active = activeRole === role;
              return (
                <Pressable
                  key={role}
                  onPress={() => onSelect(role)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: active ? surface.surface : surface.surfaceSubtle,
                      borderColor: active ? surface.border : 'transparent',
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${meta.label} — ${meta.description}`}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: surface.surface,
                        borderColor: surface.border,
                      },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={18} color={surface.text} />
                  </View>

                  <View style={styles.rowBody}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>
                      {meta.label}
                    </Text>
                    <Text
                      style={[styles.rowDesc, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {meta.description}
                    </Text>
                  </View>

                  {active ? (
                    <Ionicons name="checkmark" size={20} color={surface.text} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: Typography.heading.fontSize,
    lineHeight: Typography.heading.lineHeight,
    fontWeight: '800',
  },
  list: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: Typography.title.fontFamily,
    fontSize: Typography.title.fontSize,
    fontWeight: '700',
  },
  rowDesc: {
    fontFamily: Typography.callout.fontFamily,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
});
