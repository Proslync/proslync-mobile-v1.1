const TEAM_COLORS: Record<string, string> = {
  // ACC
  DUKE: '#001A57', 'N DAME': '#0C2340', SYR: '#F76900', CUSE: '#F76900',
  UVA: '#232D4B', UNC: '#7BAFD4', NC: '#7BAFD4', NCST: '#CC0000',
  'NC ST': '#CC0000', GT: '#B3A369', WAKE: '#9E7E38', BC: '#98002E',
  LOU: '#AD0000', MIAMI: '#F47321', PITT: '#003594', VT: '#660000',
  CLEM: '#F56600', FSU: '#782F40', SMU: '#0033A0', CAL: '#003262',
  STAN: '#8C1515',

  // Big Ten
  MICH: '#00274C', MSU: '#18453B', OSU: '#BB0000', PSU: '#041E42',
  'PENN S': '#041E42', IOWA: '#FFCD00', WISC: '#C5050C', MINN: '#7A0019',
  ILL: '#E84A27', PUR: '#CEB888', NEB: '#E41C38', IND: '#990000',
  RUTG: '#CC0033', MD: '#E03A3E', UCLA: '#2D68C4', USC: '#990000',
  ORE: '#154733', WASH: '#4B2E83',

  // SEC
  ALA: '#9E1B32', BAMA: '#9E1B32', UGA: '#BA0C2F', UF: '#0021A5',
  FLA: '#0021A5', LSU: '#461D7C', AUB: '#0C2340', TENN: '#FF8200',
  ARK: '#9D2235', MST: '#660000', 'MISS S': '#660000',
  MISS: '#14213D', 'OL MIS': '#14213D', TAMU: '#500000', 'TX A&M': '#500000',
  UK: '#0033A0', MIZZOU: '#F1B82D', MIZ: '#F1B82D', VANDY: '#866D4B',
  SC: '#73000A', TEX: '#BF5700', OKLA: '#841617', OU: '#841617',

  // Big 12
  KU: '#0051BA', KSU: '#512888', 'K ST': '#512888', ISU: '#C8102E',
  BAY: '#003015', OSU2: '#FF6600', TCU: '#4D1979', TTU: '#CC0000',
  'TX TC': '#CC0000', WVU: '#002855', CIN: '#E00122', UCF: '#BA9B37',
  HOU: '#C8102E', BYU: '#002E5D', COLO: '#CFB87C', ARIZ: '#AB0520',
  ASU: '#8C1D40', UTAH: '#CC0000',

  // Other notable
  GONZ: '#041E42', SMC: '#06315B', 'ST MA': '#06315B', MARQ: '#003366',
  CONN: '#0E1A2E', UCON: '#0E1A2E', NOVA: '#003366', CREIG: '#005CA9',
  XAVI: '#003F72', STJO: '#CE1126', PROV: '#000000', BUTL: '#13294B',
  PORT: '#3B0E53', SDSU: '#A6192E', MEMPH: '#003087',
  'ST JO': '#CE1126',

  // Baseball / Softball powerhouses
  VANDB: '#866D4B', FLORB: '#0021A5', ARKNB: '#9D2235',
  TEXB: '#BF5700', OKST: '#FF6600', WAKE2: '#9E7E38',

  // Lacrosse
  'J HOP': '#002D72', HOPK: '#002D72', CORN: '#B31B1B', YALE: '#00356B',
  ARMY: '#D3BC8D', NAVY: '#00205B', TOWN: '#FFB81C', DENV: '#8B2131',
  GTWN: '#041E42', LOYMD: '#006747', RUTGL: '#CC0033',
};

const FALLBACK_COLOR = '#555555';

const SPORT_LABEL: Record<string, string> = {
  'basketball-men': 'NCAA Basketball',
  'basketball-women': 'NCAA WBB',
  'lacrosse-men': 'NCAA Lacrosse',
  'lacrosse-women': 'NCAA W. Lacrosse',
  baseball: 'NCAA Baseball',
  softball: 'NCAA Softball',
  football: 'NCAA Football',
  'hockey-men': 'NCAA Hockey',
  'volleyball-women': 'NCAA Volleyball',
};

const SPORT_ICON: Record<string, string> = {
  'basketball-men': 'basketball-outline',
  'basketball-women': 'basketball-outline',
  'lacrosse-men': 'fitness-outline',
  'lacrosse-women': 'fitness-outline',
  baseball: 'baseball-outline',
  softball: 'baseball-outline',
  football: 'american-football-outline',
  'hockey-men': 'disc-outline',
  'volleyball-women': 'tennisball-outline',
};

const SPORT_ACCENT: Record<string, string> = {
  'basketball-men': '#EB621A',
  'basketball-women': '#EB621A',
  'lacrosse-men': '#3B82F6',
  'lacrosse-women': '#A855F7',
  baseball: '#EB621A',
  softball: '#F59E0B',
  football: '#EB621A',
  'hockey-men': '#3B82F6',
  'volleyball-women': '#EC4899',
};

export function teamColor(abbr: string): string {
  return TEAM_COLORS[abbr] ?? TEAM_COLORS[abbr.toUpperCase()] ?? FALLBACK_COLOR;
}

export function sportLabel(sport: string): string {
  return SPORT_LABEL[sport] ?? sport;
}

export function sportIcon(sport: string): string {
  return SPORT_ICON[sport] ?? 'trophy-outline';
}

export function sportAccent(sport: string): string {
  return SPORT_ACCENT[sport] ?? '#EB621A';
}
