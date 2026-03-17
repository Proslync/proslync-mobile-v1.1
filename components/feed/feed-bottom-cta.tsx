import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

interface FeedBottomCTAProps {
  onRsvp: () => void;
  isPaid?: boolean;
  isRsvpd?: boolean;
  isPurchased?: boolean;
  isEvent?: boolean;
  price?: number | null;
}

export function FeedBottomCTA({
  onRsvp,
  isPaid,
  isRsvpd,
  isPurchased,
  isEvent = true,
  price,
}: FeedBottomCTAProps) {
  if (!isEvent) {
    return null;
  }

  const isDone = !isPaid && (isPurchased || isRsvpd);
  let label = 'RSVP';
  if (isPaid) {
    label = price != null ? `From $${price.toFixed(2)}` : 'Tickets';
  } else if (isDone) {
    label = "RSVP'd";
  }

  return (
    <TouchableOpacity
      onPress={onRsvp}
      activeOpacity={0.85}
      disabled={isDone}
    >
      <View style={styles.button}>
        <GlassView
          {...liquidGlass.fillFaint}
          borderRadius={12}
          style={styles.glassBg}
        />
        <View style={styles.content}>
          <Text style={[styles.buttonText, isDone && styles.buttonTextDone]}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  content: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    color: '#fff',
  },
  buttonTextDone: {
    color: 'rgba(255,255,255,0.5)',
  },
});
