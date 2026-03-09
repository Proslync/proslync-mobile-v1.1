import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, isDone && styles.buttonDone]}
        onPress={onRsvp}
        activeOpacity={0.85}
        disabled={isDone}
      >
        <Text style={[styles.buttonText, isDone && styles.buttonTextDone]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
  },
  button: {
    backgroundColor: '#0095F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    color: '#fff',
  },
  buttonTextDone: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
