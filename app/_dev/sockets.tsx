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

import { useChannelsSocket } from "@/lib/providers/channels-socket-provider";
import { useChatSocket } from "@/lib/providers/chat-socket-provider";
import { config } from "@/lib/config";
import { logger } from "@/lib/dev";

interface SocketRow {
  name: string;
  namespace: string;
  isConnected: boolean;
  connected: boolean;
  id?: string;
}

/**
 * Live status for every socket.io namespace mounted at the app root, plus the
 * tail of socket-tagged log entries.
 */
export default function SocketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const chat = useChatSocket();
  const channels = useChannelsSocket();

  const [, force] = React.useReducer((n) => n + 1, 0);
  const [tail, setTail] = React.useState(() =>
    logger
      .entries()
      .filter((e) => e.tag && /socket|chat|channel|bar/i.test(e.tag))
      .slice(-50)
      .reverse(),
  );

  // Refresh socket-id readout every second; sockets carry mutable refs we can't
  // listen to directly without forking the provider.
  React.useEffect(() => {
    const id = setInterval(force, 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    const unsub = logger.subscribe((entry) => {
      if (!entry.tag || !/socket|chat|channel|bar/i.test(entry.tag)) return;
      setTail((prev) => [entry, ...prev].slice(0, 50));
    });
    return unsub;
  }, []);

  const rows: SocketRow[] = [
    {
      name: "chat",
      namespace: "/chat",
      isConnected: chat.isConnected,
      connected: chat.socket?.connected ?? false,
      id: chat.socket?.id,
    },
    {
      name: "channels",
      namespace: "/channels",
      isConnected: channels.isConnected,
      connected: channels.socket?.connected ?? false,
      id: channels.socket?.id,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Sockets</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        <View style={styles.statusBanner}>
          <Ionicons
            name={config.websocket.enabled ? "checkmark-circle" : "close-circle"}
            size={16}
            color={config.websocket.enabled ? "#14B8A6" : "rgba(255,255,255,0.55)"}
          />
          <Text style={styles.statusText}>
            websocket.enabled: {String(config.websocket.enabled)} · {config.websocket.url || "(no url)"}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Namespaces</Text>
        <View style={styles.card}>
          {rows.map((row, i) => (
            <React.Fragment key={row.name}>
              <View style={styles.row}>
                <View style={[styles.statusDot, { backgroundColor: row.isConnected ? "#14B8A6" : "rgba(255,255,255,0.25)" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{row.namespace}</Text>
                  <Text style={styles.rowSub}>
                    {row.isConnected ? "connected" : "disconnected"}
                    {row.id ? ` · id ${row.id.slice(0, 10)}…` : ""}
                  </Text>
                </View>
              </View>
              {i < rows.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Recent socket logs</Text>
        <View style={styles.card}>
          {tail.length === 0 ? (
            <View style={styles.emptyInner}>
              <Text style={styles.emptyText}>
                No socket-tagged log entries yet. Components emit through{" "}
                <Text style={styles.code}>logger.tagged(&apos;chat&apos;)</Text>.
              </Text>
            </View>
          ) : (
            tail.map((entry, i) => (
              <React.Fragment key={`${entry.timestamp}-${i}`}>
                <View style={styles.logRow}>
                  <Text style={[styles.logLevel, levelColor(entry.level)]}>{entry.level.toUpperCase()}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logHead}>
                      <Text style={styles.logTag}>[{entry.tag}]</Text> {entry.message}
                    </Text>
                    <Text style={styles.logTime}>{new Date(entry.timestamp).toLocaleTimeString()}</Text>
                  </View>
                </View>
                {i < tail.length - 1 && <View style={styles.logDivider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function levelColor(level: string) {
  switch (level) {
    case "error":
      return { color: "#FF453A" };
    case "warn":
      return { color: "#F59E0B" };
    case "info":
      return { color: "#14B8A6" };
    default:
      return { color: "rgba(255,255,255,0.55)" };
  }
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
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statusText: { color: "rgba(255,255,255,0.85)", fontSize: 12, flex: 1 },
  sectionLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginTop: 14,
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
    paddingVertical: 14,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  rowLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginLeft: 36 },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Menlo",
    width: 44,
    paddingTop: 1,
  },
  logHead: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: "Menlo", lineHeight: 16 },
  logTag: { color: "rgba(255,111,60,0.85)", fontSize: 12 },
  logTime: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 4, fontFamily: "Menlo" },
  logDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.04)", marginLeft: 14 },
  emptyInner: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: "center",
  },
  emptyText: { color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", lineHeight: 18 },
  code: { fontFamily: "Menlo", color: "rgba(255,111,60,0.85)" },
});
