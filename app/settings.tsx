import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { GlassView } from 'expo-glass-effect';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRole, type ProfileRole } from '@/lib/providers/role-provider';

const ACCENT = '#FF6F3C';

type RoleMeta = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  name: string;
  handle: string;
  avatarSource?: any;
};

const ROLE_META: Record<ProfileRole, RoleMeta> = {
  player: {
    label: 'Player',
    description: 'Athlete · stats, deals, fans',
    icon: 'basketball-outline',
    color: '#FF6F3C',
    name: 'Kiyan Anthony',
    handle: '@kiyan',
    avatarSource: require('@/assets/images/kiyan-avatar.png'),
  },
  coach: {
    label: 'Coach',
    description: 'Roster, film, practice plans',
    icon: 'megaphone-outline',
    color: '#FF6F3C',
    name: 'Coach Glenn Farello',
    handle: '@coachfarello',
    avatarSource: require('@/assets/images/coach-avatar.png'),
  },
  agent: {
    label: 'Agent',
    description: 'Manage athletes · negotiate NIL deals',
    icon: 'people-outline',
    color: '#14B8A6',
    name: 'Daniel Hayes',
    handle: '@danielhayes',
  },
  brand: {
    label: 'Brand',
    description: 'Sponsor deals · athlete discovery',
    icon: 'briefcase-outline',
    color: '#00C6B0',
    name: 'PUMA Hoops',
    handle: '@pumahoops',
  },
  fan: {
    label: 'Fan',
    description: 'Follow athletes · claim perks',
    icon: 'heart-outline',
    color: '#A855F7',
    name: 'Marcus Delgado',
    handle: '@marcdelgado',
  },
  school: {
    label: 'School',
    description: 'Athletics dept · roster · compliance',
    icon: 'school-outline',
    color: '#3B82F6',
    name: 'Syracuse University',
    handle: '@syracuse',
  },
};

const ROLES: ProfileRole[] = ['player', 'coach', 'agent', 'brand', 'fan', 'school'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { role: activeProfile, setRole: setActiveProfile } = useRole();
  const [switchProfileVisible, setSwitchProfileVisible] = React.useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = React.useState(false);

  const handleSwitch = (role: ProfileRole) => {
    setActiveProfile(role);
    setSwitchProfileVisible(false);
    setTimeout(() => router.replace('/(tabs)/profile' as any), 120);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <SectionLabel>ACCOUNT</SectionLabel>
          <View style={styles.card}>
            <SettingRow
              icon="card-outline"
              iconBg="rgba(168,85,247,0.14)"
              iconColor="#A855F7"
              label="Payouts & wallet"
              sub="Stripe Connect · tax forms"
              onPress={() => router.push('/dashboard/payments' as any)}
            />
            <Divider />
            <SettingRow
              icon="key-outline"
              iconBg="rgba(255,255,255,0.08)"
              iconColor="#FFFFFF"
              label="Security"
              sub="Passkey, 2FA, connected devices"
              onPress={() => {}}
            />
          </View>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeIn.delay(440).duration(450)} style={styles.versionWrap}>
          <Text style={styles.versionText}>Proslync · v1.0.0 (build 24)</Text>
          <Text style={styles.versionSub}>Made in Brooklyn</Text>
        </Animated.View>
      </ScrollView>

      {/* Floating bottom toolbar — back | contact | logout */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: insets.bottom + 90 }]}
        pointerEvents="none"
      />
      <View style={[styles.bottomToolbar, { bottom: insets.bottom + 10 }]}>
        <Pressable
          style={styles.toolbarCircle}
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </Pressable>

        <Pressable
          style={styles.toolbarPill}
          onPress={() => {}}
          accessibilityLabel="Contact Proslync"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Text style={styles.toolbarPillText}>Contact Proslync</Text>
        </Pressable>

        <Pressable
          style={styles.toolbarCircle}
          onPress={() => setLogoutConfirmVisible(true)}
          accessibilityLabel="Log out"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
        </Pressable>
      </View>

      {/* Switch profile modal (still accessible if needed, but pills are primary) */}
      <Modal
        visible={switchProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitchProfileVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSwitchProfileVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Profile</Text>
              <Text style={styles.modalSubtitle}>Choose how you want to use Proslync</Text>
            </View>

            <View style={styles.modalList}>
              {ROLES.map((r, index) => {
                const meta = ROLE_META[r];
                const selected = activeProfile === r;
                return (
                  <React.Fragment key={r}>
                    <TouchableOpacity
                      style={styles.profileRow}
                      activeOpacity={0.7}
                      onPress={() => handleSwitch(r)}
                    >
                      <View
                        style={[
                          styles.profileIcon,
                          selected && { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}60` },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={20}
                          color={selected ? meta.color : 'rgba(255,255,255,0.85)'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileLabel}>{meta.label}</Text>
                        <Text style={styles.profileDesc}>{meta.description}</Text>
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={22} color={meta.color} />}
                    </TouchableOpacity>
                    {index < ROLES.length - 1 && <View style={styles.profileDivider} />}
                  </React.Fragment>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalCancel}
              activeOpacity={0.7}
              onPress={() => setSwitchProfileVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout confirm */}
      <Modal
        visible={logoutConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutConfirmVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLogoutConfirmVisible(false)}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.confirmIcon}>
              <Ionicons name="log-out-outline" size={26} color="#FF4444" />
            </View>
            <Text style={styles.confirmTitle}>Log out?</Text>
            <Text style={styles.confirmSub}>
              You'll need to sign back in with your Proslync account to continue.
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmBtn}
                activeOpacity={0.7}
                onPress={() => setLogoutConfirmVisible(false)}
              >
                <Text style={styles.confirmBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnDanger]}
                activeOpacity={0.7}
                onPress={() => {
                  setLogoutConfirmVisible(false);
                  logout();
                }}
              >
                <Text style={[styles.confirmBtnText, { color: '#FF4444', fontWeight: '700' }]}>
                  Log out
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingRow({
  icon,
  iconBg,
  iconColor,
  label,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 2,
  },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },

  // Generic card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    marginBottom: 20,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14.5, color: '#FFFFFF', fontWeight: '600' },
  rowSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 62,
  },

  versionWrap: { alignItems: 'center', marginTop: 22 },
  versionText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },
  versionSub: { color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 3, fontStyle: 'italic' },

  // Switch modal (kept for safety — not used as primary UI anymore)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F1012',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  modalList: { paddingHorizontal: 12, paddingBottom: 8 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  profileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileLabel: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  profileDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  profileDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 64,
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  modalCancelText: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },

  // Logout confirm
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F1012',
    borderRadius: 22,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  confirmSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 18, width: '100%' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  confirmBtnDanger: {
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderColor: 'rgba(255,68,68,0.35)',
  },
  confirmBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },

  // Floating bottom toolbar
  bottomToolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 100,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
