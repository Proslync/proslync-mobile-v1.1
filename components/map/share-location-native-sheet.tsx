// Native SwiftUI Bottom Sheet for Share Location — Apple Find My style
// Uses NativeSheet wrapper with dark theme and RN content

import * as React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { NativeSheet } from "@/components/ui/native-sheet";
import { useLiveLocation } from "@/lib/providers/live-location-provider";

// Re-export for search.tsx
export { canUseNativeSheet } from "@/components/ui/native-sheet";

interface NativeShareLocationSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function NativeShareLocationSheet({
  isVisible,
  onClose,
}: NativeShareLocationSheetProps) {
  const {
    sharingState,
    startSharing,
    stopSharing,
    hasLocationPermission,
    requestLocationPermission,
  } = useLiveLocation();

  const isSharing = sharingState.isSharing;

  const handleToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (value) {
      if (!hasLocationPermission) {
        await requestLocationPermission();
      }
      startSharing(0); // 0 = indefinite
    } else {
      stopSharing();
    }
  };

  return (
    <NativeSheet
      isPresented={isVisible}
      onDismiss={onClose}
      detents={[{ fraction: 0.32 }]}
      colorScheme="dark"
      rnContent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Me</Text>
        </View>

        {/* Status */}
        <Text style={styles.statusText}>
          {isSharing ? "Sharing Location" : "Not Sharing Location"}
        </Text>

        {/* Settings card */}
        <View style={styles.card}>
          {/* My Location */}
          <View style={styles.row}>
            <View style={styles.rowIconCircle}>
              <Ionicons name="location-sharp" size={18} color="#fff" />
            </View>
            <Text style={styles.rowLabel}>My Location</Text>
          </View>

          <View style={styles.separator} />

          {/* Share My Location */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Share My Location</Text>
            <Switch
              value={isSharing}
              onValueChange={handleToggle}
              trackColor={{ false: "#39393d", true: "#34c759" }}
              thumbColor="#fff"
              style={styles.toggle}
            />
          </View>

          <View style={styles.separator} />

          {/* Sharing From */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sharing From</Text>
            <Text style={styles.rowValue}>This iPhone</Text>
          </View>
        </View>
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#34c759",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#2c2c2e",
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#636366",
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
    flex: 1,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255,255,255,0.5)",
  },
  toggle: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 58,
  },
});
