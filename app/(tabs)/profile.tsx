import { ProfileActions } from "@/components/athlete/profile-actions";
import { MediaKitCard } from "@/components/athlete/media-kit-card";
import { FollowersSheet } from "@/components/feed/followers-sheet";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { SwipeableTabView } from "@/components/shared/swipeable-tab-view";
import { VideoThumbnailImage } from "@/components/shared/video-thumbnail";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useUserFeed } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useFocusEffect } from "expo-router";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-user-follows";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRole } from "@/lib/providers/role-provider";
import CoachProfile from "@/components/coach/coach-profile";
import AgentProfile from "@/components/agent/agent-profile";
import BrandProfile from "@/components/brand/brand-profile";
import FanProfile from "@/components/fan/fan-profile";
import SchoolProfile from "@/components/school/school-profile";
import CollectiveProfile from "@/components/collective/collective-profile";
import { RoleSwitcherSheet } from "@/components/shared/role-switcher-menu";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import {
  ActionSheet,
  type ActionSheetOption,
} from "@/components/ui/action-sheet";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useVideoPlayer, VideoView } from "expo-video";
import { persistLocalMedia, isLocalMediaAlive, healLocalMediaUri, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia, resolveAvatarSource } from '@/lib/media/resolve-media';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "expo-glass-effect";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — measured top edge from screen bottom (incl. safe area)
const POST_GAP = 1;
const GRID_COLS = 3;
const CARD_H_PAD = 16; // postsSection paddingHorizontal
const CARD_INNER_PAD = 10; // postsCard padding
// Card inner width = screen - outer padding*2 - inner padding*2 - hairline borders
const CARD_INNER_WIDTH = SCREEN_WIDTH - CARD_H_PAD * 2 - CARD_INNER_PAD * 2;
const GRID_POST_SIZE = Math.floor(
  (SCREEN_WIDTH - POST_GAP * (GRID_COLS - 1)) / GRID_COLS
);

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

// Hero gradient — grey at top fading to light
const HERO_GRADIENT = [
  "rgba(140,140,148,0.65)",
  "rgba(165,165,172,0.45)",
  "rgba(200,200,206,0.22)",
  "rgba(242,242,247,0)",
] as const;

// ─── Aggregated social-feed mock (Instagram/TikTok/X/YouTube/Facebook/Snapchat) ───

type SocialPlatform = 'instagram' | 'tiktok' | 'x' | 'youtube' | 'facebook' | 'snapchat';

type SocialPost = {
  id: string;
  platform: SocialPlatform;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  hashtags?: string[];
  mentions?: string[];
  brandTag?: string;
  likes: number;
  comments: number;
  reposts: number;
  timeAgo: string;
};

const MOCK_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'sp-1',
    platform: 'instagram',
    mediaUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    mediaType: 'image',
    caption: 'Orange on orange. Dome night tomorrow — let\'s go 🍊',
    hashtags: ['CuseMode', 'ACCHoops'],
    mentions: ['cuse_mbb'],
    likes: 18240,
    comments: 312,
    reposts: 184,
    timeAgo: '2h',
  },
  {
    id: 'sp-2',
    platform: 'tiktok',
    mediaUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80',
    mediaType: 'video',
    caption: 'Pull-up J from the wing · early morning gym rat tings ⚡️',
    hashtags: ['HoopTok', 'SyracuseBasketball'],
    likes: 246000,
    comments: 4820,
    reposts: 9100,
    timeAgo: '6h',
  },
  {
    id: 'sp-3',
    platform: 'x',
    mediaUrl: 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1200&q=80',
    mediaType: 'image',
    caption: 'Blessed to link up with @jordanbrand — family ever since the JBC. We keep building.',
    brandTag: 'Jordan Brand',
    mentions: ['jordanbrand'],
    likes: 32400,
    comments: 612,
    reposts: 1440,
    timeAgo: '1d',
  },
  {
    id: 'sp-4',
    platform: 'youtube',
    mediaUrl: 'https://images.unsplash.com/photo-1505666287802-931dc83a0fe4?w=1200&q=80',
    mediaType: 'video',
    caption: 'Road to Cuse — Ep. 4 · film room w/ Coach Red Autry and the freshman group. Drop in the bio.',
    hashtags: ['RoadToCuse', 'Vlog'],
    likes: 142800,
    comments: 3210,
    reposts: 970,
    timeAgo: '2d',
  },
  {
    id: 'sp-5',
    platform: 'instagram',
    mediaUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&q=80',
    mediaType: 'image',
    caption: 'Back at the Boys & Girls Club in Harlem. These kids run the city 🗽',
    hashtags: ['GiveBack', 'HarlemRaised'],
    mentions: ['bgcharlem'],
    likes: 47210,
    comments: 812,
    reposts: 402,
    timeAgo: '3d',
  },
  {
    id: 'sp-6',
    platform: 'facebook',
    mediaUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200&q=80',
    mediaType: 'image',
    caption: 'Proud to partner with Nike for the new Melo signature line. Dropping soon 🎯',
    brandTag: 'Nike',
    mentions: ['puma'],
    likes: 12840,
    comments: 248,
    reposts: 188,
    timeAgo: '4d',
  },
  {
    id: 'sp-7',
    platform: 'snapchat',
    mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
    mediaType: 'image',
    caption: 'Postgame w/ the squad · W on the board 🔥',
    likes: 8400,
    comments: 0,
    reposts: 0,
    timeAgo: '5d',
  },
];

const PLATFORM_META: Record<SocialPlatform, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  instagram: { icon: 'logo-instagram', color: '#E1306C', label: 'Instagram' },
  tiktok: { icon: 'logo-tiktok', color: '#FFFFFF', label: 'TikTok' },
  x: { icon: 'logo-twitter', color: '#FFFFFF', label: 'X' },
  youtube: { icon: 'logo-youtube', color: '#FF0000', label: 'YouTube' },
  facebook: { icon: 'logo-facebook', color: '#1877F2', label: 'Facebook' },
  snapchat: { icon: 'logo-snapchat', color: '#FFFC00', label: 'Snapchat' },
};

function SocialPostCard({ post, athleteName, athleteMeta, avatarSource }: { post: SocialPost; athleteName: string; athleteMeta: string; avatarSource: ImageSourcePropType }) {
  const meta = PLATFORM_META[post.platform];
  const [liked, setLiked] = React.useState(false);

  return (
    <View style={s.socialCard}>
      {/* Header row */}
      <View style={s.socialHeader}>
        <Image
          source={avatarSource}
          style={s.socialAvatar}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.socialName} numberOfLines={1}>{athleteName}</Text>
            <MaterialCommunityIcons name="check-decagram" size={13} color="#FF6F3C" />
          </View>
          <Text style={s.socialMeta} numberOfLines={1}>{athleteMeta}  ·  {post.timeAgo}</Text>
        </View>
        <View style={[s.socialPlatformChip, { borderColor: meta.color + '55' }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
        </View>
      </View>

      {/* Media */}
      <View style={s.socialMediaWrap}>
        <Image source={{ uri: post.mediaUrl }} style={s.socialMedia} resizeMode="cover" />
        {post.mediaType === 'video' && (
          <View style={s.socialPlayBadge}>
            <Ionicons name="play" size={18} color="#FFF" />
          </View>
        )}
      </View>

      {/* Caption */}
      <View style={s.socialBody}>
        <Text style={s.socialCaption}>{post.caption}</Text>
        {(post.hashtags?.length || post.mentions?.length || post.brandTag) ? (
          <Text style={s.socialTags}>
            {post.hashtags?.map((h) => `#${h}`).join(' ')}
            {post.hashtags?.length && (post.mentions?.length || post.brandTag) ? '  ' : ''}
            {post.mentions?.map((m) => `@${m}`).join(' ')}
            {post.brandTag ? `  [${post.brandTag}]` : ''}
          </Text>
        ) : null}
      </View>

      {/* Action row */}
      <View style={s.socialActions}>
        <TouchableOpacity style={s.socialAction} onPress={() => setLiked((v) => !v)} activeOpacity={0.7}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={19} color={liked ? '#FF6F3C' : '#FFF'} />
          <Text style={s.socialActionText}>{formatShortCount(post.likes + (liked ? 1 : 0))}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.socialAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
          <Text style={s.socialActionText}>{formatShortCount(post.comments)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.socialAction} activeOpacity={0.7}>
          <Ionicons name="repeat-outline" size={20} color="#FFF" />
          <Text style={s.socialActionText}>Repost</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.socialAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Source attribution */}
      <View style={s.socialSourceRow}>
        <Text style={s.socialSourceText}>Originally posted on {meta.label}</Text>
        <Ionicons name="arrow-up-outline" size={11} color="rgba(255,255,255,0.4)" style={{ transform: [{ rotate: '45deg' }] }} />
      </View>
    </View>
  );
}

function formatShortCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K';
  return String(n);
}

// ─── Peer-shared deals feed (Deals tab) ─────────────────────────

type SharedDeal = {
  id: string;
  brandName: string;
  brandAccent: string;
  brandInitial: string;
  dealType: string;
  category: string;
  sharedBy: { name: string; sport: string; school: string; avatarColor: string };
  testimonial?: string;
  dealRange?: string;
  deadline: string;
  network: 'open' | 'invite';
  // Extended detail (shown when "View Deal" tapped)
  brandProfile: {
    description: string;
    foundedYear: number;
    employees: string;
    revenue: string;
    headquarters: string;
    products: string[];
    recentNews: { headline: string; date: string; source: string }[];
  };
  breakdown: {
    deliverables: { item: string; due: string }[];
    compensation: { type: string; amount: string }[];
    exclusivity: string;
    usageRights: string;
    contractLength: string;
  };
  stage: 'open' | 'applied' | 'reviewing' | 'negotiating' | 'committed';
  commitments: string[];
  aiReview: {
    fitScore: number;
    summary: string;
    strengths: string[];
    risks: string[];
    recommendation: 'apply' | 'consider' | 'pass';
  };
};

const MOCK_SHARED_DEALS: SharedDeal[] = [
  {
    id: 'd-1',
    brandName: 'Celsius',
    brandAccent: '#00C2A8',
    brandInitial: 'C',
    dealType: 'Social Post × 3',
    category: 'Beverage',
    sharedBy: { name: 'Maya Chen', sport: 'Soccer', school: 'UCLA', avatarColor: '#9B5CFF' },
    testimonial: 'This was a great collab — fast, easy, $$$',
    dealRange: '$500 – $1,500',
    deadline: 'Apply by May 15',
    network: 'open',
    brandProfile: {
      description: 'Celsius is a fast-growing functional energy drink — zero sugar, zero artificial preservatives, formulated with green tea, ginger, and B-vitamins. Positioned around fitness and active lifestyles.',
      foundedYear: 2004,
      employees: '500-1,000',
      revenue: '$1.3B (2023)',
      headquarters: 'Boca Raton, FL',
      products: ['Original Celsius', 'Celsius Heat', 'Celsius Essentials', 'Celsius On-the-Go (powder sticks)'],
      recentNews: [
        { headline: 'Celsius signs WNBA partnership for 2025 season', date: 'Apr 2', source: 'Sports Business Journal' },
        { headline: 'Q4 revenue beats analyst expectations by 22%', date: 'Mar 18', source: 'Bloomberg' },
        { headline: 'Pepsi distribution deal extended through 2030', date: 'Feb 12', source: 'Reuters' },
      ],
    },
    breakdown: {
      deliverables: [
        { item: 'Instagram Reel (≥30s) featuring product', due: 'May 22' },
        { item: 'Instagram Story slide ×3 (with swipe-up to brand)', due: 'May 25' },
        { item: 'TikTok post (≥45s, organic-feel)', due: 'Jun 1' },
      ],
      compensation: [
        { type: 'Flat cash', amount: '$1,000' },
        { type: 'Free product (3 cases)', amount: '~$180 retail' },
        { type: 'Performance bonus (>250k views)', amount: 'up to $500' },
      ],
      exclusivity: 'Non-exclusive · 30-day blackout from competing energy brands',
      usageRights: 'Brand may re-use content on owned channels for 90 days · paid amplification not included',
      contractLength: '6 weeks (apply → final post)',
    },
    stage: 'open',
    commitments: [
      'Disclose paid partnership per FTC #ad guidelines',
      '24-hour exclusivity window before competing posts',
      'Submit each post for brand approval ≥48h before publishing',
      'Tag @celsiusofficial and use #LiveFit',
    ],
    aiReview: {
      fitScore: 82,
      summary: 'Strong audience-brand alignment. Your engagement rate (7.9%) is 1.7× the typical Celsius athlete-creator. Compensation is fair-to-favorable for the deliverable load.',
      strengths: [
        'Audience age skews 18-34, exact match for Celsius core demo.',
        'Comp range above the median for tier-2 creators with your reach.',
        'Brand has paid on time across 14 prior Proslync deals.',
      ],
      risks: [
        '30-day blackout limits competing energy/hydration deals.',
        'Performance bonus is steep — 250k views is your top-quartile threshold.',
      ],
      recommendation: 'apply',
    },
  },
  {
    id: 'd-2',
    brandName: 'Gymshark',
    brandAccent: '#1F1F1F',
    brandInitial: 'G',
    dealType: 'Ambassador (3-month)',
    category: 'Apparel',
    sharedBy: { name: 'Devonte King', sport: 'Basketball', school: 'Kentucky', avatarColor: '#FF6F3C' },
    testimonial: 'Solid product, easy content brief, they paid on time.',
    dealRange: '$3,000 – $6,000',
    deadline: 'Apply by Apr 30',
    network: 'open',
    brandProfile: {
      description: 'Gymshark is a UK-born performance-apparel brand with one of the largest creator-driven athletic communities. Cult-followed for technical fits, drop culture, and a massive ambassador program.',
      foundedYear: 2012,
      employees: '900+',
      revenue: '£500M+ (FY24)',
      headquarters: 'Solihull, UK',
      products: ['Vital Seamless', 'Apex Performance', 'Power Joggers', 'GS Recovery line'],
      recentNews: [
        { headline: 'Gymshark opens flagship store in London Westfield', date: 'Apr 15', source: 'Drapers' },
        { headline: 'Adds NCAA D1 athlete tier to ambassador program', date: 'Mar 28', source: 'Front Office Sports' },
      ],
    },
    breakdown: {
      deliverables: [
        { item: '4 Instagram posts (1/month + launch)', due: 'rolling' },
        { item: '8 Stories + 4 Reels per month', due: 'monthly' },
        { item: 'Wear Gymshark in any practice/game footage shared publicly', due: 'always-on' },
      ],
      compensation: [
        { type: 'Monthly retainer', amount: '$1,500/mo × 3' },
        { type: 'Quarterly product allowance', amount: '$1,000 retail' },
        { type: 'Drop priority + 30% off code', amount: '—' },
      ],
      exclusivity: 'Exclusive — no competing performance apparel for the 90-day term',
      usageRights: 'Brand may re-use across all owned + paid channels in perpetuity',
      contractLength: '90 days, auto-renew option',
    },
    stage: 'reviewing',
    commitments: [
      'Wear Gymshark in published athletic content',
      'Attend 1 virtual creator brief per month',
      'Approval workflow on all paid content before posting',
      'Maintain US shipping address for product allotments',
    ],
    aiReview: {
      fitScore: 71,
      summary: 'Solid retainer for a 3-month commitment. Exclusivity clause is broad — would lock you out of competing apparel deals during a peak NIL window.',
      strengths: [
        'Steady monthly cash + product makes value predictable.',
        'Brand frequently re-signs ambassadors — long-term upside.',
      ],
      risks: [
        'Broad exclusivity blocks Nike / UA / lululemon deals during the term.',
        'Perpetual usage rights give the brand significant downstream value.',
        'Content load (~12 deliverables/mo) is heavy.',
      ],
      recommendation: 'consider',
    },
  },
  {
    id: 'd-3',
    brandName: "Raising Cane's",
    brandAccent: '#D0131F',
    brandInitial: 'R',
    dealType: 'In-store Appearance',
    category: 'QSR / Food',
    sharedBy: { name: 'Leyla Aras', sport: 'Gymnastics', school: 'LSU', avatarColor: '#34C759' },
    testimonial: 'Hometown love. Kids lined up around the block.',
    dealRange: '$1,200 flat',
    deadline: 'Apply by May 2',
    network: 'invite',
    brandProfile: {
      description: 'Raising Cane\'s is a US fast-casual chicken-finger chain with cult fan loyalty and aggressive expansion. Heavy investor in collegiate athletics and athlete-led store events.',
      foundedYear: 1996,
      employees: '50,000+',
      revenue: '$3.7B (2023)',
      headquarters: 'Plano, TX',
      products: ['The Box Combo', 'Chicken Finger Plates', 'Caniacs Combo'],
      recentNews: [
        { headline: 'Cane\'s opens 800th US location', date: 'Apr 10', source: 'QSR Magazine' },
        { headline: 'Founder Todd Graves backs SEC NIL collective', date: 'Mar 30', source: 'On3' },
      ],
    },
    breakdown: {
      deliverables: [
        { item: 'In-store appearance · 90 minutes', due: 'May 18 · 5–6:30pm' },
        { item: 'Pre-event Instagram Story announcing visit', due: 'May 16' },
        { item: 'Post-event recap Story or Reel', due: 'May 20' },
      ],
      compensation: [
        { type: 'Flat cash', amount: '$1,200' },
        { type: 'Catering for athlete + 4 guests', amount: '~$120' },
        { type: 'Travel reimbursement', amount: 'up to $200' },
      ],
      exclusivity: 'Non-exclusive · QSR vertical only blackout (24h pre/post event)',
      usageRights: 'Brand can re-share organic posts; no paid amplification',
      contractLength: '2 weeks (booking → recap post)',
    },
    stage: 'committed',
    commitments: [
      'Be on-site, on-time, in NIL-approved attire',
      'Sign autographs / take photos for the duration',
      'Submit story content for 4-hour review window',
      'No alcohol/competitor products visible in event content',
    ],
    aiReview: {
      fitScore: 88,
      summary: 'Excellent local-fit deal. Compensation is at the top of band for a single-day commitment, and brand consistently re-books athletes from prior events.',
      strengths: [
        'Single-day execution, low scope creep risk.',
        'Cane\'s has 100% on-time payment history across Proslync.',
        'Local activation strengthens hometown narrative for your brand.',
      ],
      risks: [
        'In-person event — schedule conflict risk if game shifts.',
      ],
      recommendation: 'apply',
    },
  },
  {
    id: 'd-4',
    brandName: 'YETI',
    brandAccent: '#004D47',
    brandInitial: 'Y',
    dealType: 'Social Post × 2 + UGC',
    category: 'Outdoor / Lifestyle',
    sharedBy: { name: 'Amani Brooks', sport: 'Track & Field', school: 'Oregon', avatarColor: '#F5B316' },
    testimonial: undefined,
    dealRange: '$800 – $2,000',
    deadline: 'Apply by May 20',
    network: 'open',
    brandProfile: {
      description: 'YETI builds premium coolers, drinkware, and outdoor gear. Brand strategy leans on authentic outdoor / endurance ambassadors with strong storytelling.',
      foundedYear: 2006,
      employees: '1,200',
      revenue: '$1.7B (2023)',
      headquarters: 'Austin, TX',
      products: ['Tundra Hard Coolers', 'Hopper Soft Coolers', 'Rambler Drinkware', 'Crossroads Bags'],
      recentNews: [
        { headline: 'YETI launches first apparel line', date: 'Apr 8', source: 'GearJunkie' },
        { headline: 'Q1 revenue up 11% YoY on direct-to-consumer growth', date: 'Apr 1', source: 'YETI investor relations' },
      ],
    },
    breakdown: {
      deliverables: [
        { item: 'Lifestyle Instagram post featuring Rambler', due: 'May 27' },
        { item: 'Behind-the-scenes Reel (≥30s) — training day', due: 'Jun 3' },
        { item: 'UGC kit: 5 raw clips + 5 stills delivered to brand', due: 'Jun 5' },
      ],
      compensation: [
        { type: 'Flat cash', amount: '$1,200' },
        { type: 'YETI product bundle', amount: '~$450 retail' },
      ],
      exclusivity: 'Non-exclusive',
      usageRights: 'Brand may use UGC across paid + owned for 12 months',
      contractLength: '3 weeks',
    },
    stage: 'open',
    commitments: [
      'Submit raw UGC files in 4K landscape + portrait',
      'Approve final cut from brand creative team',
      'No competing premium drinkware tags/mentions during term',
    ],
    aiReview: {
      fitScore: 64,
      summary: 'Reasonable comp but UGC usage rights skew brand-favorable (12 months on paid). Audience overlap with YETI buyers is moderate.',
      strengths: [
        'Cash + premium product is a clean trade.',
        'Brand has strong creative leeway — content tends to be authentic.',
      ],
      risks: [
        '12-month paid usage of UGC is broad for the comp band.',
        'Audience-brand alignment is medium — your engagement may underperform brand benchmarks.',
      ],
      recommendation: 'consider',
    },
  },
  {
    id: 'd-5',
    brandName: 'BODYARMOR',
    brandAccent: '#0A2342',
    brandInitial: 'B',
    dealType: 'Seasonal Campaign',
    category: 'Sports Drink',
    sharedBy: { name: 'Jalen Ortiz', sport: 'Football', school: 'Michigan', avatarColor: '#E75F2B' },
    testimonial: 'Big check, tight creative brief. Recommend.',
    dealRange: '$4,500 – $8,000',
    deadline: 'Apply by Jun 1',
    network: 'open',
    brandProfile: {
      description: 'BODYARMOR is a Coca-Cola-owned premium sports drink brand. Backed by Mike Trout, Trae Young, and dozens of D1 athletes. Heavy spend on collegiate NIL via SDP partnerships.',
      foundedYear: 2011,
      employees: '300+',
      revenue: 'Owned by Coca-Cola (acquired 2021 for $5.6B)',
      headquarters: 'Whitestone, NY',
      products: ['BODYARMOR SuperDrink', 'BODYARMOR Lyte', 'BODYARMOR Edge', 'BODYARMOR Flash I.V.'],
      recentNews: [
        { headline: 'Inks NIL deal with 28 collegiate athletes for summer campaign', date: 'Apr 22', source: 'AdAge' },
        { headline: 'New SuperWater line launches at Target nationwide', date: 'Mar 14', source: 'Beverage Daily' },
      ],
    },
    breakdown: {
      deliverables: [
        { item: 'In-stadium photo + caption (game day)', due: 'first home game' },
        { item: 'Brand-approved Reel × 2 over the season', due: 'rolling' },
        { item: 'Wear BODYARMOR-branded sleeve / accessory in published clips', due: 'always-on' },
      ],
      compensation: [
        { type: 'Flat campaign fee', amount: '$6,500' },
        { type: 'Game-day product supply', amount: 'unlimited' },
      ],
      exclusivity: 'Exclusive — competing sports drinks (Gatorade, Powerade, Liquid IV) blacked out for the season',
      usageRights: 'Brand may use content in paid social + OOH for the season',
      contractLength: 'Full competitive season (~5 months)',
    },
    stage: 'negotiating',
    commitments: [
      'Wear branded item in any published practice/game content',
      'Avoid mentioning or being photographed with competing sports drinks',
      'Attend 1 brand summit (travel covered)',
      'Quarterly performance review with brand team',
    ],
    aiReview: {
      fitScore: 78,
      summary: 'High dollar value and strong brand stability. Season-long exclusivity is a real cost — model the trade carefully against the competing-deal pipeline.',
      strengths: [
        'Coca-Cola backing means contract enforcement and on-time payment is near-certain.',
        'Cash band is top decile for an in-season campaign at your tier.',
      ],
      risks: [
        '5-month exclusivity blocks the entire sports-drink vertical.',
        'Always-on visibility requirement adds gear/wardrobe complexity.',
      ],
      recommendation: 'apply',
    },
  },
  {
    id: 'd-6',
    brandName: 'Nike',
    brandAccent: '#111111',
    brandInitial: 'N',
    dealType: 'Product Seeding',
    category: 'Footwear',
    sharedBy: { name: 'Kira Nakamura', sport: 'Volleyball', school: 'Stanford', avatarColor: '#FF6F3C' },
    testimonial: 'No cash but 6 pairs / drop priority. Still a win.',
    deadline: 'Rolling',
    network: 'invite',
    brandProfile: {
      description: 'Nike is the world\'s largest athletic apparel and footwear brand. Product-seeding deals are a common entry point for emerging collegiate athletes — typically no cash but priority access and a path to a paid tier.',
      foundedYear: 1964,
      employees: '79,000+',
      revenue: '$51.4B (FY24)',
      headquarters: 'Beaverton, OR',
      products: ['Air Jordan', 'Nike Basketball', 'Nike Sportswear', 'Jordan Apparel', 'Air Max'],
      recentNews: [
        { headline: 'Nike expands collegiate seeding program to 1,200 athletes', date: 'Apr 18', source: 'Nike Newsroom' },
        { headline: 'Q3 NA revenue down 4% — refocusing on innovation pipeline', date: 'Mar 20', source: 'CNBC' },
      ],
    },
    breakdown: {
      deliverables: [
        { item: 'Wear Nike footwear in publicly-shared practice + game content', due: 'ongoing' },
        { item: 'Tag @nikebasketball when wearing seeded product', due: 'ongoing' },
        { item: 'Optional: send 2 high-quality content pieces per quarter', due: 'rolling' },
      ],
      compensation: [
        { type: 'Quarterly product seeding (6 pairs / season)', amount: '~$900 retail' },
        { type: 'Drop priority access', amount: '—' },
        { type: 'Path to paid ambassador tier (year 2)', amount: 'TBD' },
      ],
      exclusivity: 'Implicit — must wear Nike footwear; cannot be paid by competing footwear brand',
      usageRights: 'Brand may share organic posts; no paid use without separate agreement',
      contractLength: '12 months, auto-renew with conduct review',
    },
    stage: 'open',
    commitments: [
      'Wear seeded footwear in athletic content',
      'Tag brand in posts featuring product',
      'Maintain conduct standards per athlete code',
      'Honor exclusivity even without cash compensation',
    ],
    aiReview: {
      fitScore: 58,
      summary: 'Brand prestige and access are real, but the no-cash structure plus footwear exclusivity has high opportunity cost during your peak NIL years.',
      strengths: [
        'Nike association is a brand-equity lift.',
        'Path to paid tier — many athletes graduate to retainer in year 2.',
      ],
      risks: [
        'Locks out paid footwear deals (adidas, Puma, On Running) for 12 months.',
        'No cash floor — value depends entirely on the year-2 promotion happening.',
      ],
      recommendation: 'consider',
    },
  },
];

function SharedDealCard({
  deal,
  applied,
  onApply,
}: {
  deal: SharedDeal;
  applied: boolean;
  onApply: () => void;
}) {
  const [detailOpen, setDetailOpen] = React.useState(false);

  return (
    <View style={s.dealCard}>
      <DealDetailSheet deal={deal} visible={detailOpen} onClose={() => setDetailOpen(false)} />
      {/* Header: brand + open/invite status */}
      <View style={s.dealHeader}>
        <View style={[s.dealBrandLogo, { backgroundColor: deal.brandAccent }]}>
          <Text style={s.dealBrandInitial}>{deal.brandInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.dealBrandName} numberOfLines={1}>{deal.brandName}</Text>
          <Text style={s.dealTypeText} numberOfLines={1}>{deal.dealType}</Text>
        </View>
        <View style={s.dealNetworkBadge}>
          <View
            style={[
              s.dealNetworkDot,
              { backgroundColor: deal.network === 'open' ? '#34C759' : '#FF6F3C' },
            ]}
          />
          <Text style={s.dealNetworkText}>
            {deal.network === 'open' ? 'Open' : 'Invite'}
          </Text>
        </View>
      </View>

      {/* Meta chips */}
      <View style={s.dealChipRow}>
        {deal.dealRange ? (
          <View style={s.dealChip}>
            <Text style={s.dealChipLabel}>Comp</Text>
            <Text style={s.dealChipValue}>{deal.dealRange}</Text>
          </View>
        ) : null}
        <View style={s.dealChip}>
          <Text style={s.dealChipLabel}>Deadline</Text>
          <Text style={s.dealChipValue}>{deal.deadline}</Text>
        </View>
        <View style={s.dealChip}>
          <Text style={s.dealChipLabel}>Category</Text>
          <Text style={s.dealChipValue}>{deal.category}</Text>
        </View>
      </View>

      {/* Peer note */}
      {deal.testimonial ? (
        <View style={s.dealQuoteBlock}>
          <Text style={s.dealQuoteText} numberOfLines={3}>&ldquo;{deal.testimonial}&rdquo;</Text>
          <View style={s.dealSharedRow}>
            <View style={[s.dealSharerAvatar, { backgroundColor: deal.sharedBy.avatarColor }]} />
            <Text style={s.dealSharerMeta} numberOfLines={1}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>{deal.sharedBy.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>  ·  {deal.sharedBy.sport} · {deal.sharedBy.school}</Text>
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.dealSharedRow}>
          <View style={[s.dealSharerAvatar, { backgroundColor: deal.sharedBy.avatarColor }]} />
          <Text style={s.dealSharerMeta} numberOfLines={1}>
            <Text style={{ color: 'rgba(255,255,255,0.55)' }}>Shared by </Text>
            <Text style={{ color: '#FFF', fontWeight: '600' }}>{deal.sharedBy.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>  ·  {deal.sharedBy.sport} · {deal.sharedBy.school}</Text>
          </Text>
        </View>
      )}

      {/* Actions — all glass, no solid fills */}
      <View style={s.dealActions}>
        <TouchableOpacity style={s.dealBtn} activeOpacity={0.75} onPress={() => setDetailOpen(true)}>
          <Text style={s.dealBtnText}>View Deal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.dealBtn, s.dealBtnPrimary, applied && s.dealBtnActive]}
          activeOpacity={0.85}
          onPress={onApply}
          disabled={applied}
        >
          <Ionicons
            name={applied ? 'checkmark-circle' : 'paper-plane'}
            size={14}
            color={applied ? '#34C759' : '#FF6F3C'}
          />
          <Text style={[s.dealBtnText, { color: applied ? '#34C759' : '#FF6F3C' }]}>
            {applied ? 'Applied' : 'Apply'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dealBtnIcon} activeOpacity={0.75}>
          <Ionicons name="paper-plane-outline" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Deal detail sheet — opens when "View Deal" is tapped ─────────

const DEAL_SHEET_TRAVEL = 800;

function stageStepperItems(): { key: SharedDeal['stage']; label: string }[] {
  return [
    { key: 'open', label: 'Open' },
    { key: 'applied', label: 'Applied' },
    { key: 'reviewing', label: 'In review' },
    { key: 'negotiating', label: 'Negotiating' },
    { key: 'committed', label: 'Committed' },
  ];
}

function recommendationStyle(rec: SharedDeal['aiReview']['recommendation']): { label: string; color: string } {
  if (rec === 'apply') return { label: 'Apply', color: '#34C759' };
  if (rec === 'consider') return { label: 'Consider', color: '#FF6F3C' };
  return { label: 'Pass', color: '#FF453A' };
}

function fitScoreBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent fit', color: '#34C759' };
  if (score >= 65) return { label: 'Strong fit', color: '#FF6F3C' };
  if (score >= 50) return { label: 'Average fit', color: '#FFD60A' };
  return { label: 'Weak fit', color: '#FF453A' };
}

function DealDetailSheet({
  deal,
  visible,
  onClose,
}: {
  deal: SharedDeal;
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useSharedValue(DEAL_SHEET_TRAVEL);
  const backdropProgress = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropProgress.value = withTiming(1, { duration: 280 });
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(DEAL_SHEET_TRAVEL, { duration: 220 });
    backdropProgress.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 220);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropProgress.value = 1 - Math.min(e.translationY / DEAL_SHEET_TRAVEL, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) {
        translateY.value = withTiming(DEAL_SHEET_TRAVEL, { duration: 220 });
        backdropProgress.value = withTiming(0, { duration: 220 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropProgress.value = withTiming(1, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${0.65 * backdropProgress.value})`,
  }));

  const stageSteps = stageStepperItems();
  const stageIdx = stageSteps.findIndex((step) => step.key === deal.stage);
  const rec = recommendationStyle(deal.aiReview.recommendation);
  const fit = fitScoreBand(deal.aiReview.fitScore);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <Animated.View style={[dealSheetStyles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[dealSheetStyles.sheet, sheetAnimStyle]}>
          <GestureDetector gesture={panGesture}>
            <View>
              <View style={dealSheetStyles.handle} />
              <View style={dealSheetStyles.header}>
                <View style={[dealSheetStyles.headerBrandLogo, { backgroundColor: deal.brandAccent }]}>
                  <Text style={dealSheetStyles.headerBrandInitial}>{deal.brandInitial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={dealSheetStyles.headerBrandName}>{deal.brandName}</Text>
                  <Text style={dealSheetStyles.headerDealType}>{deal.dealType} · {deal.category}</Text>
                </View>
              </View>
            </View>
          </GestureDetector>

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 28 }}>
            {/* Stage stepper */}
            <View style={dealSheetStyles.stageRow}>
              {stageSteps.map((step, i) => {
                const reached = i <= stageIdx;
                const current = i === stageIdx;
                return (
                  <View key={step.key} style={{ flex: 1, alignItems: 'center' }}>
                    <View
                      style={[
                        dealSheetStyles.stageDot,
                        reached
                          ? { backgroundColor: '#FF6F3C', borderColor: '#FF6F3C' }
                          : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)' },
                        current && { transform: [{ scale: 1.18 }] },
                      ]}
                    />
                    <Text
                      style={[
                        dealSheetStyles.stageLabel,
                        reached ? { color: '#FFF', fontWeight: '700' } : { color: 'rgba(255,255,255,0.4)' },
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Brand profile */}
            <View style={dealSheetStyles.section}>
              <Text style={dealSheetStyles.sectionTitle}>Brand profile</Text>
              <Text style={dealSheetStyles.bodyText}>{deal.brandProfile.description}</Text>
              <View style={dealSheetStyles.statsGrid}>
                <View style={dealSheetStyles.statCell}>
                  <Text style={dealSheetStyles.statLabel}>Founded</Text>
                  <Text style={dealSheetStyles.statValue}>{deal.brandProfile.foundedYear}</Text>
                </View>
                <View style={dealSheetStyles.statCell}>
                  <Text style={dealSheetStyles.statLabel}>Employees</Text>
                  <Text style={dealSheetStyles.statValue}>{deal.brandProfile.employees}</Text>
                </View>
                <View style={dealSheetStyles.statCell}>
                  <Text style={dealSheetStyles.statLabel}>Revenue</Text>
                  <Text style={dealSheetStyles.statValue}>{deal.brandProfile.revenue}</Text>
                </View>
                <View style={dealSheetStyles.statCell}>
                  <Text style={dealSheetStyles.statLabel}>HQ</Text>
                  <Text style={dealSheetStyles.statValue}>{deal.brandProfile.headquarters}</Text>
                </View>
              </View>
              <Text style={dealSheetStyles.subTitle}>Products</Text>
              <View style={dealSheetStyles.chipRow}>
                {deal.brandProfile.products.map((p) => (
                  <View key={p} style={dealSheetStyles.productChip}>
                    <Text style={dealSheetStyles.productChipText}>{p}</Text>
                  </View>
                ))}
              </View>
              <Text style={dealSheetStyles.subTitle}>Recent news</Text>
              {deal.brandProfile.recentNews.map((n, i) => (
                <View key={i} style={dealSheetStyles.newsRow}>
                  <View style={dealSheetStyles.newsDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={dealSheetStyles.newsHeadline}>{n.headline}</Text>
                    <Text style={dealSheetStyles.newsMeta}>{n.source} · {n.date}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Deal breakdown */}
            <View style={dealSheetStyles.section}>
              <Text style={dealSheetStyles.sectionTitle}>Proposed deal</Text>
              <Text style={dealSheetStyles.subTitle}>Deliverables</Text>
              {deal.breakdown.deliverables.map((d, i) => (
                <View key={i} style={dealSheetStyles.deliverableRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FF6F3C" />
                  <View style={{ flex: 1 }}>
                    <Text style={dealSheetStyles.deliverableItem}>{d.item}</Text>
                    <Text style={dealSheetStyles.deliverableDue}>Due {d.due}</Text>
                  </View>
                </View>
              ))}
              <Text style={dealSheetStyles.subTitle}>Compensation</Text>
              {deal.breakdown.compensation.map((c, i) => (
                <View key={i} style={dealSheetStyles.compRow}>
                  <Text style={dealSheetStyles.compType}>{c.type}</Text>
                  <Text style={dealSheetStyles.compAmount}>{c.amount}</Text>
                </View>
              ))}
              <View style={dealSheetStyles.fineRow}>
                <Text style={dealSheetStyles.fineLabel}>Exclusivity</Text>
                <Text style={dealSheetStyles.fineValue}>{deal.breakdown.exclusivity}</Text>
              </View>
              <View style={dealSheetStyles.fineRow}>
                <Text style={dealSheetStyles.fineLabel}>Usage rights</Text>
                <Text style={dealSheetStyles.fineValue}>{deal.breakdown.usageRights}</Text>
              </View>
              <View style={dealSheetStyles.fineRow}>
                <Text style={dealSheetStyles.fineLabel}>Contract length</Text>
                <Text style={dealSheetStyles.fineValue}>{deal.breakdown.contractLength}</Text>
              </View>
            </View>

            {/* Commitments */}
            <View style={dealSheetStyles.section}>
              <Text style={dealSheetStyles.sectionTitle}>Your commitments</Text>
              {deal.commitments.map((c, i) => (
                <View key={i} style={dealSheetStyles.commitmentRow}>
                  <View style={dealSheetStyles.commitmentDot} />
                  <Text style={dealSheetStyles.commitmentText}>{c}</Text>
                </View>
              ))}
            </View>

            {/* AI review */}
            <View style={dealSheetStyles.section}>
              <View style={dealSheetStyles.aiHeader}>
                <View style={dealSheetStyles.aiIconWrap}>
                  <Ionicons name="sparkles" size={14} color="#FF6F3C" />
                </View>
                <Text style={dealSheetStyles.sectionTitle}>Proslync AI review</Text>
              </View>
              <View style={dealSheetStyles.aiTopRow}>
                <View>
                  <Text style={dealSheetStyles.aiFitLabel}>Fit score</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                    <Text style={dealSheetStyles.aiFitScore}>{deal.aiReview.fitScore}</Text>
                    <Text style={[dealSheetStyles.aiFitBand, { color: fit.color }]}>{fit.label}</Text>
                  </View>
                </View>
                <View style={[dealSheetStyles.aiRecPill, { borderColor: rec.color, backgroundColor: `${rec.color}1F` }]}>
                  <Text style={[dealSheetStyles.aiRecText, { color: rec.color }]}>{rec.label}</Text>
                </View>
              </View>
              <Text style={dealSheetStyles.bodyText}>{deal.aiReview.summary}</Text>
              <Text style={dealSheetStyles.subTitle}>Strengths</Text>
              {deal.aiReview.strengths.map((s, i) => (
                <View key={i} style={dealSheetStyles.aiBulletRow}>
                  <Ionicons name="add-circle" size={14} color="#34C759" />
                  <Text style={dealSheetStyles.aiBulletText}>{s}</Text>
                </View>
              ))}
              <Text style={dealSheetStyles.subTitle}>Risks</Text>
              {deal.aiReview.risks.map((r, i) => (
                <View key={i} style={dealSheetStyles.aiBulletRow}>
                  <Ionicons name="alert-circle" size={14} color="#FF6F3C" />
                  <Text style={dealSheetStyles.aiBulletText}>{r}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const dealSheetStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F1012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  handle: {
    width: 38, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBrandLogo: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBrandInitial: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerBrandName: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerDealType: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  stageRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  stageDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2,
    marginBottom: 6,
  },
  stageLabel: { fontSize: 10, letterSpacing: 0.3 },

  section: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: -0.2, marginBottom: 8 },
  subTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  bodyText: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  statCell: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  statValue: { fontSize: 14, color: '#FFF', fontWeight: '700', marginTop: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  productChip: {
    backgroundColor: 'rgba(255,111,60,0.10)',
    borderColor: 'rgba(255,111,60,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  productChipText: { color: '#FF6F3C', fontSize: 11, fontWeight: '700' },

  newsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  newsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6F3C', marginTop: 6 },
  newsHeadline: { color: '#FFF', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  newsMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },

  deliverableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  deliverableItem: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  deliverableDue: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },

  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  compType: { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },
  compAmount: { color: '#FF6F3C', fontSize: 14, fontWeight: '800' },

  fineRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  fineLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', width: 96 },
  fineValue: { flex: 1, color: '#FFF', fontSize: 12, lineHeight: 17 },

  commitmentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  commitmentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 7 },
  commitmentText: { color: '#FFF', fontSize: 13, lineHeight: 19, flex: 1 },

  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiIconWrap: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.18)',
  },
  aiTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10, gap: 12 },
  aiFitLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  aiFitScore: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  aiFitBand: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  aiRecPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aiRecText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  aiBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 5 },
  aiBulletText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 17 },
});

// ─── Deals tab content — Open marketplace + My Applications ──────

const APPLIED_DEALS_STORAGE_KEY = 'proslync:athlete:appliedDeals:v1';
const BANNER_KEY = 'proslync:profile:banner:v2';
const BANNER_KEY_LEGACY = 'proslync:profile:bannerVideo:v1';
const AVATAR_KEY = 'proslync:profile:avatar:v1';

function DealsTabContent() {
  const [subTab, setSubTab] = React.useState<'open' | 'applied'>('open');
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(APPLIED_DEALS_STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const arr = JSON.parse(raw) as string[];
          setAppliedIds(new Set(arr));
        } catch {}
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHydrated(true); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(APPLIED_DEALS_STORAGE_KEY, JSON.stringify(Array.from(appliedIds))).catch(() => {});
  }, [appliedIds, hydrated]);

  const apply = React.useCallback((id: string) => {
    setAppliedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const openDeals = React.useMemo(() => MOCK_SHARED_DEALS.filter((d) => d.network === 'open'), []);
  const myApplications = React.useMemo(() => MOCK_SHARED_DEALS.filter((d) => appliedIds.has(d.id)), [appliedIds]);

  const visible = subTab === 'open' ? openDeals : myApplications;

  return (
    <View>
      {/* Sub-tabs */}
      <View style={s.dealsSubTabs}>
        <TouchableOpacity
          style={[s.dealsSubTab, subTab === 'open' && s.dealsSubTabActive]}
          activeOpacity={0.7}
          onPress={() => setSubTab('open')}
        >
          <Text style={[s.dealsSubTabText, subTab === 'open' && s.dealsSubTabTextActive]}>
            Open · {openDeals.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.dealsSubTab, subTab === 'applied' && s.dealsSubTabActive]}
          activeOpacity={0.7}
          onPress={() => setSubTab('applied')}
        >
          <Text style={[s.dealsSubTabText, subTab === 'applied' && s.dealsSubTabTextActive]}>
            My Applications · {myApplications.length}
          </Text>
        </TouchableOpacity>
      </View>

      {visible.length === 0 ? (
        <View style={s.dealsEmpty}>
          <Ionicons
            name={subTab === 'open' ? 'briefcase-outline' : 'paper-plane-outline'}
            size={28}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={s.dealsEmptyTitle}>
            {subTab === 'open' ? 'No open deals right now' : "You haven't applied to anything yet"}
          </Text>
          <Text style={s.dealsEmptyBody}>
            {subTab === 'open'
              ? 'New marketplace deals from brands will appear here.'
              : 'Tap Apply on an open deal to start tracking it here.'}
          </Text>
        </View>
      ) : (
        <View style={s.feedList}>
          {visible.map((deal) => (
            <SharedDealCard
              key={deal.id}
              deal={deal}
              applied={appliedIds.has(deal.id)}
              onApply={() => apply(deal.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Merch tab (drops, POD apparel, signed memorabilia, digital) ─

type MerchCategory = 'all' | 'apparel' | 'signed' | 'digital';

type MerchProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: Exclude<MerchCategory, 'all'>;
  badge?: 'Limited' | 'Signed' | 'Digital' | 'POD';
  stockLine?: string;
};

const MOCK_ACTIVE_DROP = {
  name: 'KA7 Orange Crush Capsule',
  subtitle: 'Limited 500 units · Tee + hoodie + shorts + cap',
  image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80',
  endsIn: '2d 8h 41m',
};

const MOCK_MERCH: MerchProduct[] = [
  { id: 'm-1', name: 'KA7 Orange Crush Tee', price: 42, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', category: 'apparel', badge: 'Limited', stockLine: '148 of 500 left' },
  { id: 'm-2', name: '#7 Syracuse Performance Hoodie', price: 88, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80', category: 'apparel', badge: 'Limited', stockLine: '64 of 200 left' },
  { id: 'm-3', name: '"Cuse Mode" Dad Cap', price: 34, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80', category: 'apparel', badge: 'POD', stockLine: 'Print on demand' },
  { id: 'm-4', name: 'Brooklyn → Cuse Shooting Shirt', price: 48, image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80', category: 'apparel', badge: 'POD', stockLine: 'Print on demand' },
  { id: 'm-5', name: 'Game-Worn Syracuse Jersey · vs Duke', price: 1800, image: 'https://images.unsplash.com/photo-1614632537423-5e1c478e9df2?w=800&q=80', category: 'signed', badge: 'Signed', stockLine: '1 of 1 · Face ID verified' },
  { id: 'm-6', name: 'Signed Rookie-Year Basketball', price: 340, image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&q=80', category: 'signed', badge: 'Signed', stockLine: '18 left · Face ID verified' },
  { id: 'm-7', name: 'Autographed JBC MVP Photo · 11x14', price: 125, image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80', category: 'signed', badge: 'Signed', stockLine: '24 left · Face ID verified' },
  { id: 'm-8', name: 'Lock Screen Pack · Dome Nights', price: 9, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', category: 'digital', badge: 'Digital', stockLine: 'Instant delivery' },
  { id: 'm-9', name: 'Personal Cameo · 30s', price: 75, image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80', category: 'digital', badge: 'Digital', stockLine: '48h delivery' },
  { id: 'm-10', name: 'Pre-Game Hype Video', price: 25, image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80', category: 'digital', badge: 'Digital', stockLine: 'Instant delivery' },
];

function MerchTab() {
  const [filter, setFilter] = React.useState<MerchCategory>('all');
  const filtered = filter === 'all' ? MOCK_MERCH : MOCK_MERCH.filter((m) => m.category === filter);

  return (
    <View style={s.merchWrap}>
      {/* Active drop hero */}
      <View style={s.dropCard}>
        <Image source={{ uri: MOCK_ACTIVE_DROP.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={s.dropBadge}><Text style={s.dropBadgeText}>ACTIVE DROP</Text></View>
        <View style={s.dropBody}>
          <Text style={s.dropName}>{MOCK_ACTIVE_DROP.name}</Text>
          <Text style={s.dropSubtitle}>{MOCK_ACTIVE_DROP.subtitle}</Text>
          <View style={s.dropFooter}>
            <View style={s.dropCountdown}>
              <Ionicons name="time-outline" size={13} color="#FFF" />
              <Text style={s.dropCountdownText}>Ends in {MOCK_ACTIVE_DROP.endsIn}</Text>
            </View>
            <TouchableOpacity style={s.dropCta} activeOpacity={0.85}>
              <Text style={s.dropCtaText}>Shop Drop</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter pills */}
      <View style={s.merchFilters}>
        {([
          { key: 'all', label: 'All' },
          { key: 'apparel', label: 'Apparel' },
          { key: 'signed', label: 'Signed' },
          { key: 'digital', label: 'Digital' },
        ] as const).map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
              style={[s.merchFilter, active && s.merchFilterActive]}
            >
              <Text style={[s.merchFilterText, active && s.merchFilterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product grid */}
      <View style={s.merchGrid}>
        {filtered.map((p) => (
          <TouchableOpacity key={p.id} activeOpacity={0.85} style={s.merchItem}>
            <View style={s.merchImageWrap}>
              <Image source={{ uri: p.image }} style={s.merchImage} resizeMode="cover" />
              {p.badge ? (
                <View style={[s.merchBadge, p.badge === 'Signed' && s.merchBadgeSigned, p.badge === 'Limited' && s.merchBadgeLimited, p.badge === 'Digital' && s.merchBadgeDigital]}>
                  {p.badge === 'Signed' ? <Ionicons name="checkmark-circle" size={11} color="#FFF" /> : null}
                  {p.badge === 'Limited' ? <Ionicons name="flame" size={11} color="#FFF" /> : null}
                  {p.badge === 'Digital' ? <Ionicons name="flash" size={11} color="#FFF" /> : null}
                  <Text style={s.merchBadgeText}>{p.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.merchName} numberOfLines={1}>{p.name}</Text>
            <View style={s.merchFooter}>
              <Text style={s.merchPrice}>${p.price}</Text>
              {p.stockLine ? <Text style={s.merchStock} numberOfLines={1}>{p.stockLine}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Media tab (press, news, highlights, podcasts) ──────────────

type MediaSource = 'espn' | 'the-athletic' | 'bleacher-report' | 'google-news' | 'youtube' | 'x' | 'spotify' | 'apple-podcasts';

type MediaItem = {
  id: string;
  source: MediaSource;
  headline: string;
  snippet: string;
  thumbnail: string;
  timeAgo: string;
  type: 'article' | 'video' | 'podcast' | 'post';
  duration?: string;
};

const MOCK_MEDIA: MediaItem[] = [
  {
    id: 'me-1',
    source: 'espn',
    headline: 'Kiyan Anthony drops 19 in first career start as Syracuse tops Delaware State',
    snippet: '"The poise is wild for a freshman. He played like he\'d been there before." — Coach Red Autry on Anthony\'s 19/3/4 debut start at the Dome.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    timeAgo: '3h ago',
    type: 'article',
  },
  {
    id: 'me-2',
    source: 'youtube',
    headline: 'HIGHLIGHTS: Kiyan Anthony — 18 PTS at Drexel',
    snippet: 'Every bucket from Anthony\'s team-high 18 in Philly. The stepback is problem.',
    thumbnail: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80',
    timeAgo: '5h ago',
    type: 'video',
    duration: '3:48',
  },
  {
    id: 'me-3',
    source: 'the-athletic',
    headline: 'Why Syracuse\'s backcourt is ahead of schedule — and Kiyan Anthony is the reason',
    snippet: 'The son of a Knicks legend is finding his own lane in Central NY. Inside the freshman\'s adjustment to ACC speed.',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
    timeAgo: '1d ago',
    type: 'article',
  },
  {
    id: 'me-4',
    source: 'spotify',
    headline: 'Roundball Rock — Freshman Watch: Kiyan Anthony',
    snippet: '"Watch him at the Iverson Classic — that 25-point night wasn\'t a fluke." Segment starts at 28:04.',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&q=80',
    timeAgo: '2d ago',
    type: 'podcast',
    duration: '1h 42m',
  },
  {
    id: 'me-5',
    source: 'bleacher-report',
    headline: 'ACC Freshmen of the Year — Midseason Rankings',
    snippet: 'Kiyan Anthony lands at #3 overall in the ACC frosh race. "Shot-making you can build an offense around."',
    thumbnail: 'https://images.unsplash.com/photo-1509027572446-af8401acfdc3?w=1200&q=80',
    timeAgo: '3d ago',
    type: 'article',
  },
  {
    id: 'me-6',
    source: 'x',
    headline: 'Trending: #CuseMode #KiyanAnthony',
    snippet: '8.7K posts in the last 24h. Top clip: the top-of-the-key pull-up vs Miami — 1.4M views.',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80',
    timeAgo: '4h ago',
    type: 'post',
  },
  {
    id: 'me-7',
    source: 'google-news',
    headline: 'New York Post: From Harlem to the Hill — Kiyan\'s freshman year',
    snippet: '"Brooklyn bred, Harlem raised, and carrying more than a last name into Syracuse orange."',
    thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1200&q=80',
    timeAgo: '5d ago',
    type: 'article',
  },
];

const MEDIA_META: Record<MediaSource, { label: string; color: string; initial: string }> = {
  espn: { label: 'ESPN', color: '#D00000', initial: 'E' },
  'the-athletic': { label: 'The Athletic', color: '#1C1C1C', initial: 'A' },
  'bleacher-report': { label: 'Bleacher Report', color: '#000000', initial: 'B' },
  'google-news': { label: 'Google News', color: '#4285F4', initial: 'G' },
  youtube: { label: 'YouTube', color: '#FF0000', initial: 'Y' },
  x: { label: 'X', color: '#000000', initial: 'X' },
  spotify: { label: 'Spotify', color: '#1DB954', initial: 'S' },
  'apple-podcasts': { label: 'Apple Podcasts', color: '#8C52FF', initial: 'P' },
};

function MediaCard({ item }: { item: MediaItem }) {
  const meta = MEDIA_META[item.source];
  const isPlayable = item.type === 'video' || item.type === 'podcast';

  return (
    <View style={s.mediaCard}>
      {/* Header */}
      <View style={s.mediaHeader}>
        <View style={[s.mediaSourceLogo, { backgroundColor: meta.color }]}>
          <Text style={s.mediaSourceInitial}>{meta.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.mediaSourceLabel}>{meta.label}</Text>
          <Text style={s.mediaTimeAgo}>{item.timeAgo}</Text>
        </View>
        {item.type === 'video' ? <Ionicons name="videocam" size={14} color="rgba(255,255,255,0.55)" /> : null}
        {item.type === 'podcast' ? <Ionicons name="mic" size={14} color="rgba(255,255,255,0.55)" /> : null}
      </View>

      {/* Thumbnail */}
      <View style={s.mediaThumbWrap}>
        <Image source={{ uri: item.thumbnail }} style={s.mediaThumb} resizeMode="cover" />
        {isPlayable ? (
          <View style={s.mediaPlayBadge}>
            <Ionicons name="play" size={20} color="#FFF" />
          </View>
        ) : null}
        {item.duration ? (
          <View style={s.mediaDurationPill}>
            <Text style={s.mediaDurationText}>{item.duration}</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={s.mediaBody}>
        <Text style={s.mediaHeadline}>{item.headline}</Text>
        <Text style={s.mediaSnippet} numberOfLines={3}>{item.snippet}</Text>
      </View>

      {/* Actions */}
      <View style={s.mediaActions}>
        <TouchableOpacity style={s.mediaBtnPrimary} activeOpacity={0.75}>
          <Text style={s.mediaBtnPrimaryText}>Read Full Story</Text>
          <Ionicons name="arrow-up-outline" size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
        <TouchableOpacity style={s.mediaBtnSecondary} activeOpacity={0.75}>
          <Ionicons name="share-outline" size={14} color="#FFF" />
          <Text style={s.mediaBtnSecondaryText}>Share to Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Awards tab (ESPN Award Watch + stats + timeline) ───────────

type AwardStatus = 'in-contention' | 'watch-list' | 'eligible' | 'won';

type AwardEntry = {
  id: string;
  name: string;
  org: string; // ESPN / All-American / Pac-12 etc.
  status: AwardStatus;
  rank?: string; // e.g. "Top 10 semifinalist"
  season?: string; // e.g. "2025-26"
  wonAt?: string; // e.g. "Dec 12, 2025"
};

const AWARD_TRACKER: AwardEntry[] = [
  { id: 'aw-1', name: 'ACC Freshman of the Year', org: 'ACC', status: 'in-contention', rank: '#3 conference leader', season: '2024-25' },
  { id: 'aw-2', name: 'Wayman Tisdale Award', org: 'USBWA', status: 'watch-list', rank: '#12 watch list', season: '2024-25' },
  { id: 'aw-3', name: 'Jerry West Award (Top SG)', org: 'NABC', status: 'in-contention', rank: 'Top 15 semifinalist', season: '2024-25' },
  { id: 'aw-4', name: 'All-ACC Freshman Team', org: 'ACC', status: 'eligible', season: '2024-25' },
];

const AWARD_TIMELINE: AwardEntry[] = [
  { id: 'ht-1', name: 'McDonald\'s All-American Nominee', org: 'McDonald\'s / USA Today', status: 'won', wonAt: 'Jan 12, 2024' },
  { id: 'ht-2', name: 'Allen Iverson Classic — People\'s Choice', org: 'Iverson Classic', status: 'won', wonAt: 'May 4, 2024' },
  { id: 'ht-3', name: 'Jordan Brand Classic — MVP', org: 'Jordan Brand', status: 'won', wonAt: 'Apr 19, 2024' },
  { id: 'ht-4', name: 'ACC Freshman of the Week', org: 'ACC', status: 'won', wonAt: 'Dec 9, 2024' },
];

type PeerStat = {
  label: string;
  self: string;
  avg: string;
  best: string;
  delta: string; // "+12%" or "—"
};

const PEER_STATS: PeerStat[] = [
  { label: 'Points / game', self: '14.2', avg: '9.8', best: '18.4', delta: '+45%' },
  { label: 'FG %', self: '46.1%', avg: '42.8%', best: '51.2%', delta: '+8%' },
  { label: '3PT %', self: '36.4%', avg: '32.7%', best: '41.8%', delta: '+11%' },
  { label: 'Assists / game', self: '3.1', avg: '2.4', best: '4.8', delta: '+29%' },
  { label: 'Minutes / game', self: '28.4', avg: '24.6', best: '32.1', delta: '+15%' },
];

function AwardsTab() {
  return (
    <View style={s.awardsWrap}>
      {/* Brand Impact Score */}
      <View style={s.impactCard}>
        <View style={s.impactHeader}>
          <Ionicons name="flash" size={14} color="#FF6F3C" />
          <Text style={s.impactLabel}>BRAND IMPACT SCORE</Text>
        </View>
        <View style={s.impactBody}>
          <Text style={s.impactNumber}>87</Text>
          <View style={s.impactDelta}>
            <Ionicons name="arrow-up" size={11} color="#34C759" />
            <Text style={s.impactDeltaText}>+6 this week</Text>
          </View>
        </View>
        <Text style={s.impactSub}>Recalculated after the ACC Freshman of the Week nod.  4 brands in your match queue have been notified.</Text>
      </View>

      {/* Award Tracker */}
      <View style={s.awardSection}>
        <Text style={s.awardSectionTitle}>Award Watch</Text>
        <Text style={s.awardSectionSub}>Live eligibility, pulled from ESPN and the ACC</Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {AWARD_TRACKER.map((a) => <AwardRow key={a.id} entry={a} />)}
        </View>
      </View>

      {/* Comparison Stats */}
      <View style={s.awardSection}>
        <Text style={s.awardSectionTitle}>Position Comparison</Text>
        <Text style={s.awardSectionSub}>You vs ACC freshmen guards · 2024-25 season</Text>
        <View style={s.statsTable}>
          <View style={s.statsHeader}>
            <Text style={[s.statsHeaderText, { flex: 2 }]}>Stat</Text>
            <Text style={[s.statsHeaderText, { flex: 1, textAlign: 'right' }]}>You</Text>
            <Text style={[s.statsHeaderText, { flex: 1, textAlign: 'right' }]}>Avg</Text>
            <Text style={[s.statsHeaderText, { flex: 1, textAlign: 'right' }]}>Best</Text>
          </View>
          {PEER_STATS.map((stat, i) => {
            const positive = stat.delta.startsWith('+') || stat.delta.startsWith('-') && stat.label.toLowerCase().includes('drop');
            return (
              <View key={stat.label} style={[s.statsRow, i === PEER_STATS.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 2 }}>
                  <Text style={s.statsLabel}>{stat.label}</Text>
                  <Text style={[s.statsDelta, { color: positive ? '#34C759' : 'rgba(255,255,255,0.55)' }]}>{stat.delta} vs avg</Text>
                </View>
                <Text style={[s.statsValueSelf, { flex: 1, textAlign: 'right' }]}>{stat.self}</Text>
                <Text style={[s.statsValue, { flex: 1, textAlign: 'right' }]}>{stat.avg}</Text>
                <Text style={[s.statsValue, { flex: 1, textAlign: 'right' }]}>{stat.best}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Timeline */}
      <View style={s.awardSection}>
        <Text style={s.awardSectionTitle}>Award Timeline</Text>
        <Text style={s.awardSectionSub}>Honors received since joining Proslync</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {AWARD_TIMELINE.map((a, i) => (
            <View key={a.id} style={s.timelineRow}>
              <View style={s.timelineDotCol}>
                <View style={s.timelineDot} />
                {i < AWARD_TIMELINE.length - 1 ? <View style={s.timelineLine} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 10 }}>
                <Text style={s.timelineName}>{a.name}</Text>
                <Text style={s.timelineMeta}>{a.org}  ·  {a.wonAt}</Text>
              </View>
              <Ionicons name="trophy" size={16} color="#FF6F3C" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function AwardRow({ entry }: { entry: AwardEntry }) {
  const statusMeta: Record<AwardStatus, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    'in-contention': { label: 'In Contention', color: '#FF6F3C', icon: 'flame' },
    'watch-list': { label: 'Watch List', color: '#F5B316', icon: 'eye' },
    'eligible': { label: 'Eligible', color: 'rgba(255,255,255,0.55)', icon: 'checkmark-circle-outline' },
    'won': { label: 'Won', color: '#34C759', icon: 'trophy' },
  };
  const m = statusMeta[entry.status];

  return (
    <View style={s.awardRow}>
      <View style={s.awardRowTop}>
        <Text style={s.awardName} numberOfLines={1}>{entry.name}</Text>
        <View style={[s.awardStatusPill, { borderColor: m.color + '55' }]}>
          <Ionicons name={m.icon} size={10} color={m.color} />
          <Text style={[s.awardStatusText, { color: m.color }]}>{m.label}</Text>
        </View>
      </View>
      <Text style={s.awardMeta}>
        {entry.org}  ·  {entry.season}
        {entry.rank ? `  ·  ${entry.rank}` : ''}
      </Text>
    </View>
  );
}

// ─── Main Profile Screen ────────────────────────────────────────

export default function ProfileScreen() {
  const { role } = useRole();
  if (role === 'coach') return <CoachProfile />;
  if (role === 'agent') return <AgentProfile />;
  if (role === 'brand') return <BrandProfile />;
  if (role === 'fan') return <FanProfile />;
  if (role === 'school') return <SchoolProfile />;
  if (role === 'nilManager') return <SchoolProfile />;
  if (role === 'collective') return <CollectiveProfile />;
  return <PlayerProfileScreen />;
}

function PlayerProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user, isLoading, logout } = useAuth();
  const { colors: _colors } = useAppTheme();
  const colors = { ..._colors, text: '#FFF', textSecondary: 'rgba(255,255,255,0.65)', textTertiary: 'rgba(255,255,255,0.4)', background: '#000', border: 'rgba(255,255,255,0.10)' };
  const [followersSheetVisible, setFollowersSheetVisible] =
    React.useState(false);
  const [followersSheetTab, setFollowersSheetTab] = React.useState<
    "followers" | "following"
  >("followers");
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
  const [profileTab, setProfileTab] = React.useState<'kit' | 'posts' | 'merch'>('kit');
  const [_expandedBio, _setExpandedBio] = React.useState<Set<string>>(new Set());
  const _toggleBio = React.useCallback((key: string) => {
    _setExpandedBio((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const _BIO_SECTIONS = React.useMemo(
    () => [
      {
        key: 'freshman',
        title: 'Freshman Year',
        body: "Syracuse debut: 15 pts, 3 reb, 3 ast vs Binghamton. First start vs Delaware State for 19 pts, 3 reb, 4 ast on 8-of-11 shooting. Team-high 18 at Drexel. Double-digit outings vs Northeastern (18), Miami (13), Georgia Tech (11), Houston (10) and UNC (10). Played 18 minutes at #3 Duke. Missed the final two games with a lower-body injury.",
      },
      {
        key: 'iverson',
        title: 'Allen Iverson Classic',
        body: "People's Choice Award — 25 pts in 21 minutes. Shot 9-of-15 from the field and a perfect 6-of-6 from the line.",
      },
      {
        key: 'jordan',
        title: 'Jordan Brand Classic',
        body: 'MVP as Team Air beat Team Flight 141-124. Finished with 26 pts on 11-of-15 shooting plus 5 rebounds in 20 minutes.',
      },
      {
        key: 'lulu',
        title: 'Long Island Lutheran',
        body: "Transferred for junior year. Averaged 10.3 pts / 2.4 ast in 2023-24 before a senior-year ramp. NBPA Top 100 Camp standout (28.5 ppg), Nike EYBL with Team Melo (19.6 ppg / 4.6 rpg). Led the Crusaders to a 24-8 record and a Throne National Championship (event MVP, 17.7 ppg). Final rankings: No. 36 ESPN Top 100, No. 32 247Sports, No. 48 Rivals.",
      },
      {
        key: 'ctk',
        title: 'Christ The King HS',
        body: 'Played his freshman and sophomore years at Christ the King before the LuHi transfer.',
      },
    ],
    [],
  );

  const TAB_KEYS = React.useMemo(
    () => ['kit', 'posts', 'merch'] as const,
    []
  );

  // Animated sliding knob — same pattern as the dashboard top pill
  const profileTabIndex = Math.max(0, TAB_KEYS.indexOf(profileTab));
  const profilePillWidth = useSharedValue(0);
  const animatedProfileTabIndex = useSharedValue(profileTabIndex);
  React.useEffect(() => {
    animatedProfileTabIndex.value = withTiming(profileTabIndex, { duration: 180 });
  }, [profileTabIndex, animatedProfileTabIndex]);
  const profileKnobStyle = useAnimatedStyle(() => {
    const segW = profilePillWidth.value / Math.max(TAB_KEYS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedProfileTabIndex.value * segW + inset }],
    };
  });

  // Floating Kit/Posts/Merch pill — shrinks on scroll-down, grows on scroll-up
  // (mirrors the native bottom tab bar's onScrollDown minimize behavior).
  const tabsLastScrollY = useSharedValue(0);
  const tabsCollapsed = useSharedValue(0);
  const onProfileScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - tabsLastScrollY.value;
      if (dy > 1.5 && y > 30) {
        tabsCollapsed.value = withTiming(1, { duration: 200 });
      } else if (dy < -1.5) {
        tabsCollapsed.value = withTiming(0, { duration: 200 });
      }
      tabsLastScrollY.value = y;
    },
  });
  const floatingTabsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(tabsCollapsed.value, [0, 1], [1, 0.8]) }],
    opacity: interpolate(tabsCollapsed.value, [0, 1], [1, 0.85]),
  }));
  const [showAvatarViewer, setShowAvatarViewer] = React.useState(false);
  const closeAvatarViewer = React.useCallback(() => setShowAvatarViewer(false), []);
  const lastTapRef = React.useRef<number>(0);

  const createMenuOptions: ActionSheetOption[] = React.useMemo(
    () => [
      {
        label: "Create Post",
        icon: "add-circle-outline",
        onPress: () => router.push("/create-post"),
      },
    ],
    [router],
  );

  const {
    posts: userPosts,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useUserFeed(user?.id);

  const {
    totalFollowers: followerCount,
    refetch: refetchFollowers,
  } = useUserFollowers(user?.id);

  const {
    totalFollowing: followingCount,
    refetch: refetchFollowing,
  } = useUserFollowing(user?.id);

  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([
        refetchPosts(),
        refetchFollowers(),
        refetchFollowing(),
      ]);
    },
    tintColor: "#1a1a1a",
  });

  const [localAvatar, setLocalAvatar] = React.useState<string | null>(null);
  // Re-read on every stack focus (not just mount) so changes made in the
  // edit-profile screen show up when the user navigates back. This is stack
  // focus, not PagerView tab visibility — safe per the tab-navigation rules.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const v = await AsyncStorage.getItem(AVATAR_KEY);
          if (cancelled) return;
          if (v) {
            const healed = await healLocalMediaUri(v);
            if (healed) {
              if (healed !== v) AsyncStorage.setItem(AVATAR_KEY, healed).catch(() => {});
              if (!cancelled) setLocalAvatar(healed);
            } else {
              AsyncStorage.removeItem(AVATAR_KEY).catch(() => {});
              if (!cancelled) setLocalAvatar(null);
            }
          } else {
            if (!cancelled) setLocalAvatar(null);
          }
        } catch {}
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const { username, avatarSource, initial } = React.useMemo(
    () => ({
      username: "kiyan",
      avatarSource: resolveAvatarSource(
        localAvatar,
        user?.avatar?.url,
        require('@/assets/images/kiyan-avatar.png'),
      ),
      initial: "K",
    }),
    [user, localAvatar],
  );

  // Inline-editable identity fields. Defaults are the Kiyan persona.
  const [isEditing, setIsEditing] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // Persistent custom banner (image or video). v2 stores { uri, type }; v1
  // stored a bare video URI string and is migrated on first hydration.
  const [banner, setBanner] = React.useState<LocalMedia | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let next: LocalMedia | null = null;
        const v2 = await AsyncStorage.getItem(BANNER_KEY);
        if (v2) {
          next = JSON.parse(v2);
        } else {
          const v1 = await AsyncStorage.getItem(BANNER_KEY_LEGACY);
          if (v1) {
            next = { uri: v1, type: 'video' };
          }
        }
        // Heal stale URIs from iOS container rotation before setting state.
        if (next) {
          const healed = await healLocalMediaUri(next.uri);
          if (!healed) {
            next = null;
          } else if (healed !== next.uri) {
            next = { ...next, uri: healed };
          }
        }
        if (!cancelled && next) setBanner(next);
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setBannerHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (banner) {
      AsyncStorage.setItem(BANNER_KEY, JSON.stringify(banner))
        .then(() => AsyncStorage.removeItem(BANNER_KEY_LEGACY))
        .catch(() => {});
    } else {
      AsyncStorage.removeItem(BANNER_KEY).catch(() => {});
      AsyncStorage.removeItem(BANNER_KEY_LEGACY).catch(() => {});
    }
  }, [banner, bannerHydrated]);

  const bannerMedia = React.useMemo(
    () => resolveSlotMedia('profile-banner', banner),
    [banner],
  );
  const bannerVideoUri =
    bannerMedia.kind !== 'none' && bannerMedia.type === 'video' ? bannerMedia.uri : null;

  const bannerPlayer = useVideoPlayer(bannerVideoUri, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Keep banner video playing through re-renders / focus changes / hot reloads.
  React.useEffect(() => {
    if (!bannerPlayer || !bannerVideoUri) return;
    bannerPlayer.play();
    const sub = bannerPlayer.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) {
        try { bannerPlayer.play(); } catch {}
      }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [bannerPlayer, bannerVideoUri]);

  const pickBanner = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to pick media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      const persistedUri = await persistLocalMedia(asset.uri, 'profile-banner', type);
      setBanner({ uri: persistedUri, type });
    }
  }, []);

  const removeBanner = React.useCallback(() => {
    setBanner(null);
  }, []);

  const [displayName, setDisplayName] = React.useState("Kiyan Anthony");
  const [metaPrimary, setMetaPrimary] = React.useState("Freshman Guard at Syracuse");
  const [metaSecondary, setMetaSecondary] = React.useState("Brooklyn, New York");
  const bio = user?.bio || "";

  const avatarTapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (avatarTapTimer.current) clearTimeout(avatarTapTimer.current);
    };
  }, []);

  const handleAvatarTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — no-op (account switcher removed)
      if (avatarTapTimer.current) clearTimeout(avatarTapTimer.current);
    } else {
      // Single tap → open avatar viewer (delayed to detect double tap)
      avatarTapTimer.current = setTimeout(() => {
        setShowAvatarViewer(true);
      }, 300);
    }
    lastTapRef.current = now;
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out @${username} on Status!`,
        url: `status://user/${username}`,
      });
    } catch {}
  };

  if (isLoading) {
    return (
      <SwipeableTabView>
        <View style={[s.container, s.centerContent]}>
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      </SwipeableTabView>
    );
  }

  return (
    <SwipeableTabView>
      <View style={[s.container, { backgroundColor: '#000' }]}>


        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          onScroll={onProfileScroll}
          scrollEventThrottle={16}
        >
          {/* Banner — cover image that fades into the page bg, now scrolls with the content */}
          <View style={[s.bannerWrap, { height: insets.top + 290, backgroundColor: '#000' }]} pointerEvents="none">
            {bannerVideoUri ? (
              <VideoView
                player={bannerPlayer}
                style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
                contentFit="cover"
                nativeControls={false}
              />
            ) : (
              <Image
                source={
                  bannerMedia.kind === 'local'
                    ? { uri: bannerMedia.uri }
                    : bannerMedia.kind === 'curated-image'
                      ? bannerMedia.source
                      : require('@/assets/images/kiyan-banner.png')
                }
                style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
                resizeMode="cover"
              />
            )}
            {/* Subtle full-banner dark tint */}
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]}
              pointerEvents="none"
            />
          </View>
          {/* Section tabs now float above the bottom nav (rendered after the ScrollView). */}
          <View style={{ height: 14 }} />

          {/* Storefront CTAs — Support + Work with me (hidden in edit mode) */}
          {!isEditing && <ProfileActions athleteName="Kiyan" />}

          {/* Tab content */}
          {/* LEGACY_TABS: 'about', 'deals', 'media' are unmounted (charter §B). */}
          {/* JSX preserved below; branches unreachable via TAB_KEYS. Not deleted. */}
          <View style={s.igGridSection}>
            {profileTab === 'kit' && (
              <View style={s.aboutSection}>
                <MediaKitCard onViewPosts={() => setProfileTab('posts')} />
                {/* LEGACY_TABS — bio accordions unmounted; JSX kept for reference.
                {<View style={s.aboutBlockBare}>
                  BIO_SECTIONS accordion (background/freshman year etc.)
                </View>}
                {<View style={s.aboutBlockBare}>
                  philanthropy/personal/academic accordion
                </View>} */}
              </View>
            )}

            {profileTab !== 'kit' && <View style={{ height: 15 }} />}

            {profileTab === 'posts' && (
              <View style={s.feedList}>
                {MOCK_SOCIAL_POSTS.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                    athleteName={displayName}
                    athleteMeta="Freshman Guard  ·  Syracuse"
                    avatarSource={avatarSource}
                  />
                ))}
              </View>
            )}

            {/* LEGACY_TABS — 'deals' tab unmounted (charter §B, unreachable via TAB_KEYS) */}
            {(profileTab as string) === 'deals' && <DealsTabContent />}

            {profileTab === 'merch' && <MerchTab />}

            {/* LEGACY_TABS — 'media' tab unmounted (charter §B, unreachable via TAB_KEYS) */}
            {(profileTab as string) === 'media' && (
              <View>
                <AwardsTab />
                {/* Press hero summary — matches dashboard Stats aesthetic */}
                <View style={s.mediaHeroCard}>
                  <View style={s.mediaHeroLeft}>
                    <View style={s.mediaHeroIconWrap}>
                      <Ionicons name="newspaper" size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.mediaHeroName}>Press</Text>
                      <View style={s.mediaHeroSubRow}>
                        <Ionicons name="flame" size={14} color="#FF6F3C" />
                        <Text style={s.mediaHeroSub}>
                          {MOCK_MEDIA.length} stories · across {new Set(MOCK_MEDIA.map((m) => m.source)).size} outlets
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={s.feedList}>
                  {MOCK_MEDIA.map((m) => <MediaCard key={m.id} item={m} />)}
                </View>
              </View>
            )}
          </View>
        </Animated.ScrollView>

        {/* Floating Kit / Posts / Merch tabs — liquid glass, hovers above the
            bottom nav, shrinks on scroll-down and grows back on scroll-up */}
        <Animated.View
          style={[s.floatingTabsWrap, { bottom: insets.bottom + 50 }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[s.floatingPill, floatingTabsStyle]}
            onLayout={(e) => {
              profilePillWidth.value = e.nativeEvent.layout.width;
            }}
          >
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 22 }]}
              pointerEvents="none"
            />
            <View style={s.tabsGlassLayer} pointerEvents="none">
              <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
              {isLiquidGlassSupported && (
                <LiquidGlassView
                  effect="regular"
                  tintColor="rgba(255,255,255,0.10)"
                  style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                />
              )}
            </View>
            <Animated.View style={[s.tabKnob, profileKnobStyle]} pointerEvents="none">
              {isLiquidGlassSupported ? (
                <LiquidGlassView
                  effect="regular"
                  tintColor="rgba(255,255,255,0.20)"
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
              ) : null}
            </Animated.View>
            {TAB_KEYS.map((key) => {
              const isActive = profileTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={s.tabSegment}
                  onPress={() => setProfileTab(key)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[s.tabPillText, isActive && s.tabPillTextActive]} numberOfLines={1}>
                    {key[0].toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Animated.View>

        {/* Followers Sheet */}
        {user?.id && (
          <FollowersSheet
            visible={followersSheetVisible}
            onClose={() => setFollowersSheetVisible(false)}
            initialTab={followersSheetTab}
            userId={user.id}
            followersCount={followerCount}
            followingCount={followingCount}
            currentUserId={user.id}
          />
        )}

        <ActionSheet
          visible={showCreateMenu}
          onClose={() => setShowCreateMenu(false)}
          options={createMenuOptions}
        />

        {/* Avatar Viewer */}
        <Modal
          visible={showAvatarViewer}
          transparent
          animationType="fade"
          onRequestClose={closeAvatarViewer}
        >
          <TouchableOpacity
            style={s.avatarViewerOverlay}
            activeOpacity={1}
            onPress={closeAvatarViewer}
          >
            <View style={s.avatarViewerContainer}>
              <Image
                source={avatarSource}
                style={s.avatarViewerImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={s.avatarViewerClose}
              onPress={closeAvatarViewer}
              accessibilityLabel="Close photo"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Bottom fade — gives the toolbar glass something to refract */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
          locations={[0, 0.5, 1]}
          style={[s.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
          pointerEvents="none"
        />

        {/* Top-left floating profile pill — avatar + hamburger (matches dashboard) */}
        <Pressable
          style={[s.topLeftProfilePill, { top: insets.top + 8 }]}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={s.topLeftProfilePillGlass} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
          </View>
          <Image
            source={avatarSource}
            style={s.topLeftProfilePillAvatar}
          />
          <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        onEditProfile={() => setIsEditing((v) => !v)}
        onGoLive={() => setShowCreateMenu(true)}
        isEditing={isEditing}
        onChangeBanner={pickBanner}
        onRemoveBanner={removeBanner}
        hasCustomBanner={!!banner}
      />
    </SwipeableTabView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const AVATAR_SIZE = 100;
const AVATAR_RADIUS = 24;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Instagram-style layout
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  scrollDim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 140, zIndex: 9 },
  topBarGlassCircle: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarUsername: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: -180,
    marginBottom: 8,
    marginHorizontal: 14,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  profilePillGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    overflow: 'hidden',
  },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#111' },
  bannerName: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 44,
    color: '#FFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  igAvatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: '#000' },
  rightCol: { flex: 1, marginLeft: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  statCol: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bioSection: { paddingHorizontal: 16, paddingBottom: 12 },
  igName: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  igBio: { fontSize: 14, color: '#FFF', lineHeight: 20, marginTop: 2 },
  igActionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  igBtn: { height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center' },
  igBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  tabsRow: { flexDirection: 'row', marginTop: -34, marginBottom: 10, paddingHorizontal: 16 },
  // Floating section-tab pill that hovers above the bottom nav.
  floatingTabsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingPill: {
    width: 240,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  tabsGlassLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabPillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: -0.1 },
  tabPillTextActive: { color: '#FFF', fontWeight: '800' },
  metaLine: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: -0.1, lineHeight: 18 },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },
  editableField: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,111,60,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  topLeftProfilePill: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
    zIndex: 100,
  },
  topLeftProfilePillGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  topLeftProfilePillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  bottomToolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 100,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarLive: {},
  toolbarLiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toolbarPillActive: {},
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  // Aggregated social feed
  feedList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, gap: 14 },

  // Deals sub-tabs (Open · My Applications)
  dealsSubTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 8,
  },
  dealsSubTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  dealsSubTabActive: {
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.45)',
  },
  dealsSubTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.2,
  },
  dealsSubTabTextActive: {
    color: '#FF6F3C',
  },
  dealsEmpty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  dealsEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 8,
    textAlign: 'center',
  },
  dealsEmptyBody: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 17,
  },
  socialCard: { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden' },
  socialHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 },
  socialAvatar: { width: 36, height: 36, borderRadius: 18 },
  socialName: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  socialMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  socialPlatformChip: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  socialMediaWrap: { width: '100%', aspectRatio: 1.2, backgroundColor: '#111' },
  socialMedia: { width: '100%', height: '100%' },
  socialPlayBadge: { position: 'absolute', top: '50%', left: '50%', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.55)', marginLeft: -24, marginTop: -24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  socialBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 6 },
  socialCaption: { fontSize: 14, color: '#FFF', lineHeight: 20, letterSpacing: -0.1 },
  socialTags: { fontSize: 13, color: '#FF6F3C', fontWeight: '500', letterSpacing: -0.1 },
  socialActions: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  socialAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socialActionText: { fontSize: 13, color: '#FFF', fontWeight: '500' },
  socialSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
  socialSourceText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: -0.05 },

  // Shared deals cards — glass / white / black design language
  dealCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 16, overflow: 'hidden', padding: 16, gap: 14 },
  dealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealBrandLogo: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dealBrandInitial: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  dealBrandName: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  dealTypeText: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, letterSpacing: -0.1 },
  dealNetworkBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  dealNetworkDot: { width: 6, height: 6, borderRadius: 3 },
  dealNetworkText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, color: '#FFF' },
  dealChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dealChip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)' },
  dealChipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' },
  dealChipValue: { fontSize: 13, color: '#FFF', fontWeight: '600', letterSpacing: -0.1 },
  dealQuoteBlock: { gap: 10, paddingTop: 2 },
  dealQuoteText: { fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 20, letterSpacing: -0.1 },
  dealSharedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dealSharerAvatar: { width: 22, height: 22, borderRadius: 11 },
  dealSharerMeta: { fontSize: 12, letterSpacing: -0.1, flex: 1 },
  dealActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  dealBtn: { flex: 1, height: 38, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dealBtnPrimary: { flex: 1.2, borderColor: 'rgba(255,111,60,0.4)', backgroundColor: 'rgba(255,111,60,0.12)' },
  dealBtnActive: { borderColor: 'rgba(52,199,89,0.4)', backgroundColor: 'rgba(52,199,89,0.12)' },
  dealBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  dealBtnIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  // Merch tab
  merchWrap: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 14 },
  dropCard: { height: 180, borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  dropBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FF6F3C' },
  dropBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  dropBody: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  dropName: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 },
  dropSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  dropFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  dropCountdown: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropCountdownText: { fontSize: 12, fontWeight: '600', color: '#FFF', letterSpacing: -0.1 },
  dropCta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FF6F3C' },
  dropCtaText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  merchFilters: { flexDirection: 'row', gap: 8, marginTop: 2 },
  merchFilter: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  merchFilterActive: { backgroundColor: '#FF6F3C', borderColor: '#FF6F3C' },
  merchFilterText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  merchFilterTextActive: { color: '#FFF' },
  merchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  merchItem: { width: '48.5%', gap: 6 },
  merchImageWrap: { aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' },
  merchImage: { width: '100%', height: '100%' },
  merchBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: '#FF6F3C' },
  merchBadgeSigned: { backgroundColor: '#34C759' },
  merchBadgeLimited: { backgroundColor: '#FF6F3C' },
  merchBadgeDigital: { backgroundColor: '#5856D6' },
  merchBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  merchName: { fontSize: 13, fontWeight: '600', color: '#FFF', letterSpacing: -0.1 },
  merchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  merchPrice: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  merchStock: { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: -0.05, flex: 1, textAlign: 'right' },

  // Media tab
  mediaHeroCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mediaHeroLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mediaHeroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F3C',
  },
  mediaHeroName: { color: '#FFF', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  mediaHeroSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  mediaHeroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', flex: 1 },
  mediaCard: { backgroundColor: '#1C1C1E', borderRadius: 16, overflow: 'hidden' },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 },
  mediaSourceLogo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mediaSourceInitial: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  mediaSourceLabel: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  mediaTimeAgo: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  mediaThumbWrap: { width: '100%', aspectRatio: 1.6, backgroundColor: '#0A0A0A', marginTop: 4 },
  mediaThumb: { width: '100%', height: '100%' },
  mediaPlayBadge: { position: 'absolute', top: '50%', left: '50%', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', marginLeft: -24, marginTop: -24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  mediaDurationPill: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  mediaDurationText: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },
  mediaBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 6 },
  mediaHeadline: { fontSize: 15, fontWeight: '700', color: '#FFF', lineHeight: 20, letterSpacing: -0.2 },
  mediaSnippet: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 18, letterSpacing: -0.1 },
  mediaActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 },
  mediaBtnPrimary: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 12, backgroundColor: '#FF6F3C' },
  mediaBtnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  mediaBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  mediaBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#FFF', letterSpacing: -0.1 },

  // Awards tab
  awardsWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 18 },
  impactCard: { backgroundColor: 'rgba(255,111,60,0.08)', borderWidth: 1, borderColor: 'rgba(255,111,60,0.25)', borderRadius: 14, padding: 14, gap: 8 },
  impactHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  impactLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#FF6F3C' },
  impactBody: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  impactNumber: { fontSize: 48, fontWeight: '800', color: '#FFF', letterSpacing: -1.5 },
  impactDelta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  impactDeltaText: { fontSize: 12, fontWeight: '700', color: '#34C759' },
  impactSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17, letterSpacing: -0.1 },
  awardSection: { gap: 2 },
  awardSectionTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  awardSectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  awardRow: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, gap: 4 },
  awardRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  awardName: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.15, flex: 1 },
  awardStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1 },
  awardStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  awardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  statsTable: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, marginTop: 10, overflow: 'hidden' },
  statsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  statsHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  statsLabel: { fontSize: 13, fontWeight: '600', color: '#FFF', letterSpacing: -0.1 },
  statsDelta: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  statsValue: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontVariant: ['tabular-nums'], letterSpacing: -0.2 },
  statsValueSelf: { fontSize: 14, color: '#FF6F3C', fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineDotCol: { alignItems: 'center', width: 14, paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6F3C' },
  timelineLine: { width: 2, flex: 1, backgroundColor: 'rgba(255,111,60,0.3)', marginTop: 2, minHeight: 14 },
  timelineName: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.15 },
  timelineMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  aboutSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  aboutIntro: { fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', letterSpacing: -0.1, marginBottom: 4 },
  aboutBlock: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  aboutBlockBare: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  aboutBlockGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aboutLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: '#FF6F3C', textTransform: 'uppercase' },
  aboutBody: { fontSize: 15, color: '#FFF', lineHeight: 22, letterSpacing: -0.1 },
  bioItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  bioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bioTitle: { fontSize: 15, color: '#FFF', fontWeight: '600', letterSpacing: -0.1 },
  bioBody: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, letterSpacing: -0.1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, overflow: 'hidden' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#FFF', letterSpacing: -0.1 },
  igGridSection: { marginTop: -20 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Floating Header ──
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  glassCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  usernameCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  usernameSpacer: {
    flexDirection: "row",
    opacity: 0,
  },
  usernameBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 5,
  },
  // ── Avatar ──
  avatarContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarSquare: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    // Subtle shadow for 3D lift
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  avatarInitial: {
    fontSize: 38,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Posts Card ──
  postsSection: {
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 16,
  },
  postsCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: CARD_INNER_PAD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  postsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  postsHeaderText: {
    fontSize: 13,
    color: "#1A1A1A",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  postsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: -CARD_INNER_PAD,
    marginBottom: 10,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: POST_GAP,
  },
  postContainer: {
    position: "relative",
    width: GRID_POST_SIZE,
    height: GRID_POST_SIZE,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  postPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 4,
    padding: 3,
  },
  postsLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noPosts: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  noPostsText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.35)",
  },

  // ── Avatar Viewer ──
  avatarViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarViewerContainer: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarViewerImage: {
    width: "100%",
    height: "100%",
  },
  avatarViewerClose: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});

