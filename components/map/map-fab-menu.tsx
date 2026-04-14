// Map screen pill — static vertical glass pill with location + nearby icons

import * as React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";

interface MapFabMenuProps {
  onShareLocation: () => void;
  onRecenter: () => void;
  onNearby: () => void;
  isSharing?: boolean;
  isCentered?: boolean;
  topInset?: number;
}

export function MapFabMenu({
  onShareLocation,
  onRecenter,
  onNearby,
  isCentered = false,
  topInset = 60,
}: MapFabMenuProps) {
  return (
    <View style={[styles.pill, { top: topInset }]}>
      {isLiquidGlassSupported ? (
        <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 28 }]} />
      )}
      <TouchableOpacity style={styles.iconBtn} onPress={onRecenter} activeOpacity={0.7}>
        <Ionicons name={isCentered ? "navigate" : "navigate-outline"} size={22} color="#fff" />
      </TouchableOpacity>
      <View style={styles.divider} />
      <TouchableOpacity style={styles.iconBtn} onPress={onShareLocation} activeOpacity={0.7}>
        <Ionicons name="locate-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    right: 16,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
  },
  iconBtn: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    width: 32,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
