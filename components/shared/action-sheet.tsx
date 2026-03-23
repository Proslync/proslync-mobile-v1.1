import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const TAB_BAR_HEIGHT = 49;
const RADIUS = 24;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      bottomSheetRef.current?.close();
      scale.value = withTiming(0.85, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSelect = React.useCallback((option: ActionSheetOption) => {
    bottomSheetRef.current?.close();
    setTimeout(() => option.onPress(), 150);
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: 'transparent',
        borderRadius: RADIUS,
      }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView style={styles.sheetContent}>
        <Animated.View style={animatedContentStyle}>
          {/* GlassContainer merges child GlassViews into one fluid glass surface */}
          <GlassContainer spacing={8} style={styles.glassContainer}>
            {/* Title area */}
            {title && (
              <GlassView
                {...liquidGlass.fillFaint}
                borderRadius={RADIUS}
                style={styles.titleGlass}
              >
                <Text style={styles.title}>{title}</Text>
              </GlassView>
            )}

            {/* Options group — single glass surface with separator lines */}
            <GlassView
              {...liquidGlass.surface}
              borderRadius={RADIUS}
              style={styles.optionsGlass}
            >
              {options.map((option, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.6}
                  >
                    {option.icon && (
                      <View style={styles.iconCircle}>
                        <GlassView
                          {...liquidGlass.fillMedium}
                          borderRadius={16}
                          style={StyleSheet.absoluteFill}
                        />
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={option.destructive ? '#FF3B30' : '#fff'}
                        />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        option.destructive && styles.optionDestructive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </GlassView>
          </GlassContainer>
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  glassContainer: {
    gap: 8,
  },
  titleGlass: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  optionsGlass: {
    paddingVertical: 4,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  optionDestructive: {
    color: '#FF3B30',
  },
});
