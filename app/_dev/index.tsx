import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/providers/auth-provider";
import { useImpersonation } from "@/lib/providers/impersonation-provider";

export default function DevCockpitIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activePersona, clearPersona } = useImpersonation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Backend cockpit</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <SectionLabel>Identity</SectionLabel>
        <Card>
          <Row
            icon="person-circle-outline"
            label={user?.userName ?? "(no user)"}
            sub={`role: ${user?.role ?? "—"} · isBackend: true`}
          />
          {activePersona ? (
            <>
              <Divider />
              <Row
                icon="swap-horizontal-outline"
                label={`Viewing as: ${activePersona.label}`}
                sub={`profileRole: ${activePersona.profileRole ?? "—"} · userRole: ${activePersona.userRole}`}
                danger
              />
              <Divider />
              <Row
                icon="close-circle-outline"
                label="Clear impersonation"
                onPress={clearPersona}
                danger
              />
            </>
          ) : (
            <>
              <Divider />
              <Row icon="checkmark-circle-outline" label="No impersonation active" sub="useAuth().user reflects your real identity" />
            </>
          )}
        </Card>

        <SectionLabel>Demo controls</SectionLabel>
        <Card>
          <Row
            icon="people-circle-outline"
            label="Switch persona"
            sub="View the app as athlete / coach / agent / brand / fan / NIL manager / school"
            onPress={() => router.push("/_dev/personas" as any)}
            chevron
          />
          <Divider />
          <Row
            icon="flag-outline"
            label="Feature flags"
            sub="Toggle channels / backend-cockpit / live-sockets"
            onPress={() => router.push("/_dev/flags" as any)}
            chevron
          />
        </Card>

        <SectionLabel>Coming soon</SectionLabel>
        <Card>
          <Row icon="cube-outline" label="Entities browser" sub="queue: see EMA queue under Track B" disabled />
          <Divider />
          <Row icon="layers-outline" label="Cache inspector" sub="TanStack Query keys + invalidate" disabled />
          <Divider />
          <Row icon="pulse-outline" label="Sockets log" sub="Live socket.io event stream" disabled />
          <Divider />
          <Row icon="document-text-outline" label="Logs" sub="logger.entries() ring buffer" disabled />
          <Divider />
          <Row icon="server-outline" label="Dataset seeder" sub="Swap mock-registry variants" disabled />
        </Card>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({
  icon,
  label,
  sub,
  onPress,
  chevron,
  danger,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <View style={[styles.row, disabled && { opacity: 0.4 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={danger ? "#FF453A" : "rgba(255,255,255,0.85)"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: "#FF453A" }]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {chevron && <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />}
    </View>
  );
  if (onPress && !disabled) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
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
  sectionLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
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
  rowLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 60,
  },
});
