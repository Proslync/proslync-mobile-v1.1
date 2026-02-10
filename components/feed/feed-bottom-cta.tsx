import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

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
  const { colors } = useAppTheme();

  // Don't show CTA for non-event posts
  if (!isEvent) {
    return null;
  }

  // Determine button label and state
  const isDone = isPurchased || isRsvpd;
  let label = 'RSVP';
  if (isDone) {
    label = isPurchased ? 'Purchased' : "RSVP'd";
  } else if (isPaid) {
    label = price != null ? `From $${price.toFixed(2)}` : 'Tickets';
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.buttonPrimary },
          isDone && styles.buttonDone,
        ]}
        onPress={onRsvp}
        activeOpacity={0.85}
        disabled={isDone}
      >
        <Text style={[
          styles.buttonText,
          { color: colors.buttonPrimaryText },
          isDone && styles.buttonTextDone,
        ]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.3,
  },
  buttonDone: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  buttonTextDone: {
    color: '#22c55e',
  },
});
