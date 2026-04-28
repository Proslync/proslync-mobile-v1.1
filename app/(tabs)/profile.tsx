import { FollowersSheet } from "@/components/feed/followers-sheet";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { SwipeableTabView } from "@/components/shared/swipeable-tab-view";
import { VideoThumbnailImage } from "@/components/shared/video-thumbnail";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useUserFeed } from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useStableRouter } from "@/hooks/use-stable-router";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-user-follows";
import { eventsApi } from "@/lib/api/events";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/lib/types/events.types";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRole } from "@/lib/providers/role-provider";
import CoachProfile from "@/components/coach/coach-profile";
import ScorekeeperProfile from "@/components/scorekeeper/scorekeeper-profile";
import BrandProfile from "@/components/brand/brand-profile";
import FanProfile from "@/components/fan/fan-profile";
import SchoolProfile from "@/components/school/school-profile";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "expo-glass-effect";

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
    caption: 'Proud to partner with PUMA for the new Melo signature line. Dropping soon 🎯',
    brandTag: 'PUMA',
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

function SocialPostCard({ post, athleteName, athleteMeta }: { post: SocialPost; athleteName: string; athleteMeta: string }) {
  const meta = PLATFORM_META[post.platform];
  const [liked, setLiked] = React.useState(false);

  return (
    <View style={s.socialCard}>
      {/* Header row */}
      <View style={s.socialHeader}>
        <View style={[s.socialAvatar, { backgroundColor: '#FF6F3C' }]} />
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
  },
];

function SharedDealCard({ deal }: { deal: SharedDeal }) {
  const [interested, setInterested] = React.useState(false);

  return (
    <View style={s.dealCard}>
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
        <TouchableOpacity style={s.dealBtn} activeOpacity={0.75}>
          <Text style={s.dealBtnText}>View Deal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.dealBtn, s.dealBtnPrimary, interested && s.dealBtnActive]}
          activeOpacity={0.85}
          onPress={() => setInterested((v) => !v)}
        >
          <Ionicons
            name={interested ? 'checkmark' : 'flash'}
            size={14}
            color={interested ? '#34C759' : '#FF6F3C'}
          />
          <Text style={[s.dealBtnText, { color: interested ? '#34C759' : '#FF6F3C' }]}>
            {interested ? 'Interested' : "I'm Interested"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dealBtnIcon} activeOpacity={0.75}>
          <Ionicons name="paper-plane-outline" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
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
  if (role === 'scorekeeper') return <ScorekeeperProfile />;
  if (role === 'brand') return <BrandProfile />;
  if (role === 'fan') return <FanProfile />;
  if (role === 'school') return <SchoolProfile />;
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
  const [profileTab, setProfileTab] = React.useState<'about' | 'posts' | 'deals' | 'merch' | 'media'>('about');
  const [expandedBio, setExpandedBio] = React.useState<Set<string>>(new Set());
  const toggleBio = React.useCallback((key: string) => {
    setExpandedBio((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const BIO_SECTIONS = React.useMemo(
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
    () => ['about', 'posts', 'deals', 'merch', 'media'] as const,
    []
  );
  const { data: userEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['userEvents', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return eventsApi.getUserEvents(user.id, { sortBy: 'date', sortOrder: 'desc' });
    },
    enabled: !!user?.id && profileTab === 'events',
    staleTime: 1000 * 60 * 2,
  });
  const [showAvatarViewer, setShowAvatarViewer] = React.useState(false);
  const closeAvatarViewer = React.useCallback(() => setShowAvatarViewer(false), []);
  const lastTapRef = React.useRef<number>(0);

  const createMenuOptions: ActionSheetOption[] = React.useMemo(
    () => [
      {
        label: "Go Live",
        icon: "videocam-outline",
        onPress: () => router.push("/live"),
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

  const { username, avatarUrl, initial } = React.useMemo(
    () => ({
      username: "kiyan",
      avatarUrl: user?.avatar?.url,
      initial: "K",
    }),
    [user],
  );

  // Inline-editable identity fields. Defaults are the Kiyan persona.
  const [isEditing, setIsEditing] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
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
        if (avatarUrl) setShowAvatarViewer(true);
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


        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* Banner — cover image that fades into the page bg, now scrolls with the content */}
          <View style={[s.bannerWrap, { height: insets.top + 180, backgroundColor: '#000' }]} pointerEvents="none">
            <Image
              source={require('@/assets/images/kiyan-banner.png')}
              style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 249 }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.03)',
                'rgba(0,0,0,0.07)',
                'rgba(0,0,0,0.13)',
                'rgba(0,0,0,0.20)',
                'rgba(0,0,0,0.29)',
                'rgba(0,0,0,0.39)',
                'rgba(0,0,0,0.50)',
                'rgba(0,0,0,0.62)',
                'rgba(0,0,0,0.73)',
                'rgba(0,0,0,0.83)',
                'rgba(0,0,0,0.91)',
                'rgba(0,0,0,0.96)',
                'rgba(0,0,0,0.99)',
                '#000',
                '#000',
              ]}
              locations={[
                0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7,
                0.77, 0.83, 0.88, 0.92, 1,
              ]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
          {/* Profile info row — avatar left, name + stats right */}
          <View style={s.profileRow}>
            <TouchableOpacity
              onPress={handleAvatarTap}
              activeOpacity={0.9}
              accessibilityLabel="View profile photo"
              accessibilityRole="imagebutton"
            >
              <Image
                source={require('@/assets/images/kiyan-avatar.png')}
                style={s.igAvatar}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <View style={s.rightCol}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[s.igName, s.editableField]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Display name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardAppearance="dark"
                  />
                  <TextInput
                    style={[s.metaLine, s.metaLinePrimary, s.editableField, { marginTop: 6 }]}
                    value={metaPrimary}
                    onChangeText={setMetaPrimary}
                    placeholder="Headline"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardAppearance="dark"
                  />
                  <TextInput
                    style={[s.metaLine, s.editableField, { marginTop: 6 }]}
                    value={metaSecondary}
                    onChangeText={setMetaSecondary}
                    placeholder="Location"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardAppearance="dark"
                  />
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={s.igName}>{displayName}</Text>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#FF6F3C" />
                  </View>
                  <Text style={[s.metaLine, s.metaLinePrimary]} numberOfLines={1}>
                    {metaPrimary}
                  </Text>
                  <Text style={s.metaLine} numberOfLines={1}>
                    {metaSecondary}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Profile section tabs — plain row with orange underline under the active tab */}
          <View style={s.tabsRow}>
            {TAB_KEYS.map((key) => {
              const isActive = profileTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.tab, isActive && s.tabActive]}
                  onPress={() => setProfileTab(key)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                    {key[0].toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab content */}
          <View style={s.igGridSection}>
            {profileTab === 'about' && (
              <View style={s.aboutSection}>
                <View style={s.aboutBlockBare}>
                  <Text style={s.aboutLabel}>Bio</Text>
                  {BIO_SECTIONS.map((section) => {
                    const isOpen = expandedBio.has(section.key);
                    return (
                      <View key={section.key} style={s.bioItem}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleBio(section.key)}
                          style={s.bioHeader}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: isOpen }}
                        >
                          <Text style={s.bioTitle}>{section.title}</Text>
                          <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="rgba(255,255,255,0.6)"
                          />
                        </TouchableOpacity>
                        {isOpen && <Text style={s.bioBody}>{section.body}</Text>}
                      </View>
                    );
                  })}
                </View>

                <View style={s.aboutBlockBare}>
                  <Text style={s.aboutLabel}>Interests</Text>
                  {([
                    {
                      key: 'philanthropy',
                      title: 'Philanthropy',
                      body: "Gives back through the Boys & Girls Clubs of Harlem and mentors youth with After-School All-Stars and Team IMPACT.",
                    },
                    {
                      key: 'personal',
                      title: 'Personal',
                      body: "Deep into fashion, sneaker culture, and music production — plans to launch his own apparel label after college. Downtime is mostly film, photography, vinyl collecting, and pickup hoops around Brooklyn.",
                    },
                    {
                      key: 'academic',
                      title: 'Academic',
                      body: "Early interest in entrepreneurship and real estate, and active with the Syracuse Student-Athlete Advisory Committee on the academic side.",
                    },
                  ] as const).map((section) => {
                    const isOpen = expandedBio.has(section.key);
                    return (
                      <View key={section.key} style={s.bioItem}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleBio(section.key)}
                          style={s.bioHeader}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: isOpen }}
                        >
                          <Text style={s.bioTitle}>{section.title}</Text>
                          <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="rgba(255,255,255,0.6)"
                          />
                        </TouchableOpacity>
                        {isOpen && <Text style={s.bioBody}>{section.body}</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {profileTab === 'posts' && (
              <View style={s.feedList}>
                {MOCK_SOCIAL_POSTS.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                    athleteName={displayName}
                    athleteMeta="Freshman Guard  ·  Syracuse"
                  />
                ))}
              </View>
            )}

            {profileTab === 'deals' && (
              <View style={s.feedList}>
                {MOCK_SHARED_DEALS.map((deal) => (
                  <SharedDealCard key={deal.id} deal={deal} />
                ))}
              </View>
            )}

            {profileTab === 'merch' && <MerchTab />}

            {profileTab === 'media' && (
              <View>
                <AwardsTab />
                <View style={s.feedList}>
                  {MOCK_MEDIA.map((m) => <MediaCard key={m.id} item={m} />)}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

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
              {avatarUrl && (
                <Image
                  source={{ uri: avatarUrl }}
                  style={s.avatarViewerImage}
                  resizeMode="contain"
                />
              )}
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
          style={[s.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 170 }]}
          pointerEvents="none"
        />

        {/* Floating bottom toolbar — role switcher | edit profile | go live */}
        <View style={[s.bottomToolbar, { bottom: TAB_BAR_TOP_FROM_BOTTOM + 10 }]}>
          <Pressable
            style={s.toolbarCircle}
            onPress={() => setRoleSheetVisible(true)}
            accessibilityLabel="Switch role"
            accessibilityRole="button"
          >
            <LiquidGlassView
              effect="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
            <Ionicons name="menu" size={22} color="#FFF" />
          </Pressable>

          <Pressable
            style={[s.toolbarPill, isEditing && s.toolbarPillActive]}
            onPress={() => setIsEditing((v) => !v)}
            accessibilityLabel={isEditing ? 'Save profile changes' : 'Edit profile'}
            accessibilityRole="button"
          >
            <LiquidGlassView
              effect="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
            <Text style={s.toolbarPillText}>
              {isEditing ? 'Save' : 'Edit Profile'}
            </Text>
          </Pressable>

          <Pressable
            style={s.toolbarCircle}
            onPress={() => setShowCreateMenu(true)}
            accessibilityLabel="Create"
            accessibilityRole="button"
          >
            <LiquidGlassView
              effect="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
            <Ionicons name="radio" size={22} color="#FF4444" />
          </Pressable>
        </View>
      </View>
      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
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
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, marginTop: -180, marginBottom: 5 },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#111' },
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
  tabsRow: { flexDirection: 'row', marginTop: 6, marginBottom: 10, paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#FF6F3C' },
  tabLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)', letterSpacing: -0.1 },
  tabLabelActive: { color: '#FF6F3C', fontWeight: '700' },
  metaLine: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: -0.1, lineHeight: 18 },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },
  editableField: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,111,60,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 0,
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
  mediaCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 },
  mediaSourceLogo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mediaSourceInitial: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  mediaSourceLabel: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  mediaTimeAgo: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  mediaThumbWrap: { width: '100%', aspectRatio: 1.6, backgroundColor: '#111' },
  mediaThumb: { width: '100%', height: '100%' },
  mediaPlayBadge: { position: 'absolute', top: '50%', left: '50%', width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', marginLeft: -24, marginTop: -24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  mediaDurationPill: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  mediaDurationText: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },
  mediaBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 6 },
  mediaHeadline: { fontSize: 15, fontWeight: '700', color: '#FFF', lineHeight: 20, letterSpacing: -0.2 },
  mediaSnippet: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 18, letterSpacing: -0.1 },
  mediaActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  mediaBtnPrimary: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, borderRadius: 10, backgroundColor: '#FF6F3C' },
  mediaBtnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  mediaBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
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
  aboutBlockBare: { gap: 10, paddingHorizontal: 4 },
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
  igGridSection: { },
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

