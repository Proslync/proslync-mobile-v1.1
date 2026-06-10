import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { mockRegistry } from "@/lib/dev";

/**
 * Raw entity browser. Lists every dataset registered with `mockRegistry` and
 * lets you peek at its current load(). Read-only — mutating mocks happens via
 * `_dev/seed.tsx`.
 */
export default function EntitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [revision, setRevision] = React.useState(0);

  const datasets = React.useMemo(
    () => mockRegistry.list(),
    // re-evaluate when caller toggles seeds
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  );

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return datasets;
    return datasets.filter(
      (d) => d.id.toLowerCase().includes(q) || d.description.toLowerCase().includes(q),
    );
  }, [datasets, filter]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Entities</Text>
        <Pressable onPress={() => setRevision((r) => r + 1)} style={styles.backButton} hitSlop={10}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.5)" />
        <TextInput
          style={styles.searchInput}
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter by id or description"
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

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        <Text style={styles.subtitle}>
          {datasets.length} dataset{datasets.length === 1 ? "" : "s"} registered
          {filter ? ` · ${filtered.length} match${filtered.length === 1 ? "" : "es"}` : ""}
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={32} color="rgba(255,255,255,0.35)" />
            <Text style={styles.emptyText}>
              {datasets.length === 0
                ? "No datasets registered yet. Track A2 owns lib/dev/datasets/."
                : "No datasets match your filter."}
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {filtered.map((d, i) => (
              <EntityRow
                key={d.id}
                id={d.id}
                description={d.description}
                expanded={openId === d.id}
                onToggle={() => setOpenId((prev) => (prev === d.id ? null : d.id))}
                isLast={i === filtered.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EntityRow({
  id,
  description,
  expanded,
  onToggle,
  isLast,
}: {
  id: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const [snapshot, setSnapshot] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expanded) {
      setSnapshot(null);
      setError(null);
      return;
    }
    try {
      const value = mockRegistry.get<unknown>(id);
      const json = JSON.stringify(value, null, 2);
      // Cap the rendered slice so we don't blow up on enormous arrays.
      setSnapshot(json.length > 4000 ? `${json.slice(0, 4000)}\n…(truncated, ${json.length} chars total)` : json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [expanded, id]);

  const count = React.useMemo(() => {
    if (!expanded) return null;
    try {
      const v = mockRegistry.get<unknown>(id);
      if (Array.isArray(v)) return `${v.length} items`;
      if (v && typeof v === "object") return `${Object.keys(v as object).length} keys`;
      return typeof v;
    } catch {
      return null;
    }
  }, [expanded, id]);

  return (
    <>
      <Pressable onPress={onToggle} style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name="cube-outline" size={18} color="rgba(255,255,255,0.85)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{id}</Text>
          <Text style={styles.rowSub} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={18}
          color="rgba(255,255,255,0.4)"
        />
      </Pressable>
      {expanded && (
        <View style={styles.snapshotWrap}>
          {count && <Text style={styles.snapshotMeta}>{count}</Text>}
          {error ? (
            <Text style={styles.snapshotError}>{error}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.snapshotText} selectable>
                {snapshot ?? "Loading…"}
              </Text>
            </ScrollView>
          )}
        </View>
      )}
      {!isLast && <View style={styles.divider} />}
    </>
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
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 14, padding: 0 },
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
  snapshotWrap: {
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  snapshotMeta: {
    color: "rgba(255,111,60,0.85)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  snapshotText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: "Menlo",
    lineHeight: 15,
  },
  snapshotError: {
    color: "#FF453A",
    fontSize: 12,
    fontFamily: "Menlo",
  },
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
