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
  statusTier: 'VIP',
  memberSince: '2024-03-15',
  membershipCardId: 123, // Mock ID for testing
  isProfileComplete: true,
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
    subtitle: 'Welcome to VIP tier!',
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
    code: 'UBER10',
    title: '$10 off Uber rides',
    subtitle: 'Get home safe after events',
    eventId: 1,
    isClaimed: false,
    expiresAt: daysAgo(-7),
  },
  {
    id: 'offer-2',
    code: 'EARLYBIRD',
    title: 'Free entry before 11PM',
    subtitle: 'At partner venues this weekend',
    eventId: 2,
    isClaimed: false,
    expiresAt: daysAgo(-3),
  },
  {
    id: 'offer-3',
    code: 'COCKTAILS',
    title: '2-for-1 cocktails',
    subtitle: 'At The Velvet Room',
    eventId: 3,
    isClaimed: true,
  },
];

export const MOCK_WALLET_EVENTS: WalletEventCard[] = [
  {
    id: 'we-1',
    title: 'Neon Nights - Saturday Edition',
    dateTime: '2026-02-08T22:00:00',
    dateTimeLabel: 'Sat, Feb 8 • 10PM',
    venueName: 'Club Nebula',
    flyerUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Cameron_indoor.jpg',
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
    flyerUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Caitlin_Clark_Final_Four_2024.jpg',
    isEarningEnabled: true,
    perksLabel: '2-for-1 drinks',
  },
  {
    id: 'we-3',
    title: 'Rooftop Sessions',
    dateTime: '2026-02-09T16:00:00',
    dateTimeLabel: 'Sun, Feb 9 • 4PM',
    venueName: 'Sky Lounge',
    flyerUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Alabama_Crimson_Tide_2021_SEC_Champions.jpg',
    isEarningEnabled: true,
    isRecommended: true,
  },
  {
    id: 'we-4',
    title: 'Latin Heat',
    dateTime: '2026-02-06T21:00:00',
    dateTimeLabel: 'Thu, Feb 6 • 9PM',
    venueName: 'Havana Club',
    flyerUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Tennessee_Volunteers_at_Ohio_State_Buckeyes%2C_College_Football_Playoff_Round_1_game%28December_21%2C_2024%29.jpg',
    isEarningEnabled: false,
    perksLabel: 'Free entry',
  },
  {
    id: 'we-5',
    title: 'Techno Underground',
    dateTime: '2026-02-15T23:00:00',
    dateTimeLabel: 'Sat, Feb 15 • 11PM',
    venueName: 'The Basement',
    flyerUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/JAFCG_at_the_2024_College_Football_Playoff_National_Championship_Game%2C_January_7-8%2C_2024_%2853456843254%29.jpg',
    isEarningEnabled: true,
  },
];
