// GlassSheet — Single import for all modal/sheet content styling.
// Provides consistent glass-themed containers, headers, buttons, and rows.
// Usage:
//   import { GlassSheet } from '@/components/shared/glass-sheet';
//   <GlassSheet.Header title="Title" onClose={close} />
//   <GlassSheet.Row label="Label" value="Value" />
//   <GlassSheet.Button label="Action" onPress={fn} />
//   <GlassSheet.DangerButton label="Delete" onPress={fn} />

import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';

// ─── Sheet header with title and close button ───

function Header({
  title,
  subtitle,
  onClose,
  rightElement,
}: {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      {onClose ? (
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <GlassView {...liquidGlass.fillMedium} borderRadius={16} style={StyleSheet.absoluteFill} />
          <Ionicons name="close" size={18} color="#1A1A1A" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} />
      )}
      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle && <Text style={s.headerSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ?? <View style={{ width: 32 }} />}
    </View>
  );
}

// ─── Section title ───

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      {title && <Text style={s.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

// ─── Labeled row (key → value) ───

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={s.row}>
      {icon && <Ionicons name={icon} size={18} color="rgba(0,0,0,0.4)" style={{ marginRight: 8 }} />}
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

// ─── Glass action button ───

function Button({
  label,
  onPress,
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[s.button, disabled && s.buttonDisabled, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <GlassView {...liquidGlass.fillMedium} borderRadius={12} style={StyleSheet.absoluteFill} />
      {icon && <Ionicons name={icon} size={18} color="#1A1A1A" />}
      <Text style={s.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Danger button ───

function DangerButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity style={s.dangerButton} onPress={onPress} activeOpacity={0.7}>
      <GlassView {...liquidGlass.danger} borderRadius={12} style={StyleSheet.absoluteFill} />
      {icon && <Ionicons name={icon} size={18} color="#FF3B30" />}
      <Text style={s.dangerButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Glass card container ───

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[s.card, style]}>
      <GlassView {...liquidGlass.surface} borderRadius={16} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

// ─── Content container with padding ───

function Content({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.content, style]}>{children}</View>;
}

// ─── Separator ───

function Separator() {
  return <View style={s.separator} />;
}

// ─── Compose namespace ───

export const GlassSheet = {
  Header,
  Section,
  Row,
  Button,
  DangerButton,
  Card,
  Content,
  Separator,
};

// ─── Styles ───

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 2,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(0,0,0,0.55)',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    gap: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Danger button
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    gap: 8,
    overflow: 'hidden',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // Card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 16,
    marginVertical: 8,
  },
});
