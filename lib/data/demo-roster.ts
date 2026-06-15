// Demo roster — a diverse set of mock athletes and brands used across the
// home feed, awards, NIL deals, and fan feed to avoid "Kiyan everywhere."
// Kiyan is intentionally kept as one entry, not the only entry.

export type DemoAthlete = {
  id: string;
  name: string;
  sport: 'MBB' | 'WBB' | 'Football' | 'Gymnastics' | 'Volleyball' | 'Baseball';
  school: string;
  schoolShort: string;       // e.g. "Syracuse"
  schoolColor: string;       // primary school color
  number: string;            // jersey number
  initials: string;
  /** Copper-adjacent accent for pill/highlight use */
  accent: string;
};

export type DemoBrand = {
  id: string;
  name: string;
  displayName: string;
  color: string;
  category: 'national' | 'local';
};

export const DEMO_ATHLETES: DemoAthlete[] = [
  {
    id: 'kiyan-anthony',
    name: 'Kiyan Anthony',
    sport: 'MBB',
    school: 'Syracuse University',
    schoolShort: 'Syracuse',
    schoolColor: '#F76900',
    number: '7',
    initials: 'KA',
    accent: '#FF6F3C',
  },
  {
    id: 'cooper-flagg',
    name: 'Cooper Flagg',
    sport: 'MBB',
    school: 'Duke University',
    schoolShort: 'Duke',
    schoolColor: '#001A57',
    number: '2',
    initials: 'CF',
    accent: '#4A90D9',
  },
  {
    id: 'paige-bueckers',
    name: 'Paige Bueckers',
    sport: 'WBB',
    school: 'UConn',
    schoolShort: 'UConn',
    schoolColor: '#000E2F',
    number: '5',
    initials: 'PB',
    accent: '#3B82F6',
  },
  {
    id: 'travis-hunter',
    name: 'Travis Hunter',
    sport: 'Football',
    school: 'Colorado',
    schoolShort: 'Colorado',
    schoolColor: '#CFB87C',
    number: '12',
    initials: 'TH',
    accent: '#D4A843',
  },
  {
    id: 'simone-lee',
    name: 'Simone Lee',
    sport: 'Volleyball',
    school: 'Penn State',
    schoolShort: 'Penn St',
    schoolColor: '#041E42',
    number: '10',
    initials: 'SL',
    accent: '#5B8DD9',
  },
  {
    id: 'paul-skenes',
    name: 'Paul Skenes',
    sport: 'Baseball',
    school: 'LSU',
    schoolShort: 'LSU',
    schoolColor: '#461D7C',
    number: '20',
    initials: 'PS',
    accent: '#A855F7',
  },
  {
    id: 'suni-lee',
    name: 'Sunisa Lee',
    sport: 'Gymnastics',
    school: 'Auburn',
    schoolShort: 'Auburn',
    schoolColor: '#0C2340',
    number: '—',
    initials: 'SL',
    accent: '#F59E0B',
  },
  {
    id: 'bryce-james',
    name: 'Bryce James',
    sport: 'MBB',
    school: 'USC',
    schoolShort: 'USC',
    schoolColor: '#990000',
    number: '1',
    initials: 'BJ',
    accent: '#EF4444',
  },
];

export const DEMO_BRANDS: DemoBrand[] = [
  {
    id: 'nike',
    name: 'Nike',
    displayName: 'NIKE',
    color: '#000000',
    category: 'national',
  },
  {
    id: 'gatorade',
    name: 'Gatorade',
    displayName: 'GATORADE',
    color: '#FF6900',
    category: 'national',
  },
  {
    id: 'beats',
    name: 'Beats by Dre',
    displayName: 'BEATS',
    color: '#C8102E',
    category: 'national',
  },
  {
    id: 'carmax',
    name: 'CarMax Syracuse',
    displayName: 'CARMAX',
    color: '#003087',
    category: 'local',
  },
  {
    id: 'zaxbys',
    name: "Zaxby's Southeast",
    displayName: "ZAXBY'S",
    color: '#E8451B',
    category: 'local',
  },
];

/** Quick lookup: athlete by id */
export function getAthlete(id: string): DemoAthlete | undefined {
  return DEMO_ATHLETES.find((a) => a.id === id);
}

/** Quick lookup: brand by id */
export function getBrand(id: string): DemoBrand | undefined {
  return DEMO_BRANDS.find((b) => b.id === id);
}
