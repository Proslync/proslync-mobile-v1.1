// ── MOCK BRAND COMPANY PROFILES (Sprint 2.1 — W20/W32) ───
// Hand-authored, synthetic brand profiles for the brand directory
// + brand-profile route. Every profile carries HQ, employees,
// revenue band, products / services, primary categories, recent
// news with citation refs, and trust metadata.
//
// All data is synthetic — `kind: 'synthetic'` on every source ref.
// Real verification will lift these from a backend brand registry
// + news ingestion pipeline in a later sprint.

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type {
  BrandCompanyProfile,
  BrandNewsItem,
} from '@/lib/types/brand-company.types';

const SYNTH = 'synthetic' as const;

function ref(
  id: string,
  label: string,
  daysAgo: number,
  citationUrl?: string,
): ComparableDealSourceRef {
  const retrievedAt = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  return {
    id,
    label,
    kind: SYNTH,
    retrievedAt,
    freshnessDays: daysAgo,
    citationUrl,
    caveat: 'Synthetic demo fixture — replace before production export.',
  };
}

function news(
  id: string,
  title: string,
  summary: string,
  publishedDaysAgo: number,
  sourceLabel: string,
  sourceUrl?: string,
): BrandNewsItem {
  const publishedAt = new Date(
    Date.now() - publishedDaysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  const freshness: BrandNewsItem['freshness'] =
    publishedDaysAgo < 14 ? 'fresh' : publishedDaysAgo <= 60 ? 'aging' : 'stale';
  return {
    id,
    title,
    summary,
    publishedAt,
    sourceLabel,
    sourceUrl,
    freshness,
    sourceRef: ref(`src-${id}`, sourceLabel, publishedDaysAgo, sourceUrl),
  };
}

export const MOCK_BRAND_COMPANIES: BrandCompanyProfile[] = [
  {
    brandId: 'brand-puma-hoops',
    legalName: 'Nike North America, Inc.',
    displayName: 'Nike Hoops',
    foundedYear: 1948,
    headquarters: { city: 'Somerville', state: 'MA', country: 'USA' },
    employees: 1850,
    revenueBandUSD: 'over-1b',
    productsServices: [
      'Performance basketball footwear',
      'Signature shoe deals',
      'On-court apparel',
      'NIL grassroots program',
    ],
    primaryCategories: ['Footwear', 'Basketball', 'Athletic apparel'],
    recentNews: [
      news(
        'n-puma-1',
        'Nike signs Top-100 wing to multi-year NIL deal',
        'Nike Hoops extended its grassroots program with a guaranteed-money signature track for a Top-100 high-school wing out of the DMV circuit.',
        4,
        'SLAM Online',
        'https://example.com/slam/puma-nil',
      ),
      news(
        'n-puma-2',
        'FY26 NIL budget rebalanced toward signature deals',
        'Brand cuts its NIL roster from 38 to 24 athletes while expanding signature-shoe spend for the top six.',
        12,
        'Sportico',
        'https://example.com/sportico/puma-fy26',
      ),
      news(
        'n-puma-3',
        'Boston design lab opens for college on-court line',
        'New Somerville studio supports rapid prototyping for college signature footwear capsules.',
        38,
        'Boston Globe',
        'https://example.com/globe/puma-lab',
      ),
      news(
        'n-puma-4',
        'EYBL weekend activation reaches 12M impressions',
        'Back-to-school campaign with 12 EYBL athletes posted Nike Hoops 14M weekend impressions.',
        72,
        'Front Office Sports',
        'https://example.com/fos/puma-eybl',
      ),
    ],
    socialFootprint: {
      instagram: '@pumahoops',
      tiktok: '@pumahoops',
      twitter: '@pumahoops',
    },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref(
        'src-puma-verify',
        'Proslync brand registry',
        4,
      ),
    },
  },
  {
    brandId: 'brand-local-honda',
    legalName: 'Patriot Honda Auto Group, LLC',
    displayName: 'Local Honda Dealer Group',
    foundedYear: 1982,
    headquarters: { city: 'Charlotte', state: 'NC', country: 'USA' },
    employees: 240,
    revenueBandUSD: '250m-1b',
    productsServices: [
      'New + certified pre-owned vehicles',
      'Service + parts',
      'Regional sponsorships',
    ],
    primaryCategories: ['Automotive', 'Retail', 'Local sponsorship'],
    recentNews: [
      news(
        'n-honda-1',
        'Local dealer group launches NIL booster fund',
        'Patriot Honda put $250K into a local NIL collective focused on UNC and NC State student-athletes.',
        9,
        'Charlotte Business Journal',
        'https://example.com/cbj/patriot-honda',
      ),
      news(
        'n-honda-2',
        'Spring service-bay rebrand ties to college season',
        'Charlotte-area showrooms now carry signed jerseys + AD-approved NIL talent photos.',
        28,
        'Patriot Honda PR',
        'https://example.com/patriot/spring',
      ),
      news(
        'n-honda-3',
        'New courtesy-car program for ACC athletes',
        'Dealer group offering loaner SUVs to compliance-cleared ACC student-athletes through 2027.',
        51,
        'WBTV',
        'https://example.com/wbtv/courtesy',
      ),
    ],
    socialFootprint: { instagram: '@patriothondaclt' },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref(
        'src-honda-verify',
        'Proslync brand registry',
        9,
      ),
    },
  },
  {
    brandId: 'brand-beats',
    legalName: 'Beats Electronics, LLC',
    displayName: 'Beats by Dre',
    foundedYear: 2006,
    headquarters: { city: 'Culver City', state: 'CA', country: 'USA' },
    employees: 720,
    revenueBandUSD: 'over-1b',
    productsServices: [
      'Wireless headphones',
      'Wireless earbuds',
      'Athlete + artist endorsements',
    ],
    primaryCategories: ['Consumer electronics', 'Audio', 'Lifestyle'],
    recentNews: [
      news(
        'n-beats-1',
        'Beats relaunches "Hear What You Want" with college athletes',
        'Campaign features ten Power-Five athletes with day-of-game audio rituals.',
        6,
        'Hypebeast',
        'https://example.com/hypebeast/beats',
      ),
      news(
        'n-beats-2',
        'College tunnel-walk Studio Pro capsule sells out in 48h',
        'School-colorway capsule generated record direct-to-fan revenue.',
        22,
        'The Verge',
        'https://example.com/verge/beats-capsule',
      ),
      news(
        'n-beats-3',
        'New compliance flow for school-licensed colorways',
        'Beats publishing dedicated AD-approval workflow for school-marks capsules.',
        47,
        'Sportico',
        'https://example.com/sportico/beats-flow',
      ),
    ],
    socialFootprint: {
      instagram: '@beatsbydre',
      tiktok: '@beatsbydre',
      twitter: '@beatsbydre',
    },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref('src-beats-verify', 'Proslync brand registry', 6),
    },
  },
  {
    brandId: 'brand-dicks',
    legalName: "DICK'S Sporting Goods, Inc.",
    displayName: "Dick's Sporting Goods",
    foundedYear: 1948,
    headquarters: { city: 'Coraopolis', state: 'PA', country: 'USA' },
    employees: 53000,
    revenueBandUSD: 'over-1b',
    productsServices: [
      'Athletic retail',
      'Team sports outfitter',
      'In-store activations',
      'House of Sport NIL events',
    ],
    primaryCategories: ['Retail', 'Sporting goods', 'Apparel'],
    recentNews: [
      news(
        'n-dicks-1',
        "House of Sport schedules college NIL athlete tour",
        '24-city tour with verified athletes featuring local-school colorways.',
        3,
        'Modern Retail',
        'https://example.com/modernretail/dicks',
      ),
      news(
        'n-dicks-2',
        'Dicks Foundation extends NIL micro-grant program',
        'Adds $1.2M for D2 / mid-major athletes in 2026.',
        17,
        'Sports Business Journal',
        'https://example.com/sbj/dicks',
      ),
      news(
        'n-dicks-3',
        'Pittsburgh HQ adds NIL compliance liaison',
        'New role coordinates with school ADs on AD-approved activations.',
        44,
        "Dick's Newsroom",
        'https://example.com/dicks/newsroom',
      ),
    ],
    socialFootprint: { instagram: '@dickssportinggoods', tiktok: '@dickssportinggoods' },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref('src-dicks-verify', 'Proslync brand registry', 3),
    },
  },
  {
    brandId: 'brand-athletic-brewing',
    legalName: 'Athletic Brewing Company, LLC',
    displayName: 'Athletic Brewing',
    foundedYear: 2017,
    headquarters: { city: 'Stratford', state: 'CT', country: 'USA' },
    employees: 280,
    revenueBandUSD: '50m-250m',
    productsServices: [
      'Non-alcoholic craft beer',
      'Athlete + coach campaigns',
      'College tour activations',
    ],
    primaryCategories: ['Beverage', 'Non-alcoholic', 'Lifestyle'],
    recentNews: [
      news(
        'n-ab-1',
        'Athletic Brewing locks in 6-school college tour',
        'Activations with athletic departments at SEC + ACC schools to amplify NA category.',
        7,
        'Beverage Industry',
        'https://example.com/bevind/ab-tour',
      ),
      news(
        'n-ab-2',
        'Coach-focused NIL pilot launches with Big Ten partners',
        'Coaches replace traditional booster talent in early creative cuts.',
        25,
        'Front Office Sports',
        'https://example.com/fos/ab-coaches',
      ),
      news(
        'n-ab-3',
        'NA category cleared for AD-approved alcohol policy',
        'Compliance teams at 14 schools approved Athletic for athlete creative.',
        58,
        'Sportico',
        'https://example.com/sportico/ab-policy',
      ),
    ],
    socialFootprint: { instagram: '@athleticbrewing' },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref('src-ab-verify', 'Proslync brand registry', 7),
    },
  },
  {
    brandId: 'brand-adidas-basketball',
    legalName: 'adidas America, Inc.',
    displayName: 'Adidas Basketball',
    foundedYear: 1949,
    headquarters: { city: 'Portland', state: 'OR', country: 'USA' },
    employees: 5400,
    revenueBandUSD: 'over-1b',
    productsServices: [
      'Performance basketball footwear',
      'Adidas 3SSB grassroots circuit',
      'Signature shoe deals',
      'Team apparel',
    ],
    primaryCategories: ['Footwear', 'Basketball', 'Grassroots'],
    recentNews: [
      news(
        'n-adi-1',
        'Adidas 3SSB expands to 24 teams for 2026',
        'Grassroots circuit will scale with new West-region pods.',
        5,
        'Slam Online',
        'https://example.com/slam/adi-3ssb',
      ),
      news(
        'n-adi-2',
        'New signature deal for 2026 #1 PG recruit',
        'Multi-year on-court line tied to college commitment.',
        19,
        'ESPN',
        'https://example.com/espn/adi-signature',
      ),
      news(
        'n-adi-3',
        'Adidas opens Houston NIL creative satellite',
        'Studio supports Big 12 / SEC athletes in regional media.',
        53,
        'Sportico',
        'https://example.com/sportico/adi-houston',
      ),
    ],
    socialFootprint: {
      instagram: '@adidashoops',
      tiktok: '@adidashoops',
      twitter: '@adidashoops',
    },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref('src-adi-verify', 'Proslync brand registry', 5),
    },
  },
  {
    brandId: 'brand-hoffman-auto',
    legalName: 'Hoffman Auto Group, Inc.',
    displayName: 'Hoffman Auto',
    foundedYear: 1934,
    headquarters: { city: 'East Hartford', state: 'CT', country: 'USA' },
    employees: 460,
    revenueBandUSD: '250m-1b',
    productsServices: [
      'Luxury + mainstream auto retail',
      'Regional sponsorships',
      'Athletic department co-brand programs',
    ],
    primaryCategories: ['Automotive', 'Retail', 'Local sponsorship'],
    recentNews: [
      news(
        'n-hoff-1',
        'Hoffman renews UConn AD-level sponsorship',
        'Multi-year deal with the UConn athletic department adds NIL athlete component.',
        11,
        'Hartford Courant',
        'https://example.com/courant/hoffman',
      ),
      news(
        'n-hoff-2',
        'New showroom NIL signage compliance approved',
        "Hoffman dealerships display compliance-cleared athlete photos.",
        34,
        'CT Insider',
        'https://example.com/ctinsider/hoffman',
      ),
      news(
        'n-hoff-3',
        'Pilot tester program with three women\'s basketball athletes',
        'AD-approved vehicle-tester arrangement for the 2026 season.',
        67,
        'Hoffman Newsroom',
        'https://example.com/hoffman/newsroom',
      ),
    ],
    socialFootprint: { instagram: '@hoffmanauto' },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref('src-hoff-verify', 'Proslync brand registry', 11),
    },
  },
  {
    brandId: 'brand-gatorade',
    legalName: 'Gatorade Company, Inc. (a PepsiCo subsidiary)',
    displayName: 'Gatorade',
    foundedYear: 1965,
    headquarters: { city: 'Chicago', state: 'IL', country: 'USA' },
    employees: 1300,
    revenueBandUSD: 'over-1b',
    productsServices: [
      'Sports drinks',
      'Hydration products',
      'High school + college sponsorship programs',
      'Performance science partnerships',
    ],
    primaryCategories: ['Beverage', 'Sports nutrition', 'Hydration'],
    recentNews: [
      news(
        'n-gat-1',
        'Gatorade Player of the Year program adds NIL pathway',
        'Winners now eligible for paid creative pipeline with brand partners.',
        2,
        'Sports Business Journal',
        'https://example.com/sbj/gatorade-poy',
      ),
      news(
        'n-gat-2',
        'Gx Performance Lab expands to second campus',
        'Performance-science kits deployed to 14 D1 programs.',
        21,
        'AdAge',
        'https://example.com/adage/gatorade',
      ),
      news(
        'n-gat-3',
        'New compliance language for school co-branded packaging',
        'School-mark packaging requires AD pre-clearance under new policy.',
        41,
        'Sportico',
        'https://example.com/sportico/gatorade',
      ),
      news(
        'n-gat-4',
        'PepsiCo Q4 hydration revenue beats consensus',
        'Gatorade volume up 6% YoY in college-channel sales.',
        78,
        'Reuters',
        'https://example.com/reuters/pep',
      ),
    ],
    socialFootprint: {
      instagram: '@gatorade',
      tiktok: '@gatorade',
      twitter: '@gatorade',
    },
    trustMeta: {
      lastVerifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      verificationSource: ref('src-gat-verify', 'Proslync brand registry', 2),
    },
  },
];

/** Default brand id shown by the brand profile route when none specified. */
export const DEFAULT_BRAND_ID = 'brand-puma-hoops';

/** Look up a brand by id; returns undefined when unknown. */
export function getMockBrandProfile(
  brandId: string,
): BrandCompanyProfile | undefined {
  return MOCK_BRAND_COMPANIES.find((b) => b.brandId === brandId);
}

/** Get the canonical list of all hand-authored brand company profiles. */
export function getAllMockBrandProfiles(): BrandCompanyProfile[] {
  return MOCK_BRAND_COMPANIES;
}
