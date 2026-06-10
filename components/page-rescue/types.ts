import type * as React from 'react';

import type {
  BuyerBriefHero,
  BuyerBriefRibbonItem,
  BuyerBriefStreamItem,
  GuidedFlowStep,
} from '@/lib/types/page-rescue.types';

export interface BuyerBriefPageProps {
  roleLabel: string;
  contextLabel: string;
  displayName: string;
  hero: BuyerBriefHero;
  supportingContent?: React.ReactNode;
  ribbon: BuyerBriefRibbonItem[];
  streamLabel: string;
  stream: BuyerBriefStreamItem[];
  topInset?: number;
  bottomInset?: number;
  onPrimaryAction?: (targetRoute?: string) => void;
  onStreamItemPress?: (item: BuyerBriefStreamItem) => void;
}

export interface GuidedFlowPageProps {
  eyebrow: string;
  title: string;
  summary: string;
  activeLabel: string;
  activeValue: string;
  activeSummary: string;
  steps: GuidedFlowStep[];
  evidenceTitle: string;
  evidenceBody: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  children?: React.ReactNode;
}
