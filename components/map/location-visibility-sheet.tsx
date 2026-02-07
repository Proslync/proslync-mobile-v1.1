// Location Visibility Sheet — Liquid glass "Who can see my location" settings

import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassOverlay } from '@/components/glass/glass-overlay';
import { GlassCard } from '@/components/glass/glass-card';
import { GlassText } from '@/components/glass/glass-text';
import { GlassButton } from '@/components/glass/glass-button';
import {
  spacing,
  radius,
  textColor,
  glassFill,
  glassBorder,
} from '@/constants/glass/tokens';
import { useLocationVisibility } from '@/hooks/use-location-visibility';
import { useAuth } from '@/lib/providers/auth-provider';
import { followsApi } from '@/lib/api/follows';
import type { UserFollowItem } from '@/lib/types/follows.types';
import type { LocationVisibilityMode } from '@/lib/types/location-visibility.types';
import {
  VISIBILITY_MODE_LABELS,
  VISIBILITY_MODE_ICONS,
} from '@/lib/types/location-visibility.types';

interface LocationVisibilitySheetProps {
  isVisible: boolean;
  onClose: () => void;
}

type Screen = 'modes' | 'picker';
type PickerTarget = 'allow' | 'block';

const MODE_ACCENT: Record<LocationVisibilityMode, string> = {
  everyone: '#ffffff',
  friends: 'rgba(255, 255, 255, 0.8)',
  only: 'rgba(255, 255, 255, 0.7)',
  except: 'rgba(255, 255, 255, 0.6)',
};

const MODE_DESCRIPTIONS: Record<LocationVisibilityMode, string> = {
  everyone: 'All Status users',
  friends: 'People who follow you',
  only: 'Hand-picked friends only',
  except: 'Everyone except specific people',
};

export function LocationVisibilitySheet({
  isVisible,
  onClose,
}: LocationVisibilitySheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    settings,
    setMode,
    toggleAllowList,
    toggleBlockList,
  } = useLocationVisibility();

  const [screen, setScreen] = React.useState<Screen>('modes');
  const [pickerTarget, setPickerTarget] = React.useState<PickerTarget>('allow');
  const [followers, setFollowers] = React.useState<UserFollowItem[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      setScreen('modes');
      setSearchQuery('');
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const fetchFollowers = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingFollowers(true);
    try {
      const data = await followsApi.getUserFollowers(user.id);
      setFollowers(data.userFollowers);
    } catch (e) {
      console.error('[VisibilitySheet] Failed to fetch followers:', e);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, [user?.id]);

  const handleModePress = (mode: LocationVisibilityMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === 'only') {
      setPickerTarget('allow');
      setScreen('picker');
      fetchFollowers();
      setMode(mode);
    } else if (mode === 'except') {
      setPickerTarget('block');
      setScreen('picker');
      fetchFollowers();
      setMode(mode);
    } else {
      setMode(mode);
    }
  };

  const handleToggleUser = (userId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pickerTarget === 'allow') {
      toggleAllowList(userId);
    } else {
      toggleBlockList(userId);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreen('modes');
    setSearchQuery('');
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScreen('modes');
    setSearchQuery('');
  };

  const selectedList =
    pickerTarget === 'allow' ? settings.allowList : settings.blockList;

  const filteredFollowers = React.useMemo(() => {
    if (!searchQuery.trim()) return followers;
    const q = searchQuery.toLowerCase();
    return followers.filter(
      (f) =>
        (f.firstName?.toLowerCase().includes(q) ?? false) ||
        (f.lastName?.toLowerCase().includes(q) ?? false) ||
        (f.userName?.toLowerCase().includes(q) ?? false)
    );
  }, [followers, searchQuery]);

  const modes: LocationVisibilityMode[] = [
    'everyone',
    'friends',
    'only',
    'except',
  ];

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['85%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
      enableDynamicSizing={false}
    >
      <BottomSheetView
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        {screen === 'modes' ? (
          /* ─── Screen 1: Mode Picker ─── */
          <View style={styles.modesContainer}>
            {/* Header icon with glow */}
            <View style={styles.headerIconWrap}>
              <View style={styles.headerGlow}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.5, y: 0.3 }}
                  end={{ x: 0.5, y: 1 }}
                />
              </View>
              <GlassOverlay
                blurIntensity="medium"
                fillLevel="light"
                borderLevel="medium"
                borderRadius={radius['2xl']}
                style={styles.headerIcon}
              >
                <Ionicons name="eye" size={26} color="#ffffff" />
              </GlassOverlay>
            </View>

            <GlassText weight="bold" size={20} style={styles.title}>
              Who Can See
            </GlassText>
            <GlassText hierarchy="muted" size={13} style={styles.subtitle}>
              Control who sees your live location
            </GlassText>

            {/* Mode rows — blurred glass group */}
            <GlassCard
              fill="light"
              border="subtle"
              cornerRadius="2xl"
              shadowLevel="md"
              blurIntensity="medium"
              style={styles.modesList}
            >
              {/* Top highlight */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={styles.innerHighlight}
              />
              {modes.map((mode, index) => {
                const isActive = settings.mode === mode;
                const hasPicker = mode === 'only' || mode === 'except';
                const count =
                  mode === 'only'
                    ? settings.allowList.length
                    : mode === 'except'
                      ? settings.blockList.length
                      : 0;

                return (
                  <React.Fragment key={mode}>
                    <TouchableOpacity
                      onPress={() => handleModePress(mode)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.modeRow, isActive && styles.modeRowActive]}>
                        <View
                          style={[
                            styles.modeIcon,
                            {
                              backgroundColor: `${MODE_ACCENT[mode]}18`,
                              borderColor: `${MODE_ACCENT[mode]}30`,
                            },
                          ]}
                        >
                          <Ionicons
                            name={VISIBILITY_MODE_ICONS[mode] as any}
                            size={18}
                            color={MODE_ACCENT[mode]}
                          />
                        </View>
                        <View style={styles.modeLabelContainer}>
                          <GlassText
                            hierarchy={isActive ? 'primary' : 'secondary'}
                            weight={isActive ? 'bold' : 'regular'}
                            size={17}
                          >
                            {VISIBILITY_MODE_LABELS[mode]}
                          </GlassText>
                          <GlassText hierarchy="muted" size={12}>
                            {MODE_DESCRIPTIONS[mode]}
                            {hasPicker && count > 0
                              ? ` · ${count} ${count === 1 ? 'person' : 'people'}`
                              : ''}
                          </GlassText>
                        </View>
                        {hasPicker ? (
                          <View style={styles.modeTrailing}>
                            {isActive && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color="#ffffff"
                              />
                            )}
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={textColor.faint}
                            />
                          </View>
                        ) : isActive ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#ffffff"
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    {index < modes.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                );
              })}
            </GlassCard>
          </View>
        ) : (
          /* ─── Screen 2: Friend Picker ─── */
          <View style={styles.pickerContainer}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <GlassOverlay
                  blurIntensity="light"
                  fillLevel="subtle"
                  borderLevel="subtle"
                  borderRadius={radius.md}
                  style={styles.backButtonInner}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={textColor.primary}
                  />
                </GlassOverlay>
              </TouchableOpacity>
              <GlassText weight="bold" size={18} style={styles.pickerTitle}>
                {pickerTarget === 'allow'
                  ? 'Select Friends'
                  : 'Exclude People'}
              </GlassText>
              <View style={styles.backButton} />
            </View>

            {/* Search */}
            <GlassCard
              fill="light"
              border="subtle"
              cornerRadius="xl"
              shadowLevel="sm"
              blurIntensity="light"
              style={styles.searchCard}
            >
              <View style={styles.searchContent}>
                <Ionicons
                  name="search"
                  size={16}
                  color={textColor.muted}
                />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor={textColor.muted}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={textColor.muted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>

            {/* Selected count */}
            {selectedList.length > 0 && (
              <GlassText
                hierarchy="tertiary"
                size={13}
                style={styles.selectedCount}
              >
                {selectedList.length} selected
              </GlassText>
            )}

            {/* Friend list */}
            {isLoadingFollowers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={textColor.muted} />
                <GlassText hierarchy="muted" size={14}>
                  Loading...
                </GlassText>
              </View>
            ) : filteredFollowers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <GlassOverlay
                  blurIntensity="light"
                  fillLevel="subtle"
                  borderRadius={radius.xl}
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="people-outline"
                    size={32}
                    color={textColor.faint}
                  />
                </GlassOverlay>
                <GlassText hierarchy="muted" size={14}>
                  {searchQuery ? 'No results' : 'No followers yet'}
                </GlassText>
              </View>
            ) : (
              <ScrollView
                style={styles.friendList}
                contentContainerStyle={styles.friendListContent}
                showsVerticalScrollIndicator={false}
              >
                <GlassCard
                  fill="light"
                  border="subtle"
                  cornerRadius="2xl"
                  shadowLevel="sm"
                  blurIntensity="light"
                  style={styles.friendListCard}
                >
                  {filteredFollowers.map((follower, index) => {
                    const isSelected = selectedList.includes(follower.id);
                    const displayName =
                      follower.firstName || follower.lastName
                        ? `${follower.firstName ?? ''} ${follower.lastName ?? ''}`.trim()
                        : follower.userName ?? `User ${follower.id}`;

                    return (
                      <React.Fragment key={follower.id}>
                        <TouchableOpacity
                          onPress={() => handleToggleUser(follower.id)}
                          activeOpacity={0.6}
                        >
                          <View
                            style={[
                              styles.friendRow,
                              isSelected && styles.friendRowSelected,
                            ]}
                          >
                            <View style={styles.friendAvatarWrap}>
                              <Image
                                source={{
                                  uri:
                                    follower.avatarUrl ??
                                    'https://i.pravatar.cc/150?u=default',
                                }}
                                style={styles.friendAvatar}
                              />
                              {isSelected && (
                                <View style={styles.friendAvatarRing} />
                              )}
                            </View>
                            <GlassText
                              hierarchy="primary"
                              size={16}
                              style={styles.friendName}
                            >
                              {displayName}
                            </GlassText>
                            <View style={[
                              styles.checkCircle,
                              isSelected && styles.checkCircleActive,
                            ]}>
                              {isSelected && (
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color="#000"
                                />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        {index < filteredFollowers.length - 1 && (
                          <View style={styles.friendSeparator} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </GlassCard>
              </ScrollView>
            )}

            {/* Done button */}
            <View style={styles.doneButtonContainer}>
              <GlassButton
                label="Done"
                variant="glass"
                size="lg"
                fullWidth
                onPress={handleDone}
              />
            </View>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: 'rgba(20, 20, 22, 0.85)',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: `rgba(255, 255, 255, ${glassBorder.medium.opacity})`,
  },
  sheetIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // ── Mode Picker ──
  modesContainer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  headerIconWrap: {
    position: 'relative',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  headerGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modesList: {
    width: '100%',
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  modeRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeLabelContainer: {
    flex: 1,
    gap: 2,
  },
  modeTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: spacing.lg + 34 + spacing.md,
  },

  // ── Friend Picker ──
  pickerContainer: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInner: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTitle: {
    textAlign: 'center',
  },
  searchCard: {
    marginBottom: spacing.md,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  selectedCount: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendList: {
    flex: 1,
  },
  friendListContent: {
    paddingBottom: spacing.md,
  },
  friendListCard: {
    overflow: 'hidden',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  friendRowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  friendAvatarWrap: {
    position: 'relative',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `rgba(255, 255, 255, ${glassFill.subtle})`,
  },
  friendAvatarRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  friendName: {
    flex: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  friendSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  doneButtonContainer: {
    paddingTop: spacing.md,
  },
});
