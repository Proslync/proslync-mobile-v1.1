import realNilDeals from "@/lib/data/real-nil-deals.json";
import * as mockRegistry from "../mock-registry";

export interface AthleteItem {
  id: string;
  name: string;
  handle: string;
  sport: string;
  school: string;
  classYear: string;
  initials: string;
  color: string;
  followers: string;
  rank?: string;
  headshotUrl: string;
  headshotSource: string;
}

type RealNilAthlete = {
  athlete: string;
  sport: string;
  school: string;
  deals: { brand: string }[];
  on3_valuation_usd?: number | null;
  social_followers?: {
    instagram?: number | null;
    tiktok?: number | null;
  };
  headshot_url?: string | null;
  headshot_source?: string | null;
};

type CompleteRealNilAthlete = RealNilAthlete & {
  headshot_url: string;
  headshot_source: string;
};

const ATHLETE_META: Record<
  string,
  Pick<AthleteItem, "id" | "handle" | "initials" | "color">
> = {
  "Kiyan Anthony": { id: "at-kiyan", handle: "@kiyananthony", initials: "KA", color: "#F76900" },
  "Cooper Flagg": { id: "at-flagg", handle: "@cooperflagg", initials: "CF", color: "#001A57" },
  "JuJu Watkins": { id: "at-juju", handle: "@jujubballin", initials: "JW", color: "#990000" },
  "Livvy Dunne": { id: "at-livvy", handle: "@livvydunne", initials: "LD", color: "#461D7C" },
  "Hannah Hidalgo": { id: "at-hidalgo", handle: "@hannahhidalgo", initials: "HH", color: "#0C2340" },
  "Caitlin Clark": { id: "at-caitlin", handle: "@caitlinclark22", initials: "CC", color: "#FFCD00" },
  "Paige Bueckers": { id: "at-paige", handle: "@paigebueckers", initials: "PB", color: "#000E2F" },
  "Angel Reese": { id: "at-angel", handle: "@angelreese5", initials: "AR", color: "#461D7C" },
  "Bronny James": { id: "at-bronny", handle: "@bronny", initials: "BJ", color: "#990000" },
  "Shedeur Sanders": { id: "at-shedeur", handle: "@shedeursanders", initials: "SS", color: "#CFB87C" },
  "Travis Hunter": { id: "at-travis", handle: "@db3_tip", initials: "TH", color: "#CFB87C" },
  "Arch Manning": { id: "at-arch", handle: "@archmanning", initials: "AM", color: "#BF5700" },
};

const FEATURED_ORDER = [
  "Kiyan Anthony",
  "Cooper Flagg",
  "JuJu Watkins",
  "Livvy Dunne",
  "Hannah Hidalgo",
  "Caitlin Clark",
  "Paige Bueckers",
  "Angel Reese",
  "Bronny James",
  "Shedeur Sanders",
  "Travis Hunter",
  "Arch Manning",
] as const;

function hasCompleteProfile(row: RealNilAthlete): row is CompleteRealNilAthlete {
  return Boolean(
    row.athlete &&
      row.sport &&
      row.school &&
      row.headshot_url &&
      row.headshot_source &&
      row.deals?.length,
  );
}

function formatFollowers(row: RealNilAthlete): string {
  const counts = [
    row.social_followers?.instagram ?? 0,
    row.social_followers?.tiktok ?? 0,
  ];
  const max = Math.max(...counts);
  if (max >= 1_000_000) return `${(max / 1_000_000).toFixed(max >= 10_000_000 ? 0 : 1)}M`;
  if (max >= 1_000) return `${Math.round(max / 1_000)}K`;
  return "Public";
}

function formatValuation(row: RealNilAthlete): string | undefined {
  if (!row.on3_valuation_usd) return undefined;
  if (row.on3_valuation_usd >= 1_000_000) {
    return `$${(row.on3_valuation_usd / 1_000_000).toFixed(1)}M NIL`;
  }
  return `$${Math.round(row.on3_valuation_usd / 1_000)}K NIL`;
}

const realNilRows = (realNilDeals as { athletes: RealNilAthlete[] }).athletes;
const rowByName = new Map(realNilRows.filter(hasCompleteProfile).map((row) => [row.athlete, row]));

export const ATHLETE_CATALOG: AthleteItem[] = FEATURED_ORDER.flatMap((name) => {
  const row = rowByName.get(name);
  const meta = ATHLETE_META[name];
  if (!row || !meta) return [];
  return [
    {
      ...meta,
      name: row.athlete,
      sport: row.sport,
      school: row.school,
      classYear: "sourced NIL profile",
      followers: formatFollowers(row),
      rank: formatValuation(row),
      headshotUrl: row.headshot_url,
      headshotSource: row.headshot_source,
    },
  ];
});

mockRegistry.register({
  id: "athlete-catalog",
  description: "Complete sourced NIL athlete roster used by the search screen",
  load: () => ATHLETE_CATALOG,
});
