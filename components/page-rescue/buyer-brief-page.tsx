// ── BUYER BRIEF PAGE ─────────────────────────────────────
// One decisive lead item, one quiet ribbon, one action stream.
// This is the default rescue layout for professional Home cockpits.

import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import type {
  BuyerBriefStreamItem,
  PageRescueIntent,
} from '@/lib/types/page-rescue.types';

import type { BuyerBriefPageProps } from './types';

const INTENT_COLOR: Record<PageRescueIntent, string> = {
  neutral: 'rgba(255,255,255,0.86)',
  positive: Brand.signal.success.mid,
  attention: Brand.colors.copper,
  critical: Brand.signal.danger.mid,
};

const INTENT_BG: Record<PageRescueIntent, string> = {
  neutral: 'rgba(255,255,255,0.05)',
  positive: 'rgba(63,168,137,0.14)',
  attention: 'rgba(235,98,26,0.14)',
  critical: 'rgba(181,58,43,0.16)',
};

function intentColor(intent: PageRescueIntent): string {
  return INTENT_COLOR[intent];
}

export function BuyerBriefPage({
  roleLabel,
  contextLabel,
  displayName,
  hero,
  supportingContent,
  ribbon,
  streamLabel,
  stream,
  topInset = 0,
  bottomInset = 0,
  onPrimaryAction,
  onStreamItemPress,
}: BuyerBriefPageProps) {
  const heroColor = intentColor(hero.intent);

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset + 18, paddingBottom: bottomInset + 112 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{roleLabel}</Text>
          <Text style={styles.context}>{contextLabel}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <View style={[styles.hero, { borderColor: `${heroColor}66` }]}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: INTENT_BG[hero.intent] },
              ]}
            >
              <Ionicons
                name={hero.icon ?? 'flag-outline'}
                size={18}
                color={heroColor}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroEyebrow, { color: heroColor }]}>
                {hero.eyebrow}
              </Text>
              <Text style={styles.heroTitle}>{hero.title}</Text>
            </View>
          </View>

          <Text style={[styles.heroValue, { color: heroColor }]}>
            {hero.value}
          </Text>
          <Text style={styles.heroSummary}>{hero.summary}</Text>

          {hero.primaryAction || hero.secondaryAction ? (
            <View style={styles.actionRow}>
              {hero.primaryAction ? (
                <HeroAction
                  action={hero.primaryAction}
                  color={heroColor}
                  intent={hero.intent}
                  onPress={onPrimaryAction}
                  icon="arrow-forward"
                />
              ) : null}
              {hero.secondaryAction ? (
                <HeroAction
                  action={hero.secondaryAction}
                  color="rgba(255,255,255,0.82)"
                  intent="neutral"
                  onPress={onPrimaryAction}
                  icon="person-add"
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {supportingContent ? (
          <View style={styles.supportingContent}>{supportingContent}</View>
        ) : null}

        <View style={styles.ribbon}>
          {ribbon.map((item, index) => {
            const color = intentColor(item.intent);
            return (
              <View
                key={`${item.label}-${index}`}
                style={[styles.ribbonCell, index < ribbon.length - 1 && styles.ribbonRule]}
              >
                <Text style={styles.ribbonLabel}>{item.label}</Text>
                <Text style={[styles.ribbonValue, { color }]} numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionRule}>
          <View style={styles.line} />
          <Text style={styles.sectionLabel}>{streamLabel}</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.stream}>
          {stream.map((item) => (
            <StreamRow
              key={item.id}
              item={item}
              onPress={onStreamItemPress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function HeroAction({
  action,
  color,
  intent,
  icon,
  onPress,
}: {
  action: NonNullable<BuyerBriefPageProps['hero']['primaryAction']>;
  color: string;
  intent: PageRescueIntent;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: (targetRoute?: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryAction,
        { borderColor: `${color}66` },
        pressed && { backgroundColor: INTENT_BG[intent] },
      ]}
      onPress={() => onPress?.(action.targetRoute)}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel ?? action.label}
    >
      <Text style={[styles.primaryActionText, { color }]}>
        {action.label}
      </Text>
      <Ionicons name={icon} size={14} color={color} />
    </Pressable>
  );
}

function StreamRow({
  item,
  onPress,
}: {
  item: BuyerBriefStreamItem;
  onPress?: (item: BuyerBriefStreamItem) => void;
}) {
  const color = intentColor(item.intent);
  const content = (
    <>
      <View
        style={[
          styles.streamIcon,
          { borderColor: color, backgroundColor: INTENT_BG[item.intent] },
        ]}
      >
        <Ionicons name={item.icon ?? 'ellipse'} size={13} color={color} />
      </View>
      <View style={styles.streamBody}>
        <Text style={styles.streamTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.streamSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
      <Text style={styles.streamTime}>{item.timestamp}</Text>
    </>
  );

  if (item.targetRoute && onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.streamRow,
          pressed && { opacity: 0.84 },
        ]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.subtitle}, ${item.timestamp}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={styles.streamRow}
      accessibilityRole="text"
      accessibilityLabel={`${item.title}, ${item.subtitle}, ${item.timestamp}`}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    gap: 5,
    marginBottom: 18,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontFamily: Brand.fonts.caption,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  context: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    fontFamily: Brand.fonts.body,
  },
  name: {
    color: '#F3F0EA',
    fontSize: 38,
    lineHeight: 42,
    fontFamily: Brand.fonts.display,
    fontWeight: '900',
  },
  hero: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 16,
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '800',
  },
  heroValue: {
    fontSize: 42,
    lineHeight: 46,
    fontFamily: Brand.fonts.display,
    fontWeight: '900',
  },
  heroSummary: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  supportingContent: {
    gap: 8,
    marginTop: 10,
  },
  primaryAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  ribbon: {
    flexDirection: 'row',
    paddingVertical: 18,
  },
  ribbonCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  ribbonRule: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.11)',
  },
  ribbonLabel: {
    color: 'rgba(255,255,255,0.44)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  ribbonValue: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  sectionRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  stream: {
    gap: 4,
  },
  streamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
  },
  streamIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  streamBody: {
    flex: 1,
    gap: 3,
  },
  streamTitle: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 15,
    fontWeight: '800',
  },
  streamSubtitle: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  streamTime: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingTop: 2,
  },
});
