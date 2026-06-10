// ── PROSLYNC DEV IDENTITY DOCK ─────────────────────────────
// Floating draggable popup. In dev builds this is the ONLY way to
// switch user — `RoleSwitcherSheet` only impersonates within the
// current user's allowedRoles, it never changes user.id.
//
//   • Tap            → opens DevLoginSheet (user-switch)
//   • Long-press     → utility menu (switch role, cockpit, flags,
//                       backend status, user JSON, clear impersonation)
//   • Pan            → drag anywhere on screen, snaps to the closer
//                       horizontal edge after release
//
// Gated by `__DEV__` at the root layout — never rendered in prod. The
// internal isBackend gate is intentionally removed so non-superuser
// dev personas (player/brand/agent/coach/school/nilManager/fan) can
// still reach the user-switch picker.
//
// The pill renders the *currently active* identity (impersonation
// overrides the user's real role) with a role-tinted avatar so the
// user can see at a glance which persona the screen is rendering for.
import { Ionicons } from "@expo/vector-icons";
import { requireOptionalNativeModule } from "expo-modules-core";
import { usePathname, useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DevLoginSheet } from "@/components/auth/dev-login-sheet";
import { RoleSwitcherSheet } from "@/components/shared/role-switcher-menu";
import { DEV_MARKER_COLOR, getRoleVisual } from "@/lib/design/role-visuals";
import { useProslyncBackendHealth } from "@/hooks/use-proslync-backend";
import { getRouteForRoleSlot } from "@/lib/navigation/role-spine";
import { useActorContext } from "@/lib/providers/actor-context-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import { useImpersonation } from "@/lib/providers/impersonation-provider";
import { useMode, useRole, type ProfileRole } from "@/lib/providers/role-provider";
import { NATIVE_TAB_BAR_TOP_FROM_BOTTOM } from "@/lib/navigation/constants";
import { UserRole } from "@/lib/types/auth.types";

const DOCK_WIDTH = 132;
const DOCK_HEIGHT = 48;
const COMPACT_DOCK_SIZE = 44;
const EDGE_GUTTER = 12;
const DOCK_BOTTOM_CLEARANCE = NATIVE_TAB_BAR_TOP_FROM_BOTTOM + 64;

type DevMenuPreferencesModule = {
  setPreferencesAsync?: (settings: Record<string, unknown>) => Promise<void>;
};

const devMenuPreferences =
  requireOptionalNativeModule<DevMenuPreferencesModule>("DevMenuPreferences");

function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export function DevHud() {
  const { user } = useAuth();
  const { activePersona, setPersona, clearPersona } = useImpersonation();
  const { role: currentRole } = useRole();
  const { mode: currentMode } = useMode();
  const { identity: actorIdentity } = useActorContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [switcherVisible, setSwitcherVisible] = React.useState(false);
  const [devLoginVisible, setDevLoginVisible] = React.useState(false);
  const { status: backendStatus, refresh: refreshBackend } =
    useProslyncBackendHealth();

  React.useEffect(() => {
    devMenuPreferences
      ?.setPreferencesAsync?.({ showFloatingActionButton: false })
      .catch(() => {
        // Dev menu preferences are optional outside Expo dev-client.
      });
  }, []);

  const { width: screenW, height: screenH } = Dimensions.get("window");
  const compactDock = isProfessionalHomePath(pathname);
  const dockWidth = compactDock ? COMPACT_DOCK_SIZE : DOCK_WIDTH;
  const dockHeight = compactDock ? COMPACT_DOCK_SIZE : DOCK_HEIGHT;
  const bottomInset = Math.min(insets.bottom, 34);

  // Professional Home pages are visual QA surfaces. Keep the dev switcher
  // available, but collapse it into a small top-right control so it does
  // not cover the Buyer Brief hero, ribbon, or stream.
  const defaultX = screenW - dockWidth - insets.right - EDGE_GUTTER;
  const defaultY = compactDock
    ? insets.top + 68
    : screenH - dockHeight - bottomInset - DOCK_BOTTOM_CLEARANCE;

  const translateX = useSharedValue(defaultX);
  const translateY = useSharedValue(defaultY);
  const startX = useSharedValue(defaultX);
  const startY = useSharedValue(defaultY);
  const pressScale = useSharedValue(1);

  const minX = EDGE_GUTTER + insets.left;
  const maxX = screenW - dockWidth - insets.right - EDGE_GUTTER;
  const minY = insets.top + EDGE_GUTTER;
  const maxY = screenH - dockHeight - bottomInset - EDGE_GUTTER;

  React.useEffect(() => {
    translateX.value = withTiming(defaultX, { duration: 180 });
    translateY.value = withTiming(defaultY, { duration: 180 });
  }, [defaultX, defaultY, translateX, translateY]);

  const dockAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: pressScale.value },
    ],
  }));

  // Hook-rule compliance (Argent re-QA blocker): every React hook in this
  // component must run before any conditional early-return. `applyPersona`
  // is a useCallback added in the Slice D-fix; it was previously placed
  // after the `if (!isBackend) return null;` guard below, which threw
  // "Rendered more hooks than during the previous render" whenever
  // isBackend flipped between mounts. Keep it here.
  const applyPersona = React.useCallback(
    (role: ProfileRole) => {
      setPersona({
        key: role,
        label: role,
        userRole: UserRole.USER,
        profileRole: role,
      });
      setSwitcherVisible(false);
      setTimeout(() => {
        if (role === "fan") {
          router.replace("/(fan-tabs)" as any);
        } else {
          router.replace(getRouteForRoleSlot(role, "home") as any);
        }
      }, 80);
    },
    [router, setPersona],
  );

  // No isBackend gate — the outer {__DEV__ ? <DevHud /> : null} in
  // app/_layout.tsx ensures this only renders in dev builds. Inside dev
  // we want all personas (including non-backend ones) to reach the
  // user-switch picker so the allowedRoles enforcement can be exercised
  // without re-launching the app.

  // — actions — ----------------------------------------------------------

  // Tap = user-switch (DevLogin). The popup that the user described as
  // "the only way to switch user" is this sheet. Switching role lives
  // behind the long-press utility menu.
  const handleTap = () => {
    setMenuVisible(false);
    setSwitcherVisible(false);
    setDevLoginVisible(true);
  };

  const handleLongPress = () => {
    setSwitcherVisible(false);
    setDevLoginVisible(false);
    setMenuVisible(true);
  };

  const showBackendStatus = () => {
    setMenuVisible(false);
    const summary =
      backendStatus.state === "connected"
        ? `Connected\n${backendStatus.baseUrl}\nmode: ${backendStatus.mode}\nservice: ${backendStatus.health.service} v${backendStatus.health.version}\ndeals: ${backendStatus.health.contract.counts.deals} / athletes: ${backendStatus.health.contract.counts.athletes} / brands: ${backendStatus.health.contract.counts.brands} / evidence: ${backendStatus.health.contract.counts.evidencePackets}`
        : backendStatus.state === "unreachable"
          ? `Unreachable\n${backendStatus.baseUrl}\nmode: ${backendStatus.mode}\nerror: ${backendStatus.error}`
          : backendStatus.state === "connecting"
            ? `Connecting…\n${backendStatus.baseUrl}\nmode: ${backendStatus.mode}`
            : `Mock mode\nNo backend configured.\nSet EXPO_PUBLIC_PROSLYNC_API_MODE=local to connect to localhost:3020.`;
    Alert.alert("Backend status", summary);
    refreshBackend();
  };

  const openCockpit = () => {
    setMenuVisible(false);
    setTimeout(() => router.push("/_dev" as any), 50);
  };

  const openAtlasLab = () => {
    // Atlas dev server runs at :3000 in dev. Use the simulator's localhost
    // mapping. Argent-friendly: this triggers the simulator's URL-open
    // pipeline, which we can verify via `describe` + `gesture-tap`.
    setMenuVisible(false);
    setTimeout(() => {
      Linking.openURL("http://localhost:3000/library/lab").catch(() => {
        Alert.alert(
          "Atlas not running",
          "Start it with `cd atlas && pnpm dev -- --port 3000` then re-tap.",
        );
      });
    }, 50);
  };

  const showUserJson = () => {
    setMenuVisible(false);
    Alert.alert(
      "Current user",
      JSON.stringify(user, null, 2).slice(0, 1500),
    );
  };

  const handlePickPersona = (role: ProfileRole) => {
    // Mode-leak guard (Phase 1 Argent QA Blocker 3): if the user is
    // currently inside fan mode and picks a pro persona, we'd silently
    // flip them to /(tabs) on the next index redirect. Confirm the
    // intent first instead of dumping them into Brand HQ.
    //
    // Detection: expo-router strips group segments like "(fan-tabs)"
    // from pathname under most configs, so a pathname.includes check
    // alone returns false even when the fan shell is mounted. The
    // authoritative source is `mode` from RoleProvider, which is
    // pinned to 'fan' whenever the user is in the fan network.
    // pathname is kept as a secondary signal in case mode is briefly
    // out-of-sync during a transition.
    const inFanShell =
      currentMode === "fan" || (pathname?.includes("(fan-tabs)") ?? false);
    const targetLabel = getRoleVisual(role).label;
    if (inFanShell && role !== "fan") {
      Alert.alert(
        "Exit fan mode?",
        `Switching to ${targetLabel} will leave the fan experience and open the pro app.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Switch",
            style: "destructive",
            onPress: () => applyPersona(role),
          },
        ],
      );
      return;
    }
    applyPersona(role);
  };

  // — gestures — ---------------------------------------------------------

  const tap = Gesture.Tap()
    .maxDuration(280)
    .onEnd(() => {
      runOnJS(handleTap)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(380)
    .onStart(() => {
      pressScale.value = withTiming(1.06, { duration: 140 });
    })
    .onEnd(() => {
      pressScale.value = withTiming(1, { duration: 160 });
      runOnJS(handleLongPress)();
    })
    .onFinalize(() => {
      pressScale.value = withTiming(1, { duration: 160 });
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      pressScale.value = withTiming(1.08, { duration: 140 });
    })
    .onUpdate((event) => {
      translateX.value = clamp(
        startX.value + event.translationX,
        minX,
        maxX,
      );
      translateY.value = clamp(
        startY.value + event.translationY,
        minY,
        maxY,
      );
    })
    .onEnd(() => {
      // Snap to the nearer horizontal edge so the dock parks out of the
      // way after a drag instead of floating mid-screen.
      const midScreen = (minX + maxX) / 2;
      const target = translateX.value < midScreen ? minX : maxX;
      translateX.value = withTiming(target, { duration: 220 });
      pressScale.value = withTiming(1, { duration: 160 });
    })
    .onFinalize(() => {
      pressScale.value = withTiming(1, { duration: 160 });
    });

  const composedGesture = Gesture.Simultaneous(
    pan,
    Gesture.Exclusive(longPress, tap),
  );

  // — derived display state — --------------------------------------------

  const effectiveRole: ProfileRole = activePersona?.profileRole ?? currentRole;
  const visual = getRoleVisual(effectiveRole);
  const impersonating = Boolean(activePersona);
  const dockTint = visual.accent;
  return (
    <>
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          accessibilityLabel="Dev identity dock"
          accessibilityRole="button"
          accessibilityHint="Tap to switch user. Long-press for dev menu. Drag to relocate."
          collapsable={false}
          style={[
            styles.dock,
            compactDock && styles.dockCompact,
            {
              borderColor: `${dockTint}66`,
              shadowColor: dockTint,
            },
            dockAnimStyle,
          ]}
        >
          <View
            style={[
              styles.avatar,
              compactDock && styles.avatarCompact,
              { backgroundColor: dockTint },
            ]}
          >
            <Ionicons
              name={visual.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color="#FFFFFF"
            />
            {impersonating ? <View style={styles.impersonatingPip} /> : null}
          </View>
          {compactDock ? null : (
            <>
              <View style={styles.dockLabelBlock}>
                <Text style={styles.dockEyebrow} numberOfLines={1}>
                  {impersonating ? "AS" : "DEV"}
                </Text>
                <Text
                  style={[styles.dockLabel, { color: dockTint }]}
                  numberOfLines={1}
                >
                  {visual.label}
                </Text>
              </View>
              <Ionicons
                name="reorder-three"
                size={14}
                color="rgba(255,255,255,0.42)"
              />
            </>
          )}
        </Animated.View>
      </GestureDetector>

      {menuVisible && (
        <Pressable
          style={styles.scrim}
          onPress={() => setMenuVisible(false)}
        >
          <Animated.View
            style={[
              styles.menu,
              {
                bottom: insets.bottom + NATIVE_TAB_BAR_TOP_FROM_BOTTOM + 24,
                right: insets.right + EDGE_GUTTER,
                opacity: 1,
              },
            ]}
            entering={undefined}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderLabel}>Dev cockpit</Text>
              <Text style={styles.menuHeaderRole}>
                {impersonating ? `Impersonating ${visual.label}` : `Role: ${visual.label}`}
              </Text>
            </View>
            <MenuRow
              icon="swap-horizontal-outline"
              label="Switch user…"
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => setDevLoginVisible(true), 50);
              }}
            />
            <MenuRow
              icon="people-circle-outline"
              label="Switch role…"
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => setSwitcherVisible(true), 50);
              }}
            />
            <MenuRow
              icon="grid-outline"
              label="Open Backend cockpit"
              onPress={openCockpit}
            />
            <MenuRow
              icon="flask-outline"
              label="Open Atlas Lab"
              onPress={openAtlasLab}
            />
            <MenuRow
              icon="flag-outline"
              label="Toggle flags"
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => router.push("/_dev/flags" as any), 50);
              }}
            />
            <MenuRow
              icon={backendStatusIcon(backendStatus.state)}
              label={backendStatusLabel(backendStatus)}
              onPress={showBackendStatus}
            />
            <MenuRow
              icon="code-slash-outline"
              label="Show user JSON"
              onPress={showUserJson}
            />
            <MenuRow
              icon={
                actorIdentity.context === "professional"
                  ? "briefcase-outline"
                  : "happy-outline"
              }
              label={
                actorIdentity.source === "manual"
                  ? `Actor: ${actorIdentity.context} (manual)`
                  : actorIdentity.source === "explore-default"
                    ? `Actor: ${actorIdentity.context} · explore-default`
                    : `Actor: ${actorIdentity.context}`
              }
              onPress={() => {
                /* read-only — no-op to satisfy MenuRow contract */
              }}
            />
            <MenuRow
              icon="navigate-outline"
              label="Reset dock position"
              onPress={() => {
                setMenuVisible(false);
                translateX.value = withTiming(defaultX, { duration: 240 });
                translateY.value = withTiming(defaultY, { duration: 240 });
              }}
            />
            {impersonating ? (
              <MenuRow
                icon="close-circle-outline"
                label={`Clear impersonation (${visual.label})`}
                onPress={() => {
                  setMenuVisible(false);
                  clearPersona();
                }}
                danger
              />
            ) : null}
          </Animated.View>
        </Pressable>
      )}

      <RoleSwitcherSheet
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
        onPick={handlePickPersona}
      />
      <DevLoginSheet
        visible={devLoginVisible}
        onClose={() => setDevLoginVisible(false)}
      />
    </>
  );
}

function backendStatusIcon(
  state: "mock" | "connecting" | "connected" | "unreachable",
): keyof typeof Ionicons.glyphMap {
  switch (state) {
    case "connected":
      return "cloud-done-outline";
    case "unreachable":
      return "cloud-offline-outline";
    case "connecting":
      return "cloud-upload-outline";
    case "mock":
    default:
      return "flask-outline";
  }
}

function isProfessionalHomePath(pathname: string | null | undefined): boolean {
  return (
    pathname === "/" ||
    pathname === "/ad" ||
    pathname === "/nil" ||
    pathname === "/athlete" ||
    pathname === "/brand" ||
    pathname === "/role" ||
    pathname === "/school/approval-queue" ||
    pathname === "/school/rev-share" ||
    pathname === "/school/risk-report" ||
    Boolean(pathname?.startsWith("/deal/")) ||
    Boolean(pathname?.startsWith("/athlete/disclosures"))
  );
}

function isTriadPath(pathname: string | null | undefined): boolean {
  return (
    pathname === "/explore" ||
    pathname === "/(tabs)/explore" ||
    Boolean(pathname?.endsWith("/explore"))
  );
}

function backendStatusLabel(
  status: ReturnType<typeof useProslyncBackendHealth>["status"],
): string {
  switch (status.state) {
    case "connected":
      return `Backend connected (${status.mode})`;
    case "unreachable":
      return `Backend unreachable (${status.mode})`;
    case "connecting":
      return `Backend connecting (${status.mode})…`;
    case "mock":
    default:
      return "Backend mock mode";
  }
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Ionicons
        name={icon}
        size={18}
        color={danger ? "#FF453A" : "rgba(255,255,255,0.85)"}
      />
      <Text style={[styles.menuLabel, danger && { color: "#FF453A" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    top: 0,
    left: 0,
    width: DOCK_WIDTH,
    height: DOCK_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingLeft: 7,
    paddingRight: 10,
    borderRadius: 24,
    backgroundColor: "rgba(15,16,18,0.94)",
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 9999,
  },
  dockCompact: {
    width: COMPACT_DOCK_SIZE,
    height: COMPACT_DOCK_SIZE,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: COMPACT_DOCK_SIZE / 2,
    justifyContent: "center",
    gap: 0,
    backgroundColor: "rgba(15,16,18,0.78)",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  impersonatingPip: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: DEV_MARKER_COLOR,
    borderColor: "rgba(15,16,18,0.94)",
    borderWidth: 2,
  },
  dockLabelBlock: {
    flex: 1,
    justifyContent: "center",
  },
  dockEyebrow: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dockLabel: {
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 1,
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  menu: {
    position: "absolute",
    minWidth: 260,
    backgroundColor: "#0F1012",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 6,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 16,
  },
  menuHeader: {
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 4,
  },
  menuHeaderLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  menuHeaderRole: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuLabel: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
});
