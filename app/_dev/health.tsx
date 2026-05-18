import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";

import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { proslyncApi } from "@/lib/api/proslync";
import { config } from "@/lib/config";

export default function HealthScreen() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await proslyncApi.getBackendHealth();
        if (!cancelled) setData(result);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>VPS Health</Text>
        <Text style={styles.dim}>Mode: {config.api.mode}</Text>
        <Text style={styles.dim}>Base URL: {config.api.baseUrl}</Text>
        {loading && <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />}
        {error && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>Error: {error}</Text>
          </View>
        )}
        {data && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.kv}>service: {data.service}</Text>
            <Text style={styles.kv}>version: {data.version}</Text>
            <Text style={styles.kv}>mode: {data.mode}</Text>
            <Text style={styles.kv}>
              endpoints: {Array.isArray(data.endpoints) ? data.endpoints.length : "?"}
            </Text>
            {Array.isArray(data.endpoints) &&
              data.endpoints.map((ep: any, i: number) => (
                <Text key={i} style={styles.ep}>
                  • {typeof ep === "string" ? ep : `${ep.method ?? ""} ${ep.path ?? JSON.stringify(ep)}`}
                </Text>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { padding: 16, paddingBottom: 64 },
  h1: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  dim: { color: "#888", fontSize: 13, marginBottom: 2 },
  kv: { color: "#fff", fontSize: 14, marginVertical: 1 },
  ep: { color: "#bbb", fontSize: 12, marginLeft: 8, marginVertical: 1 },
  errBox: {
    backgroundColor: "rgba(255,80,80,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.4)",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errText: { color: "#ff9b9b", fontSize: 13 },
});
