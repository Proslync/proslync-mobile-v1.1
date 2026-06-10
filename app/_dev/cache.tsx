import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * TanStack Query cache inspector. Lists every active query key, its state,
 * dataUpdatedAt, and lets you invalidate / remove it.
 */
export default function CacheScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState("");
  const [, force] = React.useReducer((n) => n + 1, 0);

  // Subscribe to query cache events so the list refreshes live.
  React.useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => force());
    return unsub;
  }, [queryClient]);

  const queries = React.useMemo(() => {
    const all = queryClient.getQueryCache().getAll();
    const q = filter.trim().toLowerCase();
    const formatted = all.map((query) => {
      const key = JSON.stringify(query.queryKey);
      return {
        hash: query.queryHash,
        key,
        state: query.state.status,
        fetchStatus: query.state.fetchStatus,
        dataUpdatedAt: query.state.dataUpdatedAt,
        observerCount: query.getObserversCount(),
      };
    });
    if (!q) return formatted.sort((a, b) => a.key.localeCompare(b.key));
    return formatted
      .filter((row) => row.key.toLowerCase().includes(q))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filter, queryClient]);

  const totalCount = queryClient.getQueryCache().getAll().length;

  const invalidate = (hash: string) => {
    const query = queryClient.getQueryCache().get(hash);
    if (!query) return;
    queryClient.invalidateQueries({ queryKey: query.queryKey });
  };

  const remove = (hash: string) => {
    const query = queryClient.getQueryCache().get(hash);
    if (!query) return;
    queryClient.removeQueries({ queryKey: query.queryKey, exact: true });
  };

  const clearAll = () => {
    Alert.alert("Clear all queries?", "Removes every cached query. Active screens may refetch.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => queryClient.clear(),
      },
    ]);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Cache</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.searchInput}
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter query keys"
          placeholderTextColor="rgba(255,255,255,0.35)"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {filter.length > 0 && (
          <Pressable onPress={() => setFilter("")} hitSlop={10}>
            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={invalidateAll} style={styles.actionButton}>
          <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.actionLabel}>Invalidate all</Text>
        </Pressable>
        <Pressable onPress={clearAll} style={[styles.actionButton, styles.actionDanger]}>
          <Ionicons name="trash-outline" size={14} color="#FF453A" />
          <Text style={[styles.actionLabel, { color: "#FF453A" }]}>Clear cache</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        <Text style={styles.subtitle}>
          {totalCount} quer{totalCount === 1 ? "y" : "ies"} cached
          {filter ? ` · ${queries.length} match${queries.length === 1 ? "" : "es"}` : ""}
        </Text>

        {queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="layers-outline" size={32} color="rgba(255,255,255,0.35)" />
            <Text style={styles.emptyText}>
              {totalCount === 0
                ? "No queries in cache. Open a screen that uses React Query."
                : "No queries match your filter."}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {queries.map((q, i) => (
              <React.Fragment key={q.hash}>
                <View style={styles.queryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.queryKey} numberOfLines={2} selectable>
                      {q.key}
                    </Text>
                    <View style={styles.metaRow}>
                      <StatusPill status={q.state} fetchStatus={q.fetchStatus} />
                      <Text style={styles.metaText}>obs: {q.observerCount}</Text>
                      <Text style={styles.metaText}>{formatAge(q.dataUpdatedAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.queryActions}>
                    <Pressable onPress={() => invalidate(q.hash)} style={styles.iconBtn} hitSlop={6}>
                      <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                    <Pressable onPress={() => remove(q.hash)} style={styles.iconBtn} hitSlop={6}>
                      <Ionicons name="close" size={16} color="#FF453A" />
                    </Pressable>
                  </View>
                </View>
                {i < queries.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatusPill({ status, fetchStatus }: { status: string; fetchStatus: string }) {
  const isFetching = fetchStatus === "fetching";
  const color =
    status === "success"
      ? "#14B8A6"
      : status === "error"
        ? "#FF453A"
        : status === "pending"
          ? "#F59E0B"
          : "rgba(255,255,255,0.5)";
  return (
    <View style={[styles.pill, { borderColor: `${color}55`, backgroundColor: `${color}1A` }]}>
      <Text style={[styles.pillText, { color }]}>
        {status}
        {isFetching ? " · fetching" : ""}
      </Text>
    </View>
  );
}

function formatAge(timestamp: number): string {
  if (!timestamp) return "never";
  const ms = Date.now() - timestamp;
  if (ms < 1000) return "just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 14, padding: 0 },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionDanger: {
    backgroundColor: "rgba(255,69,58,0.06)",
    borderColor: "rgba(255,69,58,0.25)",
  },
  actionLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  queryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  queryKey: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Menlo",
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  metaText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Menlo",
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  queryActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginLeft: 14 },
  emptyCard: {
    marginHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    paddingHorizontal: 28,
    textAlign: "center",
    lineHeight: 18,
  },
});
