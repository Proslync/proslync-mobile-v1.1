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
  /** Bridge into the social-reach fixture map (`a-*` keys in
   *  lib/data/mock-social-reach.ts). Omitted when no reach fixture exists —
   *  the UI then renders a "reach syncing" line rather than empty "—" stats. */
  reachId?: string;
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
    reachId: 'a-1',
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
    reachId: 'a-3',
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

  // ── Award Watch athletes (home "Award Watch" section: top cards + the
  // Wooden / POY / ROY / DPOY / 6MOY nominee groups). ids match slugify(name)
  // so app/card/[id].tsx resolves them by tapped caption. reachId set only
  // where a fixture exists in mock-social-reach.ts.
  {
    id: 'aj-dybantsa', name: 'AJ Dybantsa', sport: 'MBB',
    school: 'BYU', schoolShort: 'BYU', schoolColor: '#002E5D',
    number: '1', initials: 'AD', accent: '#4A90D9', reachId: 'a-8',
  },
  {
    id: 'rj-davis', name: 'RJ Davis', sport: 'MBB',
    school: 'North Carolina', schoolShort: 'UNC', schoolColor: '#7BAFD4',
    number: '4', initials: 'RD', accent: '#5B8DD9', reachId: 'a-12',
  },
  {
    id: 'zach-edey', name: 'Zach Edey', sport: 'MBB',
    school: 'Purdue', schoolShort: 'Purdue', schoolColor: '#CFB991',
    number: '15', initials: 'ZE', accent: '#D4A843',
  },
  {
    id: 'hunter-sallis', name: 'Hunter Sallis', sport: 'MBB',
    school: 'Wake Forest', schoolShort: 'Wake Forest', schoolColor: '#9E7E38',
    number: '23', initials: 'HS', accent: '#D4A843',
  },
  {
    id: 'trey-alexander', name: 'Trey Alexander', sport: 'MBB',
    school: 'Creighton', schoolShort: 'Creighton', schoolColor: '#00478A',
    number: '23', initials: 'TA', accent: '#4A90D9',
  },
  {
    id: 'tyler-kolek', name: 'Tyler Kolek', sport: 'MBB',
    school: 'Marquette', schoolShort: 'Marquette', schoolColor: '#003366',
    number: '11', initials: 'TK', accent: '#4A90D9',
  },
  {
    id: 'boo-buie', name: 'Boo Buie', sport: 'MBB',
    school: 'Northwestern', schoolShort: 'Northwestern', schoolColor: '#4E2A84',
    number: '0', initials: 'BB', accent: '#A855F7',
  },
  {
    id: 'kyle-filipowski', name: 'Kyle Filipowski', sport: 'MBB',
    school: 'Duke University', schoolShort: 'Duke', schoolColor: '#001A57',
    number: '30', initials: 'KF', accent: '#4A90D9',
  },
  {
    id: 'hunter-dickinson', name: 'Hunter Dickinson', sport: 'MBB',
    school: 'Kansas', schoolShort: 'Kansas', schoolColor: '#0051BA',
    number: '1', initials: 'HD', accent: '#4A90D9',
  },
  {
    id: 'jalen-cone', name: 'Jalen Cone', sport: 'MBB',
    school: 'Northern Arizona', schoolShort: 'Northern AZ', schoolColor: '#003466',
    number: '2', initials: 'JC', accent: '#4A90D9',
  },
  {
    id: 'cameron-boozer', name: 'Cameron Boozer', sport: 'MBB',
    school: 'Duke University', schoolShort: 'Duke', schoolColor: '#001A57',
    number: '12', initials: 'CB', accent: '#4A90D9',
  },
  {
    id: 'tre-johnson', name: 'Tre Johnson', sport: 'MBB',
    school: 'Texas', schoolShort: 'Texas', schoolColor: '#BF5700',
    number: '20', initials: 'TJ', accent: '#FF6F3C',
  },
  {
    id: 'boogie-fland', name: 'Boogie Fland', sport: 'MBB',
    school: 'Arkansas', schoolShort: 'Arkansas', schoolColor: '#9D2235',
    number: '2', initials: 'BF', accent: '#EF4444',
  },
  {
    id: 'vj-edgecombe', name: 'VJ Edgecombe', sport: 'MBB',
    school: 'Baylor', schoolShort: 'Baylor', schoolColor: '#003015',
    number: '7', initials: 'VE', accent: '#14B8A6',
  },
  {
    id: 'karter-knox', name: 'Karter Knox', sport: 'MBB',
    school: 'Arkansas', schoolShort: 'Arkansas', schoolColor: '#9D2235',
    number: '11', initials: 'KK', accent: '#EF4444',
  },
  {
    id: 'eddie-lampkin', name: 'Eddie Lampkin', sport: 'MBB',
    school: 'Syracuse University', schoolShort: 'Syracuse', schoolColor: '#F76900',
    number: '4', initials: 'EL', accent: '#FF6F3C',
  },
  {
    id: 'donovan-clingan', name: 'Donovan Clingan', sport: 'MBB',
    school: 'UConn', schoolShort: 'UConn', schoolColor: '#000E2F',
    number: '32', initials: 'DC', accent: '#3B82F6',
  },
  {
    id: 'yves-missi', name: 'Yves Missi', sport: 'MBB',
    school: 'Baylor', schoolShort: 'Baylor', schoolColor: '#003015',
    number: '21', initials: 'YM', accent: '#14B8A6',
  },
  {
    id: 'adem-bona', name: 'Adem Bona', sport: 'MBB',
    school: 'UCLA', schoolShort: 'UCLA', schoolColor: '#2D68C4',
    number: '3', initials: 'AB', accent: '#4A90D9',
  },
  {
    id: 'kel-el-ware', name: "Kel'el Ware", sport: 'MBB',
    school: 'Indiana', schoolShort: 'Indiana', schoolColor: '#990000',
    number: '1', initials: 'KW', accent: '#EF4444',
  },
  {
    id: 'vladislav-goldin', name: 'Vladislav Goldin', sport: 'MBB',
    school: 'FAU', schoolShort: 'FAU', schoolColor: '#003366',
    number: '50', initials: 'VG', accent: '#4A90D9',
  },
  {
    id: 'donnie-freeman', name: 'Donnie Freeman', sport: 'MBB',
    school: 'Syracuse University', schoolShort: 'Syracuse', schoolColor: '#F76900',
    number: '20', initials: 'DF', accent: '#FF6F3C',
  },
  {
    id: 'reece-beekman', name: 'Reece Beekman', sport: 'MBB',
    school: 'Virginia', schoolShort: 'Virginia', schoolColor: '#232D4B',
    number: '2', initials: 'RB', accent: '#4A90D9',
  },
  {
    id: 'kj-simpson', name: 'KJ Simpson', sport: 'MBB',
    school: 'Colorado', schoolShort: 'Colorado', schoolColor: '#CFB87C',
    number: '2', initials: 'KS', accent: '#D4A843',
  },
  {
    id: 'caleb-love', name: 'Caleb Love', sport: 'MBB',
    school: 'Arizona', schoolShort: 'Arizona', schoolColor: '#AB0520',
    number: '2', initials: 'CL', accent: '#EF4444',
  },
  {
    id: 'andrew-carr', name: 'Andrew Carr', sport: 'MBB',
    school: 'Wake Forest', schoolShort: 'Wake Forest', schoolColor: '#9E7E38',
    number: '11', initials: 'AC', accent: '#D4A843',
  },
  {
    id: 'tyler-burton', name: 'Tyler Burton', sport: 'MBB',
    school: 'Villanova', schoolShort: 'Villanova', schoolColor: '#002F6C',
    number: '3', initials: 'TB', accent: '#4A90D9',
  },

  // ── Transfer Portal athletes (home "Transfer Portal" section, tp-1…tp-6).
  // All football; team strings are "From → To" so school shows the destination.
  {
    id: 'marcus-hayes', name: 'Marcus Hayes', sport: 'Football',
    school: 'Texas → Oregon', schoolShort: 'Oregon', schoolColor: '#154733',
    number: '7', initials: 'MH', accent: '#14B8A6',
  },
  {
    id: 'jaylen-brooks', name: 'Jaylen Brooks', sport: 'Football',
    school: 'Alabama → USC', schoolShort: 'USC', schoolColor: '#990000',
    number: '11', initials: 'JB', accent: '#EF4444',
  },
  {
    id: 'devon-mills', name: 'Devon Mills', sport: 'Football',
    school: 'Miami → Georgia', schoolShort: 'Georgia', schoolColor: '#BA0C2F',
    number: '9', initials: 'DM', accent: '#EF4444',
  },
  {
    id: 'kameron-reed', name: 'Kameron Reed', sport: 'Football',
    school: 'LSU → Penn State', schoolShort: 'Penn St', schoolColor: '#041E42',
    number: '5', initials: 'KR', accent: '#4A90D9',
  },
  {
    id: 'tre-sean-owens', name: 'Tre’Sean Owens', sport: 'Football',
    school: 'Auburn → Florida', schoolShort: 'Florida', schoolColor: '#0021A5',
    number: '22', initials: 'TO', accent: '#4A90D9',
  },
  {
    id: 'anthony-reyes', name: 'Anthony Reyes', sport: 'Football',
    school: 'Stanford → Notre Dame', schoolShort: 'Notre Dame', schoolColor: '#0C2340',
    number: '74', initials: 'AR', accent: '#D4A843',
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
