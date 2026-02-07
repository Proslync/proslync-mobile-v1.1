// Mock data for Wallet feature

import {
  WalletUser,
  WalletBalances,
  PayoutMethod,
  WalletTransaction,
  Offer,
  WalletEventCard,
} from '../types/wallet.types';

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

export const MOCK_WALLET_USER: WalletUser = {
  id: 'user-1',
  name: 'Alex Rivera',
  statusTier: 'Insider',
  memberSince: '2024-03-15',
  membershipCardId: 123, // Mock ID for testing
};

export const MOCK_BALANCES: WalletBalances = {
  availableCents: 12450,
  pendingCents: 3500,
  lifetimeCents: 48750,
  minimumCashOutCents: 1000,
};

export const MOCK_PAYOUT_METHODS: PayoutMethod[] = [
  {
    id: 'pm-1',
    type: 'bank',
    label: 'Chase Checking',
    last4: '4892',
    isDefault: true,
  },
  {
    id: 'pm-2',
    type: 'debit',
    label: 'Visa Debit',
    last4: '1234',
    isDefault: false,
  },
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'earned',
    title: 'Check-in reward',
    subtitle: 'Neon Nights @ Club Nebula',
    amountCents: 500,
    status: 'completed',
    createdAt: hoursAgo(2),
    eventId: 'event-1',
  },
  {
    id: 'tx-2',
    type: 'pending',
    title: 'Pending check-in',
    subtitle: 'Deep House Fridays',
    amountCents: 750,
    status: 'pending',
    createdAt: hoursAgo(8),
    eventId: 'event-2',
  },
  {
    id: 'tx-3',
    type: 'earned',
    title: 'Referral bonus',
    subtitle: 'Sarah joined via your link',
    amountCents: 1000,
    status: 'completed',
    createdAt: daysAgo(1),
  },
  {
    id: 'tx-4',
    type: 'withdrawal',
    title: 'Withdrawal to Chase ••4892',
    amountCents: -5000,
    status: 'completed',
    createdAt: daysAgo(3),
  },
  {
    id: 'tx-5',
    type: 'earned',
    title: 'Table booking bonus',
    subtitle: 'VIP Table @ Velvet Room',
    amountCents: 2500,
    status: 'completed',
    createdAt: daysAgo(5),
    eventId: 'event-3',
  },
  {
    id: 'tx-6',
    type: 'adjustment',
    title: 'Tier upgrade bonus',
    subtitle: 'Welcome to Insider tier!',
    amountCents: 1500,
    status: 'completed',
    createdAt: daysAgo(7),
  },
  {
    id: 'tx-7',
    type: 'earned',
    title: 'Check-in reward',
    subtitle: 'Rooftop Sessions',
    amountCents: 500,
    status: 'completed',
    createdAt: daysAgo(10),
    eventId: 'event-4',
  },
  {
    id: 'tx-8',
    type: 'withdrawal',
    title: 'Withdrawal to Visa ••1234',
    amountCents: -2500,
    status: 'completed',
    createdAt: daysAgo(14),
  },
  {
    id: 'tx-9',
    type: 'pending',
    title: 'Pending referral',
    subtitle: 'Mike is verifying account',
    amountCents: 1000,
    status: 'pending',
    createdAt: daysAgo(1),
  },
];

export const MOCK_OFFERS: Offer[] = [
  {
    id: 'offer-1',
    title: '$10 off Uber rides',
    subtitle: 'Get home safe after events',
    eligibility: 'Insider+',
    isClaimed: false,
    expiresAt: daysAgo(-7), // 7 days from now
  },
  {
    id: 'offer-2',
    title: 'Free entry before 11PM',
    subtitle: 'At partner venues this weekend',
    eligibility: 'Any member',
    isClaimed: false,
    expiresAt: daysAgo(-3),
  },
  {
    id: 'offer-3',
    title: '2-for-1 cocktails',
    subtitle: 'At The Velvet Room',
    eligibility: 'Preferred+',
    isClaimed: true,
  },
  {
    id: 'offer-4',
    title: 'VIP upgrade',
    subtitle: 'Complimentary for your next booking',
    eligibility: 'A-List+',
    isClaimed: false,
  },
  {
    id: 'offer-5',
    title: '20% off merch',
    subtitle: 'Status branded gear',
    eligibility: 'Any member',
    isClaimed: false,
  },
  {
    id: 'offer-6',
    title: 'Skip the line',
    subtitle: 'Priority entry all weekend',
    eligibility: 'Insider+',
    isClaimed: false,
  },
];

export const MOCK_WALLET_EVENTS: WalletEventCard[] = [
  {
    id: 'we-1',
    title: 'Neon Nights - Saturday Edition',
    dateTime: '2026-02-08T22:00:00',
    dateTimeLabel: 'Sat, Feb 8 • 10PM',
    venueName: 'Club Nebula',
    flyerUrl: 'https://picsum.photos/seed/wallet-event1/400/600',
    isEarningEnabled: true,
    perksLabel: 'Line skip included',
    isRecommended: true,
  },
  {
    id: 'we-2',
    title: 'Deep House Fridays',
    dateTime: '2026-02-07T23:00:00',
    dateTimeLabel: 'Fri, Feb 7 • 11PM',
    venueName: 'The Velvet Room',
    flyerUrl: 'https://picsum.photos/seed/wallet-event2/400/600',
    isEarningEnabled: true,
    perksLabel: '2-for-1 drinks',
  },
  {
    id: 'we-3',
    title: 'Rooftop Sessions',
    dateTime: '2026-02-09T16:00:00',
    dateTimeLabel: 'Sun, Feb 9 • 4PM',
    venueName: 'Sky Lounge',
    flyerUrl: 'https://picsum.photos/seed/wallet-event3/400/600',
    isEarningEnabled: true,
    isRecommended: true,
  },
  {
    id: 'we-4',
    title: 'Latin Heat',
    dateTime: '2026-02-06T21:00:00',
    dateTimeLabel: 'Thu, Feb 6 • 9PM',
    venueName: 'Havana Club',
    flyerUrl: 'https://picsum.photos/seed/wallet-event4/400/600',
    isEarningEnabled: false,
    perksLabel: 'Free entry',
  },
  {
    id: 'we-5',
    title: 'Techno Underground',
    dateTime: '2026-02-15T23:00:00',
    dateTimeLabel: 'Sat, Feb 15 • 11PM',
    venueName: 'The Basement',
    flyerUrl: 'https://picsum.photos/seed/wallet-event5/400/600',
    isEarningEnabled: true,
  },
];
