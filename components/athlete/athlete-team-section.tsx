// Athlete Team section — extracted from athlete-view.tsx for the R5 remix.
// Lists coaching staff + roster. Roster rows mirror the coach dashboard's
// roster cards exactly (avatar · #num name · meta · PPG/FG stats · trend).
import * as React from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { useStableRouter } from '@/hooks/use-stable-router';

const ACCENT = '#EB621A';
const OVERRIDES_KEY = 'proslync:athlete:team-overrides:v1';

type Trend = 'up' | 'down' | 'flat';
type Status = 'active' | 'questionable' | 'out';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  tag?: string;
  color: string;
  initials: string;
  /** Optional headshot URL (pravatar mock until real photos exist). */
  avatar?: string;
  // Roster-only stat fields (mirror coach RosterPlayer)
  number?: number;
  position?: string;
  classYear?: string;
  height?: string;
  ppg?: number;
  fgPct?: number;
  trend?: Trend;
  status?: Status;
};

// User overrides persisted via AsyncStorage — long-press a row to edit.
type TeamOverride = Partial<Pick<TeamMember, 'name' | 'role' | 'avatar' | 'initials'>>;

function deriveInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function useTeamOverrides() {
  const [overrides, setOverrides] = React.useState<Record<string, TeamOverride>>({});

  React.useEffect(() => {
    AsyncStorage.getItem(OVERRIDES_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') setOverrides(parsed);
        } catch {
          /* corrupt blob — ignore */
        }
      })
      .catch(() => {
        /* noop */
      });
  }, []);

  const setOverride = React.useCallback((id: string, patch: TeamOverride) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      AsyncStorage.setItem(OVERRIDES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { overrides, setOverride };
}

const COACHING_STAFF: TeamMember[] = [
  { id: 'c-autry', name: 'Adrian "Red" Autry', role: 'Head Coach', tag: '2nd season', color: '#F76900', initials: 'AA', avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 'c-gmac', name: 'Gerry McNamara', role: 'Assistant · PG Dev', tag: 'Cuse alum', color: '#F76900', initials: 'GM', avatar: 'https://i.pravatar.cc/150?img=51' },
  { id: 'c-tony', name: 'Tony Brown', role: 'Assistant · Wings', color: '#0F1B3F', initials: 'TB', avatar: 'https://i.pravatar.cc/150?img=68' },
  { id: 'c-allen', name: 'Allen Griffin', role: 'Assistant · Post', color: '#0F1B3F', initials: 'AG', avatar: 'https://i.pravatar.cc/150?img=12' },
];

const ROSTER: TeamMember[] = [
  { id: 'r-jj', name: 'JJ Starling', role: 'G · Junior', color: '#F76900', initials: 'JS', avatar: 'https://i.pravatar.cc/150?img=7', number: 11, position: 'G', classYear: 'Jr', height: '6\'4"', ppg: 14.2, fgPct: 45, trend: 'up', status: 'active' },
  { id: 'r-donnie', name: 'Donnie Freeman', role: 'F · Sophomore', color: '#F76900', initials: 'DF', avatar: 'https://i.pravatar.cc/150?img=15', number: 4, position: 'F', classYear: 'So', height: '6\'8"', ppg: 13.1, fgPct: 49, trend: 'up', status: 'active' },
  { id: 'r-naithan', name: 'Naithan George', role: 'G · Junior', color: '#0F1B3F', initials: 'NG', avatar: 'https://i.pravatar.cc/150?img=22', number: 2, position: 'G', classYear: 'Jr', height: '6\'3"', ppg: 9.8, fgPct: 41, trend: 'flat', status: 'questionable' },
  { id: 'r-lucas', name: 'Lucas Taylor', role: 'G · Senior', color: '#0F1B3F', initials: 'LT', avatar: 'https://i.pravatar.cc/150?img=8', number: 23, position: 'G', classYear: 'Sr', height: '6\'4"', ppg: 7.5, fgPct: 43, trend: 'down', status: 'active' },
  { id: 'r-eddie', name: 'Eddie Lampkin Jr.', role: 'C · Senior', color: '#F76900', initials: 'EL', avatar: 'https://i.pravatar.cc/150?img=14', number: 5, position: 'C', classYear: 'Sr', height: '6\'11"', ppg: 8.9, fgPct: 58, trend: 'up', status: 'active' },
];

function trendBadge(trend: Trend): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  if (trend === 'up') return { icon: 'caret-up', color: '#34C759' };
  if (trend === 'down') return { icon: 'caret-down', color: '#FF453A' };
  return { icon: 'remove', color: 'rgba(255,255,255,0.55)' };
}

function statusBadge(status?: Status): { label: string; color: string } | null {
  if (!status || status === 'active') return null;
  if (status === 'questionable') return { label: 'Q', color: '#FFD60A' };
  return { label: 'OUT', color: '#FF453A' };
}

function MemberRow({
  member,
  kind,
  onPress,
  onLongPress,
}: {
  member: TeamMember;
  kind: 'staff' | 'roster';
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const isPlayer = kind === 'roster';
  const stat = statusBadge(member.status);
  const trend = member.trend ? trendBadge(member.trend) : null;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.rosterRow, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.role}`}
      accessibilityHint="Long-press to edit name, role, or photo"
    >
      <View style={[styles.rosterAvatar, { backgroundColor: member.color }]}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.rosterAvatarImage} />
        ) : (
          <Text style={styles.rosterAvatarText}>{member.initials}</Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rosterNameRow}>
          <Text style={styles.rosterName} numberOfLines={1}>
            {isPlayer && member.number != null ? `#${member.number}  ${member.name}` : member.name}
          </Text>
          {isPlayer && stat ? (
            <View style={[styles.rosterStatusPill, { backgroundColor: `${stat.color}26`, borderColor: `${stat.color}66` }]}>
              <Text style={[styles.rosterStatusText, { color: stat.color }]}>{stat.label}</Text>
            </View>
          ) : null}
          {!isPlayer && member.tag ? (
            <View style={[styles.rosterStatusPill, { backgroundColor: `${ACCENT}26`, borderColor: `${ACCENT}66` }]}>
              <Text style={[styles.rosterStatusText, { color: ACCENT }]}>{member.tag.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.rosterMeta}>
          {isPlayer ? `${member.position} · ${member.classYear} · ${member.height}` : member.role}
        </Text>
      </View>

      {isPlayer ? (
        <>
          <View style={styles.rosterStatBlock}>
            <Text style={styles.rosterStatBig}>{member.ppg?.toFixed(1)}</Text>
            <Text style={styles.rosterStatSmall}>PPG</Text>
          </View>
          <View style={styles.rosterStatBlock}>
            <Text style={styles.rosterStatBig}>{member.fgPct?.toFixed(0)}%</Text>
            <Text style={styles.rosterStatSmall}>FG</Text>
          </View>
          {trend ? <Ionicons name={trend.icon} size={16} color={trend.color} /> : null}
        </>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
      )}
    </Pressable>
  );
}

export function AthleteTeamSection() {
  const router = useStableRouter();
  const { overrides, setOverride } = useTeamOverrides();
  const [editMember, setEditMember] = React.useState<TeamMember | null>(null);

  const applyOverride = (m: TeamMember): TeamMember => {
    const o = overrides[m.id];
    return o ? { ...m, ...o } : m;
  };

  const openMember = (m: TeamMember, kind: 'staff' | 'roster') => {
    router.push({
      pathname: '/team-member/[id]',
      params: {
        id: m.id,
        name: m.name,
        role: m.role,
        tag: m.tag ?? '',
        color: m.color,
        initial: m.initials,
        avatar: m.avatar ?? '',
        kind,
      },
    });
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.groupDivider, { marginTop: 0 }]}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>COACHING STAFF</Text>
        <View style={styles.dividerLine} />
      </View>

      {COACHING_STAFF.map((base) => {
        const m = applyOverride(base);
        return (
          <MemberRow
            key={m.id}
            member={m}
            kind="staff"
            onPress={() => openMember(m, 'staff')}
            onLongPress={() => setEditMember(m)}
          />
        );
      })}

      <View style={styles.groupDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>ROSTER</Text>
        <View style={styles.dividerLine} />
      </View>

      {ROSTER.map((base) => {
        const m = applyOverride(base);
        return (
          <MemberRow
            key={m.id}
            member={m}
            kind="roster"
            onPress={() => openMember(m, 'roster')}
            onLongPress={() => setEditMember(m)}
          />
        );
      })}

      <EditMemberSheet
        visible={!!editMember}
        member={editMember}
        onClose={() => setEditMember(null)}
        onSave={(id, patch) => setOverride(id, patch)}
      />
    </View>
  );
}

function EditMemberSheet({
  visible,
  member,
  onClose,
  onSave,
}: {
  visible: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSave: (id: string, patch: TeamOverride) => void;
}) {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [avatar, setAvatar] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!member) return;
    setName(member.name);
    setRole(member.role);
    setAvatar(member.avatar);
  }, [member]);

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to change the profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Could not open photos', 'Try again from Settings.');
    }
  };

  const save = () => {
    if (!member) return;
    const trimmedName = name.trim() || member.name;
    const trimmedRole = role.trim() || member.role;
    onSave(member.id, {
      name: trimmedName,
      role: trimmedRole,
      avatar,
      initials: deriveInitials(trimmedName),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={editStyles.flex}
      >
        <Pressable style={editStyles.backdrop} onPress={onClose}>
          <Pressable style={editStyles.sheet} onPress={() => {}}>
            <View style={editStyles.grabber} />
            <Text style={editStyles.title}>Edit team member</Text>
            <Text style={editStyles.subtitle}>Long-press saved locally on this device.</Text>

            <Pressable style={editStyles.avatarPicker} onPress={pickPhoto} accessibilityRole="button">
              <View style={[editStyles.avatarRing, { borderColor: member?.color ?? ACCENT }]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={editStyles.avatarImage} />
                ) : (
                  <View style={[editStyles.avatarFallback, { backgroundColor: member?.color ?? '#333' }]}>
                    <Text style={editStyles.avatarFallbackText}>
                      {deriveInitials(name || member?.name || '')}
                    </Text>
                  </View>
                )}
                <View style={editStyles.cameraDot}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </View>
              </View>
              <Text style={editStyles.changeText}>Tap to change photo</Text>
            </Pressable>

            <View style={editStyles.field}>
              <Text style={editStyles.label}>NAME</Text>
              <TextInput
                style={editStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="Member name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={editStyles.field}>
              <Text style={editStyles.label}>ROLE</Text>
              <TextInput
                style={editStyles.input}
                value={role}
                onChangeText={setRole}
                placeholder="Role / position"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={save}
              />
            </View>

            <View style={editStyles.actions}>
              <Pressable onPress={onClose} style={[editStyles.btn, editStyles.btnGhost]}>
                <Text style={editStyles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={[editStyles.btn, editStyles.btnPrimary]}>
                <Text style={editStyles.btnPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rosterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: -0.3 },
  rosterAvatarImage: { width: 38, height: 38, borderRadius: 19 },
  rosterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rosterName: { color: '#FFF', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  rosterMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
  rosterStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rosterStatusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  rosterStatBlock: { alignItems: 'center', minWidth: 36 },
  rosterStatBig: { color: '#FFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rosterStatSmall: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '600', marginTop: 1 },
  groupDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dividerLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
});

const editStyles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 6,
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: -8 },

  avatarPicker: { alignItems: 'center', gap: 8, marginVertical: 6 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: 78, height: 78, borderRadius: 39 },
  avatarFallback: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  cameraDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  changeText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },

  field: { gap: 6 },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  input: {
    color: '#FFF',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnGhostText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  btnPrimary: { backgroundColor: ACCENT },
  btnPrimaryText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
