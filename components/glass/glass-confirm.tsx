import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const RADIUS = 20;
const SPRING_CONFIG = { damping: 22, stiffness: 280, mass: 0.8 };

interface GlassConfirmProps {
  /** Render the trigger button. Call `onPress` to open the confirm panel. */
  children: (props: { onPress: () => void }) => React.ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void | Promise<void>;
}

export function GlassConfirm({
  children,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  icon,
  onConfirm,
}: GlassConfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const open = useCallback(() => {
    setIsOpen(true);
    scale.value = withSpring(1, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 200 });
  }, [scale, opacity]);

  const close = useCallback(() => {
    scale.value = withTiming(0.9, { duration: 120 });
    opacity.value = withTiming(0, { duration: 120 });
    setTimeout(() => setIsOpen(false), 130);
  }, [scale, opacity]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      close();
    }
  }, [onConfirm, close]);

  const animatedPanelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconColor = destructive ? '#FF3B30' : '#1A1A1A';

  return (
    <GlassContainer spacing={6} style={styles.container}>
      {/* Trigger — rendered by consumer */}
      {children({ onPress: open })}

      {/* Confirmation panel — expands inline, morphs with trigger */}
      {isOpen && (
        <Animated.View style={animatedPanelStyle}>
          <GlassView
            {...liquidGlass.surface}
            borderRadius={RADIUS}
            style={styles.panel}
          >
            {/* Icon */}
            {icon && (
              <View style={styles.iconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={22}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name={icon} size={24} color={iconColor} />
              </View>
            )}

            {/* Text */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, isLoading && { opacity: 0.5 }]}
                onPress={close}
                disabled={isLoading}
              >
                <GlassView
                  {...liquidGlass.fill}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, isLoading && { opacity: 0.5 }]}
                onPress={handleConfirm}
                disabled={isLoading}
              >
                <GlassView
                  {...(destructive ? liquidGlass.danger : liquidGlass.fillMedium)}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                )}
              </Pressable>
            </View>
          </GlassView>
        </Animated.View>
      )}
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  panel: {
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#1A1A1A',
  },
  confirmText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
  },
});
