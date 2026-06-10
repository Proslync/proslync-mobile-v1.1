// ARGENT-QA-PASS-2026-05-12T06 [DUPLICATE] rgbaFromHex() duplicates the
// same function in constants/colors.ts:~290. Extract to lib/utils/color.ts
// or fold into a shared design-token module.
// [REUSE] Per-role visual map could become the source of truth for
// "secondary signal hue" decisions (PLAN §5e drift catalog).
import { Brand, RoleAccent } from "@/constants/brand";
import type { ProfileRole } from "@/lib/providers/role-provider";

export type RoleVisualKey =
  | "athlete"
  | "agent"
  | "brand"
  | "fan"
  | "school"
  | "superuser";

export type RoleVisual = {
  key: RoleVisualKey;
  label: string;
  shortLabel: string;
  initial: string;
  icon: string;
  outlineIcon: string;
  accent: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  text: string;
  rule: string;
};

function rgbaFromHex(hex: string, alpha: number): string {
  const h = hex.replace(/^#/, "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeVisual(
  key: RoleVisualKey,
  input: Omit<RoleVisual, "key" | "surface" | "surfaceSubtle" | "border" | "text">,
): RoleVisual {
  return {
    key,
    ...input,
    surface: rgbaFromHex(input.accent, 0.08),
    surfaceSubtle: rgbaFromHex(input.accent, 0.04),
    border: rgbaFromHex(input.accent, 0.18),
    text: input.accent,
  };
}

export const ROLE_VISUALS: Record<RoleVisualKey, RoleVisual> = {
  athlete: makeVisual("athlete", {
    label: "Athlete",
    shortLabel: "Athlete",
    initial: "A",
    icon: "basketball",
    outlineIcon: "basketball-outline",
    accent: RoleAccent.athlete,
    rule: "Player and coach surfaces use the same dusty athlete cue.",
  }),
  agent: makeVisual("agent", {
    label: "Agent",
    shortLabel: "Agent",
    initial: "G",
    icon: "people",
    outlineIcon: "people-outline",
    accent: RoleAccent.agent,
    rule: "Agent is a warm-sand relationship marker, never a pipeline-state fill.",
  }),
  brand: makeVisual("brand", {
    label: "Brand",
    shortLabel: "Brand",
    initial: "B",
    icon: "briefcase",
    outlineIcon: "briefcase-outline",
    accent: RoleAccent.brand,
    rule: "Brand can carry copper, but copper still has the same per-screen ceiling.",
  }),
  fan: makeVisual("fan", {
    label: "Fan",
    shortLabel: "Fan",
    initial: "F",
    icon: "heart",
    outlineIcon: "heart-outline",
    accent: RoleAccent.fan,
    rule: "Fan is a muted rose metadata cue, not a separate app skin.",
  }),
  school: makeVisual("school", {
    label: "AD",
    shortLabel: "School",
    initial: "S",
    icon: "school",
    outlineIcon: "school-outline",
    accent: RoleAccent.school,
    rule: "School and NIL Manager share the same slate oversight cue.",
  }),
  superuser: makeVisual("superuser", {
    label: "Superuser",
    shortLabel: "Dev",
    initial: "D",
    icon: "construct",
    outlineIcon: "construct-outline",
    accent: Brand.colors.copper,
    rule: "Dev-only user switching uses neutral chrome plus a copper marker.",
  }),
};

export const PROFILE_ROLE_TO_VISUAL_KEY: Record<ProfileRole, RoleVisualKey> = {
  player: "athlete",
  coach: "athlete",
  agent: "agent",
  brand: "brand",
  fan: "fan",
  school: "school",
  nilManager: "school",
};

export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  player: "Athlete",
  coach: "Coach",
  agent: "Agent",
  brand: "Brand",
  fan: "Fan",
  school: "AD",
  nilManager: "NIL Mgr",
};

export const PROFILE_ROLE_INITIALS: Record<ProfileRole, string> = {
  player: "A",
  coach: "C",
  agent: "G",
  brand: "B",
  fan: "F",
  school: "S",
  nilManager: "N",
};

export const PROFILE_ROLE_ICONS: Record<ProfileRole, { icon: string; outlineIcon: string }> = {
  player: { icon: "basketball", outlineIcon: "basketball-outline" },
  coach: { icon: "megaphone", outlineIcon: "megaphone-outline" },
  agent: { icon: "people", outlineIcon: "people-outline" },
  brand: { icon: "briefcase", outlineIcon: "briefcase-outline" },
  fan: { icon: "heart", outlineIcon: "heart-outline" },
  school: { icon: "school", outlineIcon: "school-outline" },
  nilManager: { icon: "shield-checkmark", outlineIcon: "shield-checkmark-outline" },
};

export const PROFILE_ROLE_ORDER: ProfileRole[] = [
  "player",
  "coach",
  "agent",
  "brand",
  "fan",
  "school",
  "nilManager",
];

export const DEV_MARKER_COLOR = Brand.colors.copper;

export function getRoleVisual(role: ProfileRole): RoleVisual {
  const base = ROLE_VISUALS[PROFILE_ROLE_TO_VISUAL_KEY[role]];
  const icon = PROFILE_ROLE_ICONS[role];
  return {
    ...base,
    label: PROFILE_ROLE_LABELS[role],
    shortLabel: base.shortLabel,
    initial: PROFILE_ROLE_INITIALS[role],
    icon: icon.icon,
    outlineIcon: icon.outlineIcon,
  };
}

export function getDevPersonaVisual(key: ProfileRole | "superuser"): RoleVisual {
  if (key === "superuser") return ROLE_VISUALS.superuser;
  return getRoleVisual(key);
}
