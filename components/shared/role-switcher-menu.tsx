import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useRole, type ProfileRole } from '@/lib/providers/role-provider';

const ACCENT = '#FF6F3C';

const ROLES: {
  role: ProfileRole;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    role: 'player',
    label: 'Player',
    description: 'Athlete profile · stats, deals, fans',
    icon: 'basketball-outline',
    color: '#FF6F3C',
  },
  {
    role: 'coach',
    label: 'Coach',
    description: 'Roster, film, practice plans',
    icon: 'megaphone-outline',
    color: '#FF6F3C',
  },
  {
    role: 'scorekeeper',
    label: 'Scorekeeper',
    description: 'Live scoring · box scores',
    icon: 'clipboard-outline',
    color: '#3B82F6',
  },
  {
    role: 'brand',
    label: 'Brand',
    description: 'Sponsor deals · athlete discovery',
    icon: 'briefcase-outline',
    color: '#00C6B0',
  },
  {
    role: 'fan',
    label: 'Fan',
    description: 'Follow athletes · claim perks',
    icon: 'heart-outline',
    color: '#A855F7',
  },
  {
    role: 'school',
    label: 'School',
    description: 'Athletics dept · roster · compliance',
    icon: 'school-outline',
    color: '#3B82F6',
  },
];

export function RoleSwitcherSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { role: activeRole, setRole } = useRole();

  const handlePick = (next: ProfileRole) => {
    setRole(next);
    onClose();
    setTimeout(() => router.replace('/(tabs)/profile' as any), 120);
  };

  const handleSettings = () => {
    onClose();
    setTimeout(() => router.push('/settings' as any), 120);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Switch Role</Text>
            <Text style={styles.sheetSub}>
              Swap how you experience Proslync
            </Text>
          </View>

          <View style={styles.list}>
            {ROLES.map((r, index) => {
              const selected = activeRole === r.role;
              return (
                <Animated.View
                  key={r.role}
                  entering={FadeInDown.delay(index * 40).duration(260)}
                >
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() => handlePick(r.role)}
                  >
                    <View
                      style={[
                        styles.icon,
                        selected && {
                          backgroundColor: `${r.color}24`,
                          borderColor: `${r.color}66`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={r.icon}
                        size={20}
                        color={selected ? r.color : 'rgba(255,255,255,0.85)'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{r.label}</Text>
                      <Text style={styles.rowDesc}>{r.description}</Text>
                    </View>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={r.color}
                      />
                    )}
                  </TouchableOpacity>
                  {index < ROLES.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </Animated.View>
              );
            })}

            <View style={styles.sectionDivider} />

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={handleSettings}
            >
              <View style={styles.icon}>
                <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Settings</Text>
                <Text style={styles.rowDesc}>Account, payouts, security</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#0F1012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  sheetSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },

  list: { paddingHorizontal: 12, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  rowDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 64,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
