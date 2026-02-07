import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FeedBottomCTAProps {
  onRsvp: () => void;
  isPaid?: boolean;
  isRsvpd?: boolean;
  isEvent?: boolean;
  price?: number | null;
}

export function FeedBottomCTA({
  onRsvp,
  isPaid,
  isRsvpd,
  isEvent = true,
  price,
}: FeedBottomCTAProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 50 + insets.bottom + 2;

  // Don't show CTA for non-event posts
  if (!isEvent) {
    return null;
  }

  // Determine button label
  let label = 'RSVP';
  if (isPaid) {
    label = price != null ? `From $${price.toFixed(2)}` : 'Tickets';
  }

  return (
    <View style={[styles.container, { bottom: tabBarHeight }]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onRsvp}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#3897F0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
