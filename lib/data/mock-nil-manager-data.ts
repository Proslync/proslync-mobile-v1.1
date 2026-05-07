// Mock data for the NIL Manager role — typically a school athletics-department
// staffer. View-only access to athlete NIL info, gated by per-athlete consent.

export type ConsentLevel = 'full' | 'summary' | 'withheld';

export type ComplianceFlagSeverity = 'info' | 'warn' | 'critical';

export type ComplianceFlag = {
  id: string;
  severity: ComplianceFlagSeverity;
  title: string;
  detail: string;
  dueIn?: string; // 'in 3 days' for upcoming commitments
};

export type NilDealCompact = {
  id: string;
  brand: string;
  brandColor: string;
  brandInitial: string;
  category: string;
  stage: 'open' | 'applied' | 'reviewing' | 'negotiating' | 'committed' | 'live';
  value: string; // '$8,500'
  startDate: string;
  endDate: string;
  exclusivity: string;
  contractStatus: 'pending' | 'signed' | 'expired';
  brandContact: { name: string; role: string; email: string; phone?: string };
  ncaaReview: { status: 'cleared' | 'review' | 'flagged'; note: string };
  schoolReview: { status: 'cleared' | 'review' | 'flagged'; note: string };
  ethicsReview: { status: 'cleared' | 'review' | 'flagged'; note: string };
};

export type NilManagerAthlete = {
  id: string;
  name: string;
  initials: string;
  color: string;
  sport: string;
  classYear: string;
  position?: string;
  // Top-level summary
  brandDeals: number;
  totalDealValue: string;
  totalDealValueRaw: number; // for sorting
  ytdEarnings: string;
  // Per-athlete consent — controls what the NIL manager can drill into
  consentLevel: ConsentLevel;
  consentNote?: string;
  // Compliance signals (always visible at summary level)
  complianceFlags: ComplianceFlag[];
  // Detailed deal list (only used when consentLevel === 'full')
  deals: NilDealCompact[];
};

export const NIL_MANAGER_PROFILE = {
  firstName: 'Lauren',
  lastName: 'Whitcombe',
  title: 'NIL Compliance Manager',
  school: 'Duke Athletics',
  schoolColor: '#001A57',
  schoolAccent: '#FFFFFF',
  // High-level KPIs across the entire roster
  rosterSize: 18,
  totalActiveDeals: 41,
  totalRosterValueYtd: '$1.84M',
  openComplianceItems: 5,
};

export const NIL_MANAGER_ATHLETES: NilManagerAthlete[] = [
  {
    id: 'na-1',
    name: 'Cooper Flagg',
    initials: 'CF',
    color: '#001A57',
    sport: 'Basketball',
    classYear: 'Freshman',
    position: 'F',
    brandDeals: 6,
    totalDealValue: '$487k',
    totalDealValueRaw: 487000,
    ytdEarnings: '$312k',
    consentLevel: 'full',
    complianceFlags: [
      {
        id: 'cf-1', severity: 'warn',
        title: 'Brand appearance commitment in 3 days',
        detail: 'Gatorade in-store appearance · Durham, NC · May 8, 4–6pm',
        dueIn: 'in 3 days',
      },
      {
        id: 'cf-2', severity: 'info',
        title: 'New deal pending NCAA review',
        detail: 'Fanatics autograph deal submitted Apr 28 · awaiting determination',
      },
    ],
    deals: [
      {
        id: 'nd-1', brand: 'Gatorade', brandColor: '#FF6900', brandInitial: 'G',
        category: 'Hydration', stage: 'live', value: '$185k',
        startDate: '2025-09-01', endDate: '2026-08-31',
        exclusivity: 'Category exclusive — sports drinks',
        contractStatus: 'signed',
        brandContact: { name: 'Brian Ortega', role: 'Sr. Athlete Marketing Manager', email: 'bortega@gatorade.com', phone: '(312) 555-0188' },
        ncaaReview: { status: 'cleared', note: 'No GIA conflicts; reviewed Sep 12, 2025.' },
        schoolReview: { status: 'cleared', note: 'Compliant with Duke disclosure rules.' },
        ethicsReview: { status: 'cleared', note: 'Brand category permitted; no public-figure conflicts detected.' },
      },
      {
        id: 'nd-2', brand: 'Fanatics', brandColor: '#000000', brandInitial: 'F',
        category: 'Memorabilia', stage: 'reviewing', value: '$120k',
        startDate: '2025-11-01', endDate: '2027-10-31',
        exclusivity: 'Non-exclusive within memorabilia',
        contractStatus: 'pending',
        brandContact: { name: 'Daria Klein', role: 'Director, Athlete Programs', email: 'dklein@fanatics.com' },
        ncaaReview: { status: 'review', note: 'Pending NCAA determination on autograph royalty structure.' },
        schoolReview: { status: 'cleared', note: 'No school-mark conflict.' },
        ethicsReview: { status: 'cleared', note: 'No conflicts of interest identified.' },
      },
      {
        id: 'nd-3', brand: 'Beats by Dre', brandColor: '#E63946', brandInitial: 'B',
        category: 'Tech / Audio', stage: 'live', value: '$95k',
        startDate: '2025-10-15', endDate: '2026-04-15',
        exclusivity: 'Audio-tech exclusive',
        contractStatus: 'signed',
        brandContact: { name: 'Marcus Reid', role: 'Talent Lead', email: 'mreid@apple.com' },
        ncaaReview: { status: 'cleared', note: 'Compliant.' },
        schoolReview: { status: 'cleared', note: 'Disclosed Oct 2025.' },
        ethicsReview: { status: 'cleared', note: 'Standard product partnership.' },
      },
      {
        id: 'nd-4', brand: 'Champion', brandColor: '#C8102E', brandInitial: 'C',
        category: 'Apparel', stage: 'live', value: '$42k',
        startDate: '2025-08-20', endDate: '2026-06-30',
        exclusivity: 'Non-exclusive (apparel)',
        contractStatus: 'signed',
        brandContact: { name: 'Sienna Park', role: 'Brand Manager', email: 'spark@champion.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'cleared', note: 'No school-mark issues.' },
        ethicsReview: { status: 'cleared', note: 'Compliant.' },
      },
      {
        id: 'nd-5', brand: 'Bojangles', brandColor: '#E03A3E', brandInitial: 'B',
        category: 'QSR', stage: 'live', value: '$28k',
        startDate: '2025-09-10', endDate: '2026-05-30',
        exclusivity: 'Regional QSR exclusive (NC + SC)',
        contractStatus: 'signed',
        brandContact: { name: 'Ron Atwell', role: 'Marketing Coordinator', email: 'ratwell@bojangles.com' },
        ncaaReview: { status: 'cleared', note: 'Local promotional partnership.' },
        schoolReview: { status: 'cleared', note: 'Compliant.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
      {
        id: 'nd-6', brand: 'EA Sports', brandColor: '#000000', brandInitial: 'E',
        category: 'Gaming', stage: 'committed', value: '$17k',
        startDate: '2026-07-01', endDate: '2027-07-01',
        exclusivity: 'Gaming licensing only',
        contractStatus: 'pending',
        brandContact: { name: 'Sam Reyes', role: 'Athlete Licensing', email: 'sreyes@ea.com' },
        ncaaReview: { status: 'cleared', note: 'CFB 26 inclusion authorized.' },
        schoolReview: { status: 'cleared', note: 'Standard EA agreement.' },
        ethicsReview: { status: 'cleared', note: 'Pre-approved program.' },
      },
    ],
  },
  {
    id: 'na-2',
    name: 'Kon Knueppel',
    initials: 'KK',
    color: '#001A57',
    sport: 'Basketball',
    classYear: 'Freshman',
    position: 'G',
    brandDeals: 4,
    totalDealValue: '$184k',
    totalDealValueRaw: 184000,
    ytdEarnings: '$96k',
    consentLevel: 'full',
    complianceFlags: [
      {
        id: 'cf-3', severity: 'critical',
        title: 'Disclosure form overdue',
        detail: 'Bose audio deal — disclosure was due Apr 25; not yet filed.',
        dueIn: '8 days late',
      },
    ],
    deals: [
      {
        id: 'nd-7', brand: 'Bose', brandColor: '#000000', brandInitial: 'B',
        category: 'Tech / Audio', stage: 'live', value: '$78k',
        startDate: '2025-10-01', endDate: '2026-09-30',
        exclusivity: 'Audio-tech exclusive',
        contractStatus: 'signed',
        brandContact: { name: 'Tom Welk', role: 'Sponsorship Lead', email: 'twelk@bose.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'flagged', note: 'Disclosure form not received.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
      {
        id: 'nd-8', brand: 'Outback Steakhouse', brandColor: '#7A1E1E', brandInitial: 'O',
        category: 'QSR', stage: 'live', value: '$54k',
        startDate: '2025-11-01', endDate: '2026-06-30',
        exclusivity: 'Non-exclusive (food)',
        contractStatus: 'signed',
        brandContact: { name: 'Jess Carmichael', role: 'Local Marketing', email: 'jcarmichael@outback.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'cleared', note: 'Compliant.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
      {
        id: 'nd-9', brand: 'Athletic Brewing', brandColor: '#0F3057', brandInitial: 'A',
        category: 'Beverage (NA)', stage: 'live', value: '$32k',
        startDate: '2025-09-15', endDate: '2026-08-15',
        exclusivity: 'Non-alcoholic beverage exclusive',
        contractStatus: 'signed',
        brandContact: { name: 'Maya Stillwell', role: 'CMO', email: 'mstillwell@athleticbrewing.com' },
        ncaaReview: { status: 'cleared', note: 'NA confirmed.' },
        schoolReview: { status: 'cleared', note: 'Allowed under non-alcoholic exception.' },
        ethicsReview: { status: 'cleared', note: 'Compliant.' },
      },
      {
        id: 'nd-10', brand: 'Klutch Sports', brandColor: '#FFD60A', brandInitial: 'K',
        category: 'Apparel', stage: 'committed', value: '$20k',
        startDate: '2026-07-01', endDate: '2027-07-01',
        exclusivity: 'Non-exclusive',
        contractStatus: 'pending',
        brandContact: { name: 'Petra Coelho', role: 'Director', email: 'pcoelho@klutchsports.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'review', note: 'Awaiting compliance officer review.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
    ],
  },
  {
    id: 'na-3',
    name: 'Sienna Reyes',
    initials: 'SR',
    color: '#000080',
    sport: 'Soccer',
    classYear: 'Sophomore',
    position: 'F',
    brandDeals: 3,
    totalDealValue: '$94k',
    totalDealValueRaw: 94000,
    ytdEarnings: '$58k',
    consentLevel: 'summary',
    consentNote: 'Athlete has shared summary metrics only. Tap to request full access.',
    complianceFlags: [
      {
        id: 'cf-4', severity: 'info',
        title: 'New deal added · pending category review',
        detail: 'Brand details visible only with athlete consent.',
      },
    ],
    deals: [],
  },
  {
    id: 'na-4',
    name: 'Daniel Owusu',
    initials: 'DO',
    color: '#001A57',
    sport: 'Football',
    classYear: 'Junior',
    position: 'WR',
    brandDeals: 5,
    totalDealValue: '$246k',
    totalDealValueRaw: 246000,
    ytdEarnings: '$148k',
    consentLevel: 'full',
    complianceFlags: [
      {
        id: 'cf-5', severity: 'warn',
        title: 'Brand commitment next week',
        detail: 'Nike content shoot · Beaverton, OR · May 13–14',
        dueIn: 'in 7 days',
      },
    ],
    deals: [
      {
        id: 'nd-11', brand: 'Nike', brandColor: '#111111', brandInitial: 'N',
        category: 'Apparel / Footwear', stage: 'live', value: '$140k',
        startDate: '2025-08-01', endDate: '2026-07-31',
        exclusivity: 'Footwear exclusive',
        contractStatus: 'signed',
        brandContact: { name: 'Daria Klein', role: 'Athlete Marketing', email: 'dklein@nike.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'cleared', note: 'Compliant.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
      {
        id: 'nd-12', brand: 'Liquid IV', brandColor: '#FFD60A', brandInitial: 'L',
        category: 'Hydration', stage: 'live', value: '$56k',
        startDate: '2025-09-10', endDate: '2026-09-10',
        exclusivity: 'Non-exclusive',
        contractStatus: 'signed',
        brandContact: { name: 'Joel Park', role: 'Athlete Programs', email: 'jpark@liquidiv.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'cleared', note: 'Compliant.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
      {
        id: 'nd-13', brand: 'Spotify', brandColor: '#1DB954', brandInitial: 'S',
        category: 'Music · Creator', stage: 'live', value: '$38k',
        startDate: '2025-11-01', endDate: '2026-06-30',
        exclusivity: 'Non-exclusive',
        contractStatus: 'signed',
        brandContact: { name: 'Linnea Howard', role: 'Creator Partnerships', email: 'lhoward@spotify.com' },
        ncaaReview: { status: 'cleared', note: 'Cleared.' },
        schoolReview: { status: 'cleared', note: 'Compliant.' },
        ethicsReview: { status: 'cleared', note: 'No issues.' },
      },
    ],
  },
  {
    id: 'na-5',
    name: 'Maya Chen',
    initials: 'MC',
    color: '#9B5CFF',
    sport: 'Volleyball',
    classYear: 'Senior',
    brandDeals: 2,
    totalDealValue: '—',
    totalDealValueRaw: 0,
    ytdEarnings: '—',
    consentLevel: 'withheld',
    consentNote: 'Athlete has not shared NIL data with the school. Aggregate counts only.',
    complianceFlags: [],
    deals: [],
  },
];
