// ── GUIDED FLOW PAGE ─────────────────────────────────────
// Direction C used sparingly: only for AD-walk review flows where the
// user moves disclosure -> evidence -> compliance -> approval -> audit.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import type { GuidedFlowStep } from '@/lib/types/page-rescue.types';

import type { GuidedFlowPageProps } from './types';

const STEP_COLOR: Record<GuidedFlowStep['status'], string> = {
  pending: 'rgba(255,255,255,0.38)',
  active: Brand.colors.copper,
  complete: Brand.signal.success.mid,
  blocked: Brand.signal.danger.mid,
};

const STEP_ICON: Record<GuidedFlowStep['status'], React.ComponentProps<typeof Ionicons>['name']> = {
  pending: 'ellipse-outline',
  active: 'radio-button-on',
  complete: 'checkmark-circle',
  blocked: 'alert-circle',
};

export function GuidedFlowPage({
  eyebrow,
  title,
  summary,
  activeLabel,
  activeValue,
  activeSummary,
  steps,
  evidenceTitle,
  evidenceBody,
  primaryActionLabel,
  onPrimaryAction,
  children,
}: GuidedFlowPageProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      <View style={styles.activeCard}>
        <Text style={styles.activeLabel}>{activeLabel}</Text>
        <Text style={styles.activeValue}>{activeValue}</Text>
        <Text style={styles.activeSummary}>{activeSummary}</Text>
        {primaryActionLabel && onPrimaryAction ? (
          <Pressable
            style={styles.primaryAction}
            onPress={onPrimaryAction}
            accessibilityRole="button"
            accessibilityLabel={primaryActionLabel}
          >
            <Text style={styles.primaryActionText}>{primaryActionLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={Brand.colors.copper} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stepRail}>
        {steps.map((step, index) => {
          const color = STEP_COLOR[step.status];
          return (
            <View key={step.id} style={styles.step}>
              <View style={[styles.stepIcon, { borderColor: color }]}>
                <Ionicons name={STEP_ICON[step.status]} size={13} color={color} />
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepLabel, { color }]}>{step.label}</Text>
                <Text style={styles.stepSummary}>{step.summary}</Text>
              </View>
              {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.evidenceCard}>
        <Text style={styles.evidenceTitle}>{evidenceTitle}</Text>
        <Text style={styles.evidenceBody}>{evidenceBody}</Text>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  headerBlock: {
    gap: 5,
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: Brand.colors.copper,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  summary: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  activeCard: {
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.42)',
    borderRadius: 16,
    backgroundColor: 'rgba(235,98,26,0.10)',
    padding: 15,
  },
  activeLabel: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  activeValue: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  activeSummary: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  primaryAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryActionText: {
    color: Brand.colors.copper,
    fontSize: 12,
    fontWeight: '900',
  },
  stepRail: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 12,
    gap: 10,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
    position: 'relative',
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  stepBody: {
    flex: 1,
    gap: 2,
    paddingBottom: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepSummary: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    bottom: -8,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  evidenceCard: {
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 13,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  evidenceTitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '900',
  },
  evidenceBody: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
});
