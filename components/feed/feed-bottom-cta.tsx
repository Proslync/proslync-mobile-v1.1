import { liquidGlass } from "@/constants/glass/liquid-glass";
import { GlassView } from "expo-glass-effect";
import * as React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  let label = "RSVP";
  if (isPaid) {
    label = price != null ? `From $${price.toFixed(2)}` : "Tickets";
  } else if (isDone) {
    label = "RSVP'd";
  }

  return (
    <TouchableOpacity
      onPress={onRsvp}
      activeOpacity={0.85}
      disabled={isDone}
      style={styles.wrapper}
    >
      <View style={styles.button}>
        <GlassView
          {...liquidGlass.surface}
          tintColor="rgba(10, 10, 10, 0.25)"
          borderRadius={16}
          style={styles.glassBg}
        />
        <View style={styles.content}>
          <Text style={[styles.buttonText, isDone && styles.buttonTextDone]}>
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 14,
    marginBottom: 14,
  },
  button: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  content: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: "#1A1A1A",
  },
  buttonTextDone: {
    color: "rgba(255,255,255,0.5)",
  },
});
