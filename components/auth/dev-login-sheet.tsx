import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { config } from "@/lib/config";
import {
  DEV_PERSONAS,
  buildMockUser,
  devLoginWithBackend,
  type DevPersona,
} from "@/lib/dev/dev-personas";
import { useAuth } from "@/lib/providers/auth-provider";
import { useFanAuth } from "@/lib/providers/fan-auth-provider";
import { useImpersonation } from "@/lib/providers/impersonation-provider";
import { useRole, type ProfileRole } from "@/lib/providers/role-provider";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { UserRole as UR } from "@/lib/types/auth.types";
import { FAN_PROFILE } from "@/lib/data/mock-fan-data";
import type { FanUser, IdentityLink } from "@/lib/types/fan.types";

// Mirrors backend DevUserSummary in proslync-backend/src/services/dev.ts.
type DevUserSummary = {
  id: number;
  phoneNumber: string;
  userName: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  productRoles: string[];
  primaryProductRole: string | null;
  persona: { label: string; subtitle: string; icon: string; tint: string };
};

type SheetMode = "curated" | "all";

interface DevLoginSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DevLoginSheet({ visible, onClose }: DevLoginSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { devLogin } = useAuth();
  const { __devSignIn: fanDevSignIn } = useFanAuth();
  const { clearPersona } = useImpersonation();
  const { adoptRoleForIdentity } = useRole();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<SheetMode>("curated");
  const [allUsers, setAllUsers] = React.useState<DevUserSummary[] | null>(null);
  const [allLoading, setAllLoading] = React.useState(false);
  const [allError, setAllError] = React.useState<string | null>(null);

  // Reset to curated on close so a fresh open always lands on the 8 hand-curated personas.
  React.useEffect(() => {
    if (!visible) setMode("curated");
  }, [visible]);

  // Fetch the full seeded-users list on first transition to 'all'. Cached after success.
  React.useEffect(() => {
    if (mode !== "all" || allUsers || allLoading) return;
    let cancelled = false;
    setAllLoading(true);
    setAllError(null);
    void (async () => {
      try {
        const url = `${config.api.proBaseUrl}/api/dev/users`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { users: DevUserSummary[] };
        if (!cancelled) setAllUsers(json.users);
      } catch (err) {
        if (!cancelled)
          setAllError(err instanceof Error ? err.message : "fetch failed");
      } finally {
        if (!cancelled) setAllLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, allUsers, allLoading]);

  // Fan-auth bridge: every dev persona carries `'fan'` in allowedRoles (they
  // can all switch into fan mode), so we seed a synthetic fan-auth session
  // alongside the pro devLogin. Without this the `(fan-tabs)/profile` Account
  // page renders the "Sign in / Sign up" card the first time the user lands
  // in fan mode. No tokens are persisted; a cold reload reverts to the real
  // `/me` hydrate path, same as the pro side.
  const applyDevLogin = (
    persona: DevPersona,
    user: import("@/lib/types/auth.types").User,
  ) => {
    clearPersona();
    devLogin(user);
    if (persona.allowedRoles.includes("fan")) {
      const fanUser: FanUser = {
        id: `dev-fan-${persona.key}`,
        handle:
          persona.primaryRole === "fan" ? FAN_PROFILE.username : persona.key,
        displayName:
          persona.primaryRole === "fan"
            ? `${FAN_PROFILE.firstName} ${FAN_PROFILE.lastName}`
            : persona.label,
        phoneNumber: persona.phoneNumber,
        isVerified: false,
      };
      const identityLink: IdentityLink = {
        fanUserId: fanUser.id,
        proUserId: (user.id as number | undefined) ?? null,
        handle: fanUser.handle,
        hasLinkedProUser: user.id != null,
      };
      fanDevSignIn(fanUser, identityLink);
    }
    onClose();
    adoptRoleForIdentity(persona.primaryRole);
    router.replace("/(tabs)/profile" as any);
  };

  const handleSelect = async (persona: DevPersona) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(persona.key);

    const result = await devLoginWithBackend(persona);

    if (result.success) {
      const serverRoles = (result.user.allowedRoles ??
        result.user.productRoles) as string[] | undefined;
      const merged: import("@/lib/types/auth.types").User = {
        ...result.user,
        allowedRoles:
          serverRoles && serverRoles.length > 0
            ? serverRoles
            : (persona.allowedRoles as unknown as string[]),
        primaryProductRole:
          (result.user.primaryProductRole as string | null | undefined) ??
          (persona.primaryRole as string),
      };
      applyDevLogin(persona, merged);
    } else {
      const mock = buildMockUser(persona);
      applyDevLogin(persona, mock);
    }

    setLoading(null);
  };

  // For a /api/dev/users row, synthesize a minimum DevPersona shape and pipe
  // it through the same handleSelect → devLoginWithBackend flow.
  const handleSelectFromSummary = (u: DevUserSummary) => {
    const synthetic: DevPersona = {
      key: `seed-${u.id}`,
      label: u.persona.label,
      subtitle: u.persona.subtitle,
      icon: u.persona.icon,
      tint: u.persona.tint,
      phoneNumber: u.phoneNumber,
      primaryRole: (u.primaryProductRole ?? "fan") as ProfileRole,
      userRole: u.role === "admin" ? UR.ADMIN : UR.USER,
      allowedRoles:
        u.productRoles.length > 0
          ? (u.productRoles as ProfileRole[])
          : (["fan"] as ProfileRole[]),
      ...(u.role === "admin" ? { isBackend: true } : {}),
    };
    void handleSelect(synthetic);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(140)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(160).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(160)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {mode === "curated" ? "Dev Login" : "All users"}
            </Text>
            {mode === "all" ? (
              <Pressable
                onPress={() => setMode("curated")}
                style={({ pressed }) => [
                  styles.backChip,
                  pressed && styles.backChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back to curated personas"
              >
                <Ionicons name="chevron-back" size={14} color="#FFFFFF" />
                <Text style={styles.backChipText}>Back</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.subtitle}>
            {mode === "curated"
              ? "Seeded backend users — hits /api/dev/login"
              : allUsers
                ? `${allUsers.length} users in database`
                : "Loading seeded users…"}
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {mode === "curated" ? (
              <>
                {DEV_PERSONAS.map((persona) => (
                  <PersonaTile
                    key={persona.key}
                    persona={persona}
                    isLoading={loading === persona.key}
                    disabled={loading !== null}
                    onPress={() => handleSelect(persona)}
                  />
                ))}
                <MoreTile onPress={() => setMode("all")} />
              </>
            ) : allLoading ? (
              <View style={styles.statusBox}>
                <ActivityIndicator color="#EB621A" />
              </View>
            ) : allError ? (
              <View style={styles.statusBox}>
                <Text style={styles.errorText}>Couldn’t load users · {allError}</Text>
                <Pressable
                  onPress={() => {
                    setAllUsers(null);
                    setAllError(null);
                  }}
                  style={({ pressed }) => [
                    styles.retryChip,
                    pressed && styles.retryChipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading users"
                >
                  <Text style={styles.retryChipText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              (allUsers ?? []).map((u) => (
                <SummaryTile
                  key={u.id}
                  user={u}
                  isLoading={loading === `seed-${u.id}`}
                  disabled={loading !== null}
                  onPress={() => handleSelectFromSummary(u)}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function PersonaTile({
  persona,
  isLoading,
  disabled,
  onPress,
}: {
  persona: DevPersona;
  isLoading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const hasCustomAvatar = Boolean(persona.avatarLocalSource || persona.avatarEntityId);
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Log in as ${persona.label}`}
    >
      {hasCustomAvatar && !isLoading ? (
        <EntityAvatar
          entityId={persona.avatarEntityId}
          localSource={persona.avatarLocalSource ?? null}
          size={36}
          shape="circle"
          borderWidth={1}
          borderColor={persona.tint + "50"}
        />
      ) : (
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: persona.tint + "20",
              borderColor: persona.tint + "50",
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={persona.tint} />
          ) : (
            <Ionicons name={persona.icon as any} size={18} color={persona.tint} />
          )}
        </View>
      )}
      <View style={styles.tileText}>
        <Text style={styles.tileLabel} numberOfLines={1} ellipsizeMode="tail">
          {persona.label}
        </Text>
        <Text style={styles.tileSub} numberOfLines={1} ellipsizeMode="tail">
          {persona.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function SummaryTile({
  user,
  isLoading,
  disabled,
  onPress,
}: {
  user: DevUserSummary;
  isLoading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const display = user.persona;
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Log in as ${display.label}`}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: display.tint + "20",
            borderColor: display.tint + "50",
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={display.tint} />
        ) : (
          <Ionicons name={display.icon as any} size={18} color={display.tint} />
        )}
      </View>
      <View style={styles.tileText}>
        <Text style={styles.tileLabel} numberOfLines={1} ellipsizeMode="tail">
          {display.label}
        </Text>
        <Text style={styles.tileSub} numberOfLines={1} ellipsizeMode="tail">
          {display.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function MoreTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        styles.moreTile,
        pressed && styles.tilePressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="All users"
    >
      <View style={[styles.iconBox, styles.moreIconBox]}>
        <Ionicons name="add-circle-outline" size={20} color="#EB621A" />
      </View>
      <View style={styles.tileText}>
        <Text style={styles.tileLabel}>All users</Text>
        <Text style={styles.tileSub}>Any seeded user</Text>
      </View>
    </Pressable>
  );
}

export function DevLoginButton({ onPress }: { onPress: () => void }) {
  if (!__DEV__) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.devBtn, pressed && styles.devBtnPressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Dev Login"
    >
      <Ionicons name="flash" size={14} color="#EB621A" />
      <Text style={styles.devBtnText}>Dev Login</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1A1A1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "75%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  backChip: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  backChipPressed: { backgroundColor: "rgba(255,255,255,0.14)" },
  backChipText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  list: { flexGrow: 0 },
  listContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
  },
  tile: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minHeight: 60,
  },
  tilePressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  moreTile: { borderColor: "rgba(235,98,26,0.30)", borderStyle: "dashed" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  moreIconBox: {
    backgroundColor: "rgba(235,98,26,0.12)",
    borderColor: "rgba(235,98,26,0.35)",
  },
  tileText: { flex: 1 },
  tileLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  tileSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  statusBox: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(235,98,26,0.12)",
    borderWidth: 1,
    borderColor: "rgba(235,98,26,0.35)",
  },
  retryChipPressed: { backgroundColor: "rgba(235,98,26,0.22)" },
  retryChipText: { color: "#EB621A", fontSize: 12, fontWeight: "700" },
  devBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "rgba(235,98,26,0.1)",
    borderWidth: 1,
    borderColor: "rgba(235,98,26,0.3)",
    alignSelf: "center",
  },
  devBtnPressed: { backgroundColor: "rgba(235,98,26,0.2)" },
  devBtnText: { color: "#EB621A", fontSize: 14, fontWeight: "600" },
});
