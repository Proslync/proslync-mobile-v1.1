// ── HERO SITE LINK ────────────────────────────────────────
// Tiny footer affordance that opens the public Proslync hero site
// (PLAN.md §0a — `proslync-hero.vercel.app`, mirrored under
// `Active builds/proslync-website`). Lives at the very bottom of the
// Explore tab so the universal shell carries a brand-tie back to the
// public marketing surface without breaking the in-app identity.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FAN_ACCENT } from '@/constants/brand';
import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
} from '@/components/shared/ui-kit';

const HERO_URL = 'https://proslync-hero.vercel.app';

export function HeroSiteLink() {
  const onPress = React.useCallback(async () => {
    try {
      await Linking.openURL(HERO_URL);
    } catch (err) {
      // Surfaces in dev console only — non-fatal; user stays on the
      // Explore tab and can retry via the same affordance.
      console.warn('[HeroSiteLink] Failed to open hero site', err);
    }
  }, []);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Open the public Proslync hero site"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.body}>
        <Text style={styles.eyebrow}>PROSLYNC.COM</Text>
        <Text style={styles.title}>See how Proslync works</Text>
        <Text style={styles.copy}>
          Hero site, deck, and product tour for athletic directors.
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color="rgba(255,255,255,0.55)"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  cardPressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: FAN_ACCENT,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  copy: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});
