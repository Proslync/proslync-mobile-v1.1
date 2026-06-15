// Lightweight, provider-free notifications sheet for the home feed bell.
// The full NotificationSheet depends on FanAuthProvider (not mounted on the
// main feed) + live APIs; this demo surface is self-contained and fixture-fed.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import {
  CANVAS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  SURFACE, HAIRLINE, HAIRLINE_SUBTLE,
  RADIUS_SM, RADIUS_LG,
  ACCENT,
} from '@/components/shared/ui-kit/tokens';

const COPPER = ACCENT;
const WHITE = TEXT_PRIMARY;
const MUTED = TEXT_SECONDARY;

type NotifKind = 'deal' | 'payment' | 'support' | 'post' | 'system';

interface NotifItem {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const ICON: Record<NotifKind, keyof typeof Ionicons.glyphMap> = {
  deal: 'briefcase-outline',
  payment: 'cash-outline',
  support: 'heart-outline',
  post: 'image-outline',
  system: 'notifications-outline',
};

const FIXTURE: NotifItem[] = [
  { id: 'n1', kind: 'payment', title: 'Payment cleared', body: 'Gatorade paid $3,200 — $768 set aside for taxes.', time: '2h', unread: true },
  { id: 'n2', kind: 'deal', title: 'Deal cleared NIL Go', body: 'Your JMA Wireless deal passed clearinghouse review.', time: '5h', unread: true },
  { id: 'n3', kind: 'support', title: 'New supporter', body: 'You’re up to 1,250 supporters this season.', time: '1d', unread: false },
  { id: 'n4', kind: 'post', title: 'Drop reminder', body: 'Insiders drop goes live Friday — post your teaser.', time: '2d', unread: false },
  { id: 'n5', kind: 'system', title: 'Disclosure due soon', body: 'Report your Legacy Athletics deal to NIL Go in 3 days.', time: '2d', unread: false },
];

export function HomeNotificationsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(160)} style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={20} color={MUTED} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {FIXTURE.map((n) => (
              <View key={n.id} style={styles.row}>
                <View style={styles.iconWrap}>
                  <Ionicons name={ICON[n.kind]} size={18} color={n.unread ? COPPER : MUTED} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.time}>{n.time}</Text>
                  {n.unread ? <View style={styles.dot} /> : null}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: CANVAS,
    borderTopLeftRadius: RADIUS_LG,
    borderTopRightRadius: RADIUS_LG,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: HAIRLINE, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE_SUBTLE,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS_SM,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: WHITE, fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  rowBody: { color: MUTED, fontSize: 12, marginTop: 2, lineHeight: 17 },
  metaCol: { alignItems: 'flex-end', gap: 4 },
  time: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COPPER },
});
