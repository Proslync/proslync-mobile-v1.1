import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useImpersonation, type ActivePersona } from "@/lib/providers/impersonation-provider";
import { UserRole } from "@/lib/types/auth.types";

const PERSONAS: ActivePersona[] = [
  { key: "player", label: "Player", userRole: UserRole.USER, profileRole: "player" },
  { key: "coach", label: "Coach", userRole: UserRole.USER, profileRole: "coach" },
  { key: "agent", label: "Agent", userRole: UserRole.USER, profileRole: "agent" },
  { key: "brand", label: "Brand", userRole: UserRole.USER, profileRole: "brand" },
  { key: "fan", label: "Fan", userRole: UserRole.USER, profileRole: "fan" },
  { key: "school", label: "School", userRole: UserRole.USER, profileRole: "school" },
  { key: "collective", label: "Collective", userRole: UserRole.USER, profileRole: "collective" },
  { key: "athleticDirector", label: "Athletic Director", userRole: UserRole.USER, profileRole: "school" },
  { key: "admin", label: "Admin (platform)", userRole: UserRole.ADMIN, profileRole: null },
];

export default function PersonasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activePersona, setPersona, clearPersona } = useImpersonation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>View as</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <Text style={styles.subtitle}>
          Override what the app renders without changing your real account. Backend access stays.
        </Text>

        <View style={styles.card}>
          {PERSONAS.map((persona, i) => {
            const selected = activePersona?.key === persona.key;
            return (
              <React.Fragment key={persona.key}>
                <Pressable onPress={() => setPersona(persona)} style={styles.row}>
                  <View style={[styles.rowIcon, selected && styles.rowIconActive]}>
                    <Ionicons
                      name={ICON_FOR[persona.key] ?? "person-outline"}
                      size={18}
                      color={selected ? "#EB621A" : "rgba(255,255,255,0.85)"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{persona.label}</Text>
                    <Text style={styles.rowSub}>
                      profileRole: {persona.profileRole ?? "—"} · userRole: {persona.userRole}
                    </Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color="#EB621A" />}
                </Pressable>
                {i < PERSONAS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {activePersona && (
          <Pressable onPress={clearPersona} style={styles.clearButton}>
            <Ionicons name="close-circle-outline" size={18} color="#FF453A" />
            <Text style={styles.clearText}>Clear impersonation</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const ICON_FOR: Record<string, keyof typeof import("@expo/vector-icons").Ionicons.glyphMap> = {
  player: "basketball-outline",
  coach: "megaphone-outline",
  agent: "people-outline",
  brand: "briefcase-outline",
  fan: "heart-outline",
  school: "school-outline",
  nilManager: "shield-checkmark-outline",
  collective: "people-circle-outline",
  athleticDirector: "trophy-outline",
  admin: "construct-outline",
};

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
    paddingVertical: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  rowIconActive: {
    backgroundColor: "rgba(255,111,60,0.15)",
    borderColor: "rgba(255,111,60,0.45)",
  },
  rowLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginLeft: 60 },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,69,58,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.25)",
  },
  clearText: { color: "#FF453A", fontSize: 14, fontWeight: "600" },
});
