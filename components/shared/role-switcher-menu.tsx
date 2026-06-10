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
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useRole, type ProfileRole } from '@/lib/providers/role-provider';

const SHEET_TRAVEL = 600;

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
    role: 'agent',
    label: 'Agent',
    description: 'Manage athletes · negotiate NIL deals',
    icon: 'people-outline',
    color: '#14B8A6',
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
  {
    role: 'nilManager',
    label: 'NIL Manager',
    description: 'School compliance · view-only roster + deals',
    icon: 'shield-checkmark-outline',
    color: '#001A57',
  },
];

export function RoleSwitcherSheet({
  visible,
  onClose,
  onEditProfile,
  onGoLive,
  isEditing,
  onChangeBanner,
  onRemoveBanner,
  hasCustomBanner,
  onChangeAvatar,
  onRemoveAvatar,
  hasCustomAvatar,
  accountMode,
  onSwitchAccountMode,
}: {
  visible: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
  onGoLive?: () => void;
  isEditing?: boolean;
  onChangeBanner?: () => void;
  onRemoveBanner?: () => void;
  hasCustomBanner?: boolean;
  onChangeAvatar?: () => void;
  onRemoveAvatar?: () => void;
  hasCustomAvatar?: boolean;
  accountMode?: 'personal' | 'professional';
  onSwitchAccountMode?: (mode: 'personal' | 'professional') => void;
}) {
  const router = useRouter();
  const { role: activeRole, setRole } = useRole();

  const translateY = useSharedValue(SHEET_TRAVEL);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = 1;
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(SHEET_TRAVEL, { duration: 220 });
    backdropOpacity.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 220);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropOpacity.value = 1 - Math.min(e.translationY / SHEET_TRAVEL, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
        translateY.value = withTiming(SHEET_TRAVEL, { duration: 220 });
        backdropOpacity.value = withTiming(0, { duration: 220 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${0.72 * backdropOpacity.value})`,
  }));

  const handlePick = (next: ProfileRole) => {
    setRole(next);
    dismiss();
    setTimeout(() => router.replace('/(tabs)/profile' as any), 240);
  };

  const handleSettings = () => {
    dismiss();
    setTimeout(() => router.push('/settings' as any), 240);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetAnimStyle]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Switch Role</Text>
            <Text style={styles.sheetSub}>
              Swap how you experience Proslync
            </Text>
          </View>

          <View style={styles.list}>
            {accountMode && onSwitchAccountMode && (
              <View style={styles.accountToggle}>
                {(['personal', 'professional'] as const).map((m) => {
                  const active = accountMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.accountSeg, active && styles.accountSegActive]}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        onSwitchAccountMode(m);
                        dismiss();
                      }}
                    >
                      <Ionicons
                        name={m === 'personal' ? 'person-outline' : 'briefcase-outline'}
                        size={15}
                        color={active ? '#000' : 'rgba(255,255,255,0.7)'}
                      />
                      <Text style={[styles.accountSegText, active && styles.accountSegTextActive]}>
                        {m === 'personal' ? 'Personal' : 'Professional'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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

            {onEditProfile && (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  dismiss();
                  setTimeout(onEditProfile, 240);
                }}
              >
                <View style={styles.icon}>
                  <Ionicons
                    name={isEditing ? 'checkmark-outline' : 'pencil-outline'}
                    size={20}
                    color="rgba(255,255,255,0.85)"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
                  <Text style={styles.rowDesc}>Update bio, photos, and links</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            {onGoLive && (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  dismiss();
                  setTimeout(onGoLive, 240);
                }}
              >
                <View style={[styles.icon, { backgroundColor: 'rgba(255,68,68,0.18)', borderColor: 'rgba(255,68,68,0.45)' }]}>
                  <Ionicons name="radio" size={20} color="#FF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Go Live</Text>
                  <Text style={styles.rowDesc}>Start a livestream for your fans</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            {onChangeBanner && (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  dismiss();
                  setTimeout(onChangeBanner, 240);
                }}
              >
                <View style={styles.icon}>
                  <Ionicons name="videocam-outline" size={20} color="rgba(255,255,255,0.85)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{hasCustomBanner ? 'Change banner' : 'Set banner'}</Text>
                  <Text style={styles.rowDesc}>Loops behind your profile header</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            {hasCustomBanner && onRemoveBanner && (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  dismiss();
                  setTimeout(onRemoveBanner, 240);
                }}
              >
                <View style={styles.icon}>
                  <Ionicons name="trash-outline" size={20} color="#FF453A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: '#FF453A' }]}>Remove banner</Text>
                  <Text style={styles.rowDesc}>Restore the default cover image</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            {onChangeAvatar && (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  dismiss();
                  setTimeout(onChangeAvatar, 240);
                }}
              >
                <View style={styles.icon}>
                  <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.85)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{hasCustomAvatar ? 'Change profile photo' : 'Set profile photo'}</Text>
                  <Text style={styles.rowDesc}>Shown on your profile + menu</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

            {hasCustomAvatar && onRemoveAvatar && (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  dismiss();
                  setTimeout(onRemoveAvatar, 240);
                }}
              >
                <View style={styles.icon}>
                  <Ionicons name="trash-outline" size={20} color="#FF453A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: '#FF453A' }]}>Remove profile photo</Text>
                  <Text style={styles.rowDesc}>Restore the default avatar</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}

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
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
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
  accountToggle: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountSeg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  accountSegActive: { backgroundColor: '#FFF' },
  accountSegText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  accountSegTextActive: { color: '#000' },
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
