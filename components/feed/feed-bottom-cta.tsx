import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

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
        style={[
          styles.button,
          isDone && styles.buttonDone,
        ]}
        onPress={onRsvp}
        activeOpacity={0.85}
        disabled={isDone}
      >
        {!isDone && (
          <>
            <BlurView intensity={30} tint="light" style={styles.blurBackground} />
            <View style={styles.frostedFill} />
          </>
        )}
        <View style={[styles.border, isDone && styles.borderDone]} />
        <Text style={[
          styles.buttonText,
          isDone && styles.buttonTextDone,
        ]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDone: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  frostedFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  borderDone: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    color: '#000',
  },
  buttonTextDone: {
    color: '#fff',
  },
});
