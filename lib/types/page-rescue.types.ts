import type Ionicons from '@expo/vector-icons/Ionicons';

export type PageRescueIntent = 'neutral' | 'positive' | 'attention' | 'critical';

export interface BuyerBriefAction {
  label: string;
  targetRoute?: string;
  accessibilityLabel?: string;
}

export interface BuyerBriefHero {
  eyebrow: string;
  title: string;
  value: string;
  summary: string;
  intent: PageRescueIntent;
  icon?: keyof typeof Ionicons.glyphMap;
  primaryAction?: BuyerBriefAction;
  secondaryAction?: BuyerBriefAction;
}

export interface BuyerBriefRibbonItem {
  label: string;
  value: string;
  intent: PageRescueIntent;
}

export interface BuyerBriefStreamItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  intent: PageRescueIntent;
  icon?: keyof typeof Ionicons.glyphMap;
  targetRoute?: string;
}

export interface GuidedFlowStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'blocked';
  route?: string;
  summary: string;
}

export interface PageRescueStatus {
  route: string;
  lane:
    | 'AD Walk Critical'
    | 'Pro Role Homes'
    | 'Role Work Pages'
    | 'Cleanup/Utility';
  layout: 'Buyer Brief' | 'Guided Flow' | 'Utility' | 'Parked';
  status: 'not-started' | 'in-progress' | 'verified' | 'blocked' | 'parked';
  checkpoint: string;
}
