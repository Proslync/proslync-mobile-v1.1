import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { flags } from "@/lib/dev";
import type { FeatureFlags } from "@/lib/dev/feature-flags";

export default function FlagsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = React.useState(() => flags.listFlags());

  React.useEffect(() => {
    return flags.subscribe(() => setSnapshot(flags.listFlags()));
  }, []);

  const toggle = (name: keyof FeatureFlags, value: boolean) => {
    flags.setFlag(name, value);
  };

  const resetAll = () => {
    snapshot.forEach((f) => flags.resetFlag(f.name));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Feature flags</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <Text style={styles.subtitle}>
          Persisted in MMKV. Toggles take effect on next read; some surfaces may need a remount.
        </Text>

        <View style={styles.card}>
          {snapshot.map((flag, i) => (
            <React.Fragment key={flag.name}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{flag.name}</Text>
                  <Text style={styles.rowSub}>
                    {flag.isDefault ? "default" : "overridden"} · current: {String(flag.value)}
                  </Text>
                </View>
                <Switch
                  value={flag.value}
                  onValueChange={(v) => toggle(flag.name, v)}
                  trackColor={{ true: "#EB621A", false: "rgba(255,255,255,0.15)" }}
                />
              </View>
              {i < snapshot.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Pressable onPress={resetAll} style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.85)" />
          <Text style={styles.resetText}>Reset all to defaults</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0B" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, textAlign: "center", color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    lineHeight: 18,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  resetText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
});
