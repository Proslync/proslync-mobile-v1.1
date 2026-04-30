// Floating glass toolbar that sits above the native floating tab bar.
// Per-screen action buttons — analogous to UIToolbar in iOS apps like
// Mail, Notes, Files (where toolbar = page-level actions, distinct from
// tab bar = navigation).

import * as React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';

const TAB_BAR_TOP_FROM_BOTTOM = 90;

export type ToolbarAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string; // a11y label
  onPress?: () => void;
  badge?: number;
};

export function ScreenToolbar({
  actions,
  bottomOffset = TAB_BAR_TOP_FROM_BOTTOM + 10,
}: {
  actions: ToolbarAction[];
  bottomOffset?: number;
}) {
  if (actions.length === 0) return null;

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.pill}>
        <View style={styles.glassLayer} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
          />
        </View>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            style={styles.btn}
            accessibilityLabel={a.label ?? a.key}
            accessibilityRole="button"
          >
            <Ionicons name={a.icon} size={20} color="#FFF" />
            {a.badge != null && a.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{a.badge > 99 ? '99+' : String(a.badge)}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },
  pill: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  glassLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 23,
  },
  btn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#FF6F3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
