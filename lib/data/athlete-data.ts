// Static reference data for the athlete registration flow.
// Not an exhaustive NCAA list — covers the sports and schools users
// are likely to pick during the Proslync pilot. Extend as needed.

export interface Sport {
  id: string;
  label: string;
  positions: string[];
}

export interface School {
  id: string;
  name: string;
  conference: string;
  division: Division;
}

export type Division =
  | "D-I Power 4"
  | "D-I G5"
  | "D-II"
  | "D-III"
  | "NAIA"
  | "HS";

export const DIVISIONS: Division[] = [
  "D-I Power 4",
  "D-I G5",
  "D-II",
  "D-III",
  "NAIA",
  "HS",
];

export const SPORTS: Sport[] = [
  {
    id: "football",
    label: "Football",
    positions: [
      "QB", "RB", "FB", "WR", "TE",
      "OT", "OG", "C",
      "DE", "DT", "NT",
      "OLB", "ILB", "MLB",
      "CB", "S", "NB",
      "K", "P", "LS",
      "KR", "PR",
    ],
  },
  {
    id: "basketball-men",
    label: "Men's Basketball",
    positions: ["PG", "SG", "SF", "PF", "C"],
  },
  {
    id: "basketball-women",
    label: "Women's Basketball",
    positions: ["PG", "SG", "SF", "PF", "C"],
  },
  {
    id: "baseball",
    label: "Baseball",
    positions: ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"],
  },
  {
    id: "softball",
    label: "Softball",
    positions: ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DP"],
  },
  {
    id: "soccer-men",
    label: "Men's Soccer",
    positions: ["GK", "CB", "FB", "WB", "DM", "CM", "AM", "W", "ST"],
  },
  {
    id: "soccer-women",
    label: "Women's Soccer",
    positions: ["GK", "CB", "FB", "WB", "DM", "CM", "AM", "W", "ST"],
  },
  {
    id: "volleyball",
    label: "Volleyball",
    positions: ["S", "OH", "MB", "OPP", "L", "DS"],
  },
  {
    id: "track-field",
    label: "Track & Field",
    positions: [
      "Sprints", "Mid-distance", "Distance",
      "Hurdles", "Jumps", "Throws", "Combined events",
    ],
  },
  {
    id: "cross-country",
    label: "Cross Country",
    positions: ["Runner"],
  },
  {
    id: "swim-dive",
    label: "Swimming & Diving",
    positions: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM", "Relay", "Diver"],
  },
  {
    id: "tennis",
    label: "Tennis",
    positions: ["Singles", "Doubles"],
  },
  {
    id: "golf",
    label: "Golf",
    positions: ["Individual"],
  },
  {
    id: "wrestling",
    label: "Wrestling",
    positions: [
      "125 lb", "133 lb", "141 lb", "149 lb", "157 lb",
      "165 lb", "174 lb", "184 lb", "197 lb", "HWT",
    ],
  },
  {
    id: "gymnastics",
    label: "Gymnastics",
    positions: ["All-around", "Vault", "Bars", "Beam", "Floor"],
  },
  {
    id: "hockey",
    label: "Ice Hockey",
    positions: ["G", "D", "LW", "C", "RW"],
  },
  {
    id: "lacrosse-men",
    label: "Men's Lacrosse",
    positions: ["Attack", "Midfield", "Defense", "Goalie", "LSM", "FOGO"],
  },
  {
    id: "lacrosse-women",
    label: "Women's Lacrosse",
    positions: ["Attack", "Midfield", "Defense", "Goalie", "Draw specialist"],
  },
];

// Hand-picked set spanning P4 + G5 + notable mid-majors + HBCUs.
// Expand via CSV import when the backend is live.
export const SCHOOLS: School[] = [
  // SEC
  { id: "alabama", name: "Alabama", conference: "SEC", division: "D-I Power 4" },
  { id: "arkansas", name: "Arkansas", conference: "SEC", division: "D-I Power 4" },
  { id: "auburn", name: "Auburn", conference: "SEC", division: "D-I Power 4" },
  { id: "florida", name: "Florida", conference: "SEC", division: "D-I Power 4" },
  { id: "georgia", name: "Georgia", conference: "SEC", division: "D-I Power 4" },
  { id: "kentucky", name: "Kentucky", conference: "SEC", division: "D-I Power 4" },
  { id: "lsu", name: "LSU", conference: "SEC", division: "D-I Power 4" },
  { id: "ole-miss", name: "Ole Miss", conference: "SEC", division: "D-I Power 4" },
  { id: "mississippi-state", name: "Mississippi State", conference: "SEC", division: "D-I Power 4" },
  { id: "missouri", name: "Missouri", conference: "SEC", division: "D-I Power 4" },
  { id: "oklahoma", name: "Oklahoma", conference: "SEC", division: "D-I Power 4" },
  { id: "south-carolina", name: "South Carolina", conference: "SEC", division: "D-I Power 4" },
  { id: "tennessee", name: "Tennessee", conference: "SEC", division: "D-I Power 4" },
  { id: "texas", name: "Texas", conference: "SEC", division: "D-I Power 4" },
  { id: "texas-am", name: "Texas A&M", conference: "SEC", division: "D-I Power 4" },
  { id: "vanderbilt", name: "Vanderbilt", conference: "SEC", division: "D-I Power 4" },

  // Big Ten
  { id: "illinois", name: "Illinois", conference: "Big Ten", division: "D-I Power 4" },
  { id: "indiana", name: "Indiana", conference: "Big Ten", division: "D-I Power 4" },
  { id: "iowa", name: "Iowa", conference: "Big Ten", division: "D-I Power 4" },
  { id: "maryland", name: "Maryland", conference: "Big Ten", division: "D-I Power 4" },
  { id: "michigan", name: "Michigan", conference: "Big Ten", division: "D-I Power 4" },
  { id: "michigan-state", name: "Michigan State", conference: "Big Ten", division: "D-I Power 4" },
  { id: "minnesota", name: "Minnesota", conference: "Big Ten", division: "D-I Power 4" },
  { id: "nebraska", name: "Nebraska", conference: "Big Ten", division: "D-I Power 4" },
  { id: "northwestern", name: "Northwestern", conference: "Big Ten", division: "D-I Power 4" },
  { id: "ohio-state", name: "Ohio State", conference: "Big Ten", division: "D-I Power 4" },
  { id: "oregon", name: "Oregon", conference: "Big Ten", division: "D-I Power 4" },
  { id: "penn-state", name: "Penn State", conference: "Big Ten", division: "D-I Power 4" },
  { id: "purdue", name: "Purdue", conference: "Big Ten", division: "D-I Power 4" },
  { id: "rutgers", name: "Rutgers", conference: "Big Ten", division: "D-I Power 4" },
  { id: "ucla", name: "UCLA", conference: "Big Ten", division: "D-I Power 4" },
  { id: "usc", name: "USC", conference: "Big Ten", division: "D-I Power 4" },
  { id: "washington", name: "Washington", conference: "Big Ten", division: "D-I Power 4" },
  { id: "wisconsin", name: "Wisconsin", conference: "Big Ten", division: "D-I Power 4" },

  // ACC
  { id: "boston-college", name: "Boston College", conference: "ACC", division: "D-I Power 4" },
  { id: "california", name: "California", conference: "ACC", division: "D-I Power 4" },
  { id: "clemson", name: "Clemson", conference: "ACC", division: "D-I Power 4" },
  { id: "duke", name: "Duke", conference: "ACC", division: "D-I Power 4" },
  { id: "florida-state", name: "Florida State", conference: "ACC", division: "D-I Power 4" },
  { id: "georgia-tech", name: "Georgia Tech", conference: "ACC", division: "D-I Power 4" },
  { id: "louisville", name: "Louisville", conference: "ACC", division: "D-I Power 4" },
  { id: "miami", name: "Miami", conference: "ACC", division: "D-I Power 4" },
  { id: "nc-state", name: "NC State", conference: "ACC", division: "D-I Power 4" },
  { id: "north-carolina", name: "North Carolina", conference: "ACC", division: "D-I Power 4" },
  { id: "notre-dame", name: "Notre Dame", conference: "ACC", division: "D-I Power 4" },
  { id: "pittsburgh", name: "Pittsburgh", conference: "ACC", division: "D-I Power 4" },
  { id: "smu", name: "SMU", conference: "ACC", division: "D-I Power 4" },
  { id: "stanford", name: "Stanford", conference: "ACC", division: "D-I Power 4" },
  { id: "syracuse", name: "Syracuse", conference: "ACC", division: "D-I Power 4" },
  { id: "virginia", name: "Virginia", conference: "ACC", division: "D-I Power 4" },
  { id: "virginia-tech", name: "Virginia Tech", conference: "ACC", division: "D-I Power 4" },
  { id: "wake-forest", name: "Wake Forest", conference: "ACC", division: "D-I Power 4" },

  // Big 12
  { id: "arizona", name: "Arizona", conference: "Big 12", division: "D-I Power 4" },
  { id: "arizona-state", name: "Arizona State", conference: "Big 12", division: "D-I Power 4" },
  { id: "baylor", name: "Baylor", conference: "Big 12", division: "D-I Power 4" },
  { id: "byu", name: "BYU", conference: "Big 12", division: "D-I Power 4" },
  { id: "cincinnati", name: "Cincinnati", conference: "Big 12", division: "D-I Power 4" },
  { id: "colorado", name: "Colorado", conference: "Big 12", division: "D-I Power 4" },
  { id: "houston", name: "Houston", conference: "Big 12", division: "D-I Power 4" },
  { id: "iowa-state", name: "Iowa State", conference: "Big 12", division: "D-I Power 4" },
  { id: "kansas", name: "Kansas", conference: "Big 12", division: "D-I Power 4" },
  { id: "kansas-state", name: "Kansas State", conference: "Big 12", division: "D-I Power 4" },
  { id: "oklahoma-state", name: "Oklahoma State", conference: "Big 12", division: "D-I Power 4" },
  { id: "tcu", name: "TCU", conference: "Big 12", division: "D-I Power 4" },
  { id: "texas-tech", name: "Texas Tech", conference: "Big 12", division: "D-I Power 4" },
  { id: "ucf", name: "UCF", conference: "Big 12", division: "D-I Power 4" },
  { id: "utah", name: "Utah", conference: "Big 12", division: "D-I Power 4" },
  { id: "west-virginia", name: "West Virginia", conference: "Big 12", division: "D-I Power 4" },

  // Notable G5 / independents
  { id: "boise-state", name: "Boise State", conference: "Mountain West", division: "D-I G5" },
  { id: "memphis", name: "Memphis", conference: "American", division: "D-I G5" },
  { id: "navy", name: "Navy", conference: "American", division: "D-I G5" },
  { id: "army", name: "Army", conference: "American", division: "D-I G5" },
  { id: "liberty", name: "Liberty", conference: "C-USA", division: "D-I G5" },
  { id: "san-diego-state", name: "San Diego State", conference: "Mountain West", division: "D-I G5" },

  // Historic HBCUs
  { id: "howard", name: "Howard", conference: "MEAC", division: "D-I G5" },
  { id: "jackson-state", name: "Jackson State", conference: "SWAC", division: "D-I G5" },
  { id: "florida-am", name: "Florida A&M", conference: "SWAC", division: "D-I G5" },
  { id: "grambling", name: "Grambling", conference: "SWAC", division: "D-I G5" },

  // Non-college option
  { id: "high-school", name: "High School (other)", conference: "Independent", division: "HS" },
  { id: "other", name: "Other / Not listed", conference: "Independent", division: "D-III" },
];

export const CONFERENCES: string[] = Array.from(
  new Set(SCHOOLS.map((s) => s.conference))
).sort();

export const DEAL_TYPES = [
  "Social post",
  "Appearance",
  "Ambassador",
  "UGC",
  "Merch collab",
  "Autograph signing",
  "Podcast / interview",
  "Camp / clinic",
] as const;

export const CONTENT_CATEGORIES = [
  "Fitness",
  "Food",
  "Fashion",
  "Gaming",
  "Music",
  "Tech",
  "Automotive",
  "Beauty",
  "Travel",
  "Finance",
  "Education",
  "Faith",
] as const;

export const WEEKDAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
] as const;

export function findSchool(id: string): School | undefined {
  return SCHOOLS.find((s) => s.id === id);
}

export function positionsForSports(sportIds: string[]): string[] {
  const seen = new Set<string>();
  for (const id of sportIds) {
    const sport = SPORTS.find((s) => s.id === id);
    if (sport) for (const p of sport.positions) seen.add(p);
  }
  return Array.from(seen);
}
