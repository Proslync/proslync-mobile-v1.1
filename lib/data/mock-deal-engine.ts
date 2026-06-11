// lib/data/mock-deal-engine.ts
// Fixtures for the NIL Deal Engine — Phase D1.
//
// Provides:
//   CONTRACT_TEMPLATES — 5 templates (one per ContractKind)
//   DEMO_DEAL          — one in-flight deal for the Kiyan Anthony persona
//
// Demo deal narrative:
//   status: active (signed + escrow funded)
//   Milestone 1: approved + paid (IG Campaign post)
//   Milestone 2: submitted ~50h ago → auto-approve countdown live
//   Milestone 3: pending
//
// All time-relative ISO strings are computed at module load so the
// fixture never expires.

import type {
  ContractTemplate,
  EngineDeal,
  EngineMilestone,
  DealEvent,
} from '@/lib/types/deal-engine.types';
import { milestoneAutoApproveAt } from '@/lib/deal-engine/engine.mjs';

// ── Reference timestamps ──────────────────────────────────────────────────

const NOW = new Date();

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 3600e3).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 3600e3).toISOString();
}

function daysFromNow(n: number): string {
  return new Date(NOW.getTime() + n * 24 * 3600e3).toISOString();
}

// Milestone 2 was submitted 50 hours ago → ~22h remain until auto-approve
const M2_SUBMITTED = hoursAgo(50);
const M2_AUTO_APPROVE = milestoneAutoApproveAt(M2_SUBMITTED);

// ── Contract templates ────────────────────────────────────────────────────

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tpl-endorsement-v1',
    kind: 'endorsement',
    version: '1.0',
    title: 'Endorsement Deal',
    description:
      'Multi-deliverable brand ambassador agreement. Suitable for ongoing partnerships with exclusivity options.',
    requiredFields: [
      { key: 'dealValue', label: 'Deal Value ($)', type: 'number', placeholder: '5000' },
      { key: 'deliverableDescription', label: 'Deliverable Description', type: 'text', placeholder: 'Describe what you will provide' },
      {
        key: 'paymentSchedule',
        label: 'Payment Schedule',
        type: 'select',
        options: ['single', 'installments', 'milestone'],
      },
      {
        key: 'exclusivity',
        label: 'Exclusivity',
        type: 'select',
        options: ['None', 'Category', 'Full'],
      },
      { key: 'termStart', label: 'Term Start Date', type: 'date' },
      { key: 'termEnd', label: 'Term End Date', type: 'date' },
    ],
    plainSummary:
      '{{athleteName}} agrees to endorse {{brandName}} under this Endorsement Deal (ID: {{dealId}}). ' +
      'The deal period runs from {{termStart}} to {{termEnd}}. ' +
      'The agreed compensation is ${{amountDollars}}, which {{athleteName}} receives in full (100%). ' +
      '{{brandName}} additionally pays a ${{brandFee}} platform fee, for a total payment of ${{brandTotal}}. ' +
      'Deliverable: {{deliverableDescription}}. ' +
      'Exclusivity: {{exclusivity}}. ' +
      'Payments are structured as: {{paymentSchedule}}. ' +
      'This agreement is governed by applicable NIL regulations and must be disclosed to your institution within 5 business days of signing.',
  },
  {
    id: 'tpl-social-post-v1',
    kind: 'social-post',
    version: '1.0',
    title: 'Social Post Deal',
    description:
      'Content creation agreement for sponsored posts, stories, and reels across social platforms.',
    requiredFields: [
      { key: 'dealValue', label: 'Deal Value ($)', type: 'number', placeholder: '500' },
      { key: 'deliverableDescription', label: 'Post Description', type: 'text', placeholder: 'e.g. 1x IG post + 3x Stories featuring product' },
      {
        key: 'paymentSchedule',
        label: 'Payment Schedule',
        type: 'select',
        options: ['single', 'milestone'],
      },
      {
        key: 'exclusivity',
        label: 'Exclusivity',
        type: 'select',
        options: ['None', 'Category'],
      },
      { key: 'termStart', label: 'Post Date (Start)', type: 'date' },
      { key: 'termEnd', label: 'Post Live Until', type: 'date' },
    ],
    plainSummary:
      '{{athleteName}} will create and publish sponsored content for {{brandName}} (Deal ID: {{dealId}}). ' +
      'Content must be live from {{termStart}} to {{termEnd}}. ' +
      'Compensation: ${{amountDollars}} paid in full to {{athleteName}}. ' +
      '{{brandName}} pays ${{brandFee}} platform fee (total ${{brandTotal}}). ' +
      'Content description: {{deliverableDescription}}. ' +
      'Posts must include required disclosures (#ad or #sponsored) per FTC guidelines.',
  },
  {
    id: 'tpl-appearance-v1',
    kind: 'appearance',
    version: '1.0',
    title: 'Appearance Deal',
    description:
      'Personal appearance agreement for events, signings, activations, and brand experiences.',
    requiredFields: [
      { key: 'dealValue', label: 'Appearance Fee ($)', type: 'number', placeholder: '2000' },
      { key: 'deliverableDescription', label: 'Event Details', type: 'text', placeholder: 'Event name, location, date, duration' },
      {
        key: 'paymentSchedule',
        label: 'Payment Schedule',
        type: 'select',
        options: ['single', 'installments'],
      },
      {
        key: 'exclusivity',
        label: 'Exclusivity',
        type: 'select',
        options: ['None', 'Day-of Event'],
      },
      { key: 'termStart', label: 'Appearance Date', type: 'date' },
      { key: 'termEnd', label: 'Agreement Expires', type: 'date' },
    ],
    plainSummary:
      '{{athleteName}} agrees to make a personal appearance for {{brandName}} (Deal ID: {{dealId}}). ' +
      'Appearance details: {{deliverableDescription}}. ' +
      'Agreement period: {{termStart}} to {{termEnd}}. ' +
      'Appearance fee: ${{amountDollars}} ({{athleteName}} keeps 100%). ' +
      '{{brandName}} pays a ${{brandFee}} platform fee on top, for a total of ${{brandTotal}}.',
  },
  {
    id: 'tpl-autograph-v1',
    kind: 'autograph',
    version: '1.0',
    title: 'Autograph / Memorabilia Deal',
    description:
      'Signing session or memorabilia agreement for cards, merchandise, or collectibles.',
    requiredFields: [
      { key: 'dealValue', label: 'Signing Fee ($)', type: 'number', placeholder: '300' },
      { key: 'deliverableDescription', label: 'Items to Sign', type: 'text', placeholder: 'e.g. 50x trading cards, 10x jerseys' },
      {
        key: 'paymentSchedule',
        label: 'Payment Schedule',
        type: 'select',
        options: ['single'],
      },
      {
        key: 'exclusivity',
        label: 'Exclusivity',
        type: 'select',
        options: ['None', 'Category'],
      },
      { key: 'termStart', label: 'Session Date', type: 'date' },
      { key: 'termEnd', label: 'Agreement Expires', type: 'date' },
    ],
    plainSummary:
      '{{athleteName}} agrees to sign memorabilia for {{brandName}} (Deal ID: {{dealId}}). ' +
      'Items: {{deliverableDescription}}. ' +
      'Signing fee: ${{amountDollars}} — {{athleteName}} receives 100%. ' +
      '{{brandName}} pays ${{brandFee}} platform fee, totalling ${{brandTotal}}. ' +
      'Session date: {{termStart}}.',
  },
  {
    id: 'tpl-licensing-v1',
    kind: 'licensing',
    version: '1.0',
    title: 'Licensing / NIL Rights Deal',
    description:
      'License of name, image, and likeness rights for use in marketing, products, or media.',
    requiredFields: [
      { key: 'dealValue', label: 'License Fee ($)', type: 'number', placeholder: '10000' },
      { key: 'deliverableDescription', label: 'Permitted Use', type: 'text', placeholder: 'Describe exactly how your NIL will be used' },
      {
        key: 'paymentSchedule',
        label: 'Payment Schedule',
        type: 'select',
        options: ['single', 'installments'],
      },
      {
        key: 'exclusivity',
        label: 'Exclusivity',
        type: 'select',
        options: ['None', 'Category', 'Full'],
      },
      { key: 'termStart', label: 'License Start', type: 'date' },
      { key: 'termEnd', label: 'License End', type: 'date' },
    ],
    plainSummary:
      '{{athleteName}} grants {{brandName}} a license to use their name, image, and likeness (Deal ID: {{dealId}}) ' +
      'for the following purpose: {{deliverableDescription}}. ' +
      'License term: {{termStart}} to {{termEnd}}. ' +
      'License fee: ${{amountDollars}} paid in full to {{athleteName}}. ' +
      '{{brandName}} pays an additional ${{brandFee}} platform fee (total ${{brandTotal}}). ' +
      'Exclusivity: {{exclusivity}}. ' +
      'Any sublicensing or use beyond the permitted scope requires written consent.',
  },
];

// ── Demo deal fixture — in-flight Kiyan Anthony × JMA Wireless ───────────

const DEMO_MILESTONES: EngineMilestone[] = [
  {
    id: 'ms-1',
    description: 'IG Campaign post featuring JMA product with required #ad disclosure',
    dueISO: daysAgo(10),
    deliverableType: 'post',
    verificationMethod: 'platform',
    amountCents: 1_500_00,
    status: 'paid',
    submittedISO: daysAgo(12),
    approvedISO: daysAgo(10),
    paidISO: daysAgo(10),
  },
  {
    id: 'ms-2',
    description: 'IG Reel (60s) + Stories (3x) for Q3 product launch',
    dueISO: daysFromNow(1),
    deliverableType: 'video',
    verificationMethod: 'brand-confirm',
    amountCents: 1_500_00,
    status: 'submitted',
    submittedISO: M2_SUBMITTED,
    autoApproveAt: M2_AUTO_APPROVE,
  },
  {
    id: 'ms-3',
    description: 'Game-day campus activation appearance (JMA booth, 2h)',
    dueISO: daysFromNow(21),
    deliverableType: 'appearance',
    verificationMethod: 'brand-confirm',
    amountCents: 1_500_00,
    status: 'pending',
  },
];

const DEMO_EVENTS: DealEvent[] = [
  {
    at: daysAgo(20),
    actor: 'athlete',
    kind: 'created',
    note: 'Deal flow initiated by Kiyan Anthony',
  },
  {
    at: daysAgo(20),
    actor: 'athlete',
    kind: 'template-selected',
    note: 'Template: Endorsement Deal v1.0',
  },
  {
    at: daysAgo(20),
    actor: 'athlete',
    kind: 'fields-submitted',
    note: 'Fields completed: dealValue=$4500, schedule=milestone, exclusivity=Category',
  },
  {
    at: daysAgo(20),
    actor: 'athlete',
    kind: 'summary-acknowledged',
    note: 'Plain-language summary read and acknowledged',
  },
  {
    at: daysAgo(20),
    actor: 'athlete',
    kind: 'signed',
    note: 'Athlete signed: Kiyan Anthony. Typed name confirmed.',
    ip: '192.168.1.24',
  },
  {
    at: daysAgo(19),
    actor: 'brand',
    kind: 'brand-countersigned',
    note: 'JMA Wireless countersigned the deal.',
  },
  {
    at: daysAgo(18),
    actor: 'brand',
    kind: 'escrow-funded',
    note: 'Escrow funded: $4,500 (deal amount) + $450 platform fee = $4,950 total. Athlete receives $4,500.',
  },
  {
    at: daysAgo(12),
    actor: 'athlete',
    kind: 'milestone-submitted',
    note: 'Milestone 1 submitted: IG Campaign post. Verification: platform.',
    milestoneId: 'ms-1',
  },
  {
    at: daysAgo(10),
    actor: 'brand',
    kind: 'milestone-approved',
    note: 'Milestone 1 approved by JMA Wireless.',
    milestoneId: 'ms-1',
  },
  {
    at: daysAgo(10),
    actor: 'platform',
    kind: 'milestone-paid',
    note: 'Milestone 1 payout: $1,500.00 released to athlete. Brand paid $1,500 deal + $150 fee.',
    milestoneId: 'ms-1',
  },
  {
    at: M2_SUBMITTED,
    actor: 'athlete',
    kind: 'milestone-submitted',
    note: 'Milestone 2 submitted: IG Reel + Stories. Awaiting brand review or 72h auto-approve.',
    milestoneId: 'ms-2',
  },
];

export const DEMO_DEAL: EngineDeal = {
  dealId: 'PSY-2026-K1YAN001',
  templateId: 'tpl-endorsement-v1',
  templateVersion: '1.0',
  athlete: 'Kiyan Anthony',
  brand: 'JMA Wireless',
  amountCents: 4_500_00,
  feeRate: 0.10,
  termStart: daysAgo(20),
  termEnd: daysFromNow(60),
  deliverableDescription:
    '1x IG Campaign post + 1x IG Reel (60s) + 3x Stories for Q3 launch + 1x campus appearance',
  exclusivity: true,
  exclusivityScope: 'Category (telecom/wireless)',
  paymentSchedule: 'milestone',
  status: 'active',
  milestones: DEMO_MILESTONES,
  events: DEMO_EVENTS,
  escrow: {
    state: 'partially-released',
    fundedCents: 4_500_00,
    releasedCents: 1_500_00,
  },
  fieldValues: {
    dealValue: '4500',
    deliverableDescription:
      '1x IG Campaign post + 1x IG Reel (60s) + 3x Stories for Q3 launch + 1x campus appearance',
    paymentSchedule: 'milestone',
    exclusivity: 'Category',
  },
  athleteSignedAt: daysAgo(20),
  athleteSignedName: 'Kiyan Anthony',
  brandSignedAt: daysAgo(19),
  isDemo: true,
  createdAt: daysAgo(20),
  updatedAt: M2_SUBMITTED,
};

// ── Storage key ───────────────────────────────────────────────────────────

export const DEAL_ENGINE_STORAGE_KEY = 'proslync:deal-engine:deals:v1';
