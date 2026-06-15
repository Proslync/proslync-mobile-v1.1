import { config } from "../config";
import { apiClient } from "../api/client";
import { getDevPersonaVisual } from "../design/role-visuals";
import { logger } from "./logger";
import type { ProfileRole } from "../providers/role-provider";
import type { User, UserRole } from "../types/auth.types";
import { UserRole as UR } from "../types/auth.types";
import { ROLE_PERSONA } from "../demo/personas";

const log = logger.tagged("dev-login");

export interface DevPersona {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  tint: string;
  phoneNumber: string;
  primaryRole: ProfileRole;
  userRole: UserRole;
  /** Roles this persona is entitled to view-switch into (in-app role
   * switcher allowlist). Backend-staff personas bypass via isBackend. */
  allowedRoles: ProfileRole[];
  /** When true, this persona has the cockpit + DevHud unlock. Should only
   * be true for the superuser persona; other personas mimic regular users
   * so the allowedRoles enforcement is faithfully exercised in dev. */
  isBackend?: boolean;
  /** Optional visual-asset entityId — when set, persona picker renders the
   * registry SVG instead of the tinted Ionicons box. Falls back to icon. */
  avatarEntityId?: string;
  /** Optional local require()'d image — preferred over avatarEntityId when
   * a curated photo exists (e.g. coach-avatar.png, kiyan-avatar.png). */
  avatarLocalSource?: any;
}

export const DEV_PERSONAS: DevPersona[] = [
  {
    key: "superuser",
    label: "Superuser",
    subtitle: "Admin",
    icon: "construct-outline",
    tint: getDevPersonaVisual("superuser").accent,
    phoneNumber: "+15555550100",
    primaryRole: "player",
    userRole: UR.ADMIN,
    allowedRoles: ["player", "coach", "agent", "brand", "fan", "school", "nilManager"],
    isBackend: true,
  },
  {
    key: "player",
    label: "Athlete",
    subtitle: ROLE_PERSONA.player.displayName,
    icon: "basketball-outline",
    tint: getDevPersonaVisual("player").accent,
    phoneNumber: "+15555550101",
    primaryRole: "player",
    userRole: UR.USER,
    allowedRoles: ["player", "fan"],
    avatarLocalSource: require("@/assets/images/kiyan-avatar.png"),
    avatarEntityId: "at-kiyan",
  },
  {
    key: "brand",
    label: "Brand",
    subtitle: ROLE_PERSONA.brand.displayName,
    icon: "briefcase-outline",
    tint: getDevPersonaVisual("brand").accent,
    phoneNumber: "+15555550102",
    primaryRole: "brand",
    userRole: UR.USER,
    allowedRoles: ["brand", "fan"],
    avatarEntityId: "brand-puma",
  },
  {
    key: "agent",
    label: "Agent",
    subtitle: ROLE_PERSONA.agent.displayName,
    icon: "people-outline",
    tint: getDevPersonaVisual("agent").accent,
    phoneNumber: "+15555550103",
    primaryRole: "agent",
    userRole: UR.USER,
    allowedRoles: ["agent", "fan"],
    avatarLocalSource: require("@/assets/images/contact-rich-paul.png"),
  },
  {
    key: "school",
    label: "Athletic Director",
    subtitle: ROLE_PERSONA.school.displayName,
    icon: "school-outline",
    tint: getDevPersonaVisual("school").accent,
    phoneNumber: "+15555550104",
    primaryRole: "school",
    userRole: UR.USER,
    allowedRoles: ["school", "nilManager", "fan"],
    avatarEntityId: "school-duke",
  },
  {
    key: "nilManager",
    label: "NIL Manager",
    subtitle: ROLE_PERSONA.nilManager.displayName,
    icon: "shield-checkmark-outline",
    tint: getDevPersonaVisual("nilManager").accent,
    phoneNumber: "+15555550105",
    primaryRole: "nilManager",
    userRole: UR.USER,
    allowedRoles: ["nilManager", "fan"],
    avatarLocalSource: require("@/assets/images/brand/transparent/proslync-mark-256.png"),
  },
  {
    key: "coach",
    label: "Coach",
    subtitle: ROLE_PERSONA.coach.displayName,
    icon: "megaphone-outline",
    tint: getDevPersonaVisual("coach").accent,
    phoneNumber: "+15555550106",
    primaryRole: "coach",
    userRole: UR.USER,
    allowedRoles: ["coach", "fan"],
    avatarLocalSource: require("@/assets/images/coach-avatar.png"),
  },
  {
    key: "fan",
    label: "Fan",
    subtitle: ROLE_PERSONA.fan.displayName,
    icon: "heart-outline",
    tint: getDevPersonaVisual("fan").accent,
    phoneNumber: "+15555550107",
    primaryRole: "fan",
    userRole: UR.USER,
    allowedRoles: ["fan"],
  },
];

interface DevLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function devLoginWithBackend(
  persona: DevPersona,
): Promise<{ user: User; success: true } | { success: false; error: string }> {
  const devUrl = `${config.api.proBaseUrl}/api/dev/login`;
  log.info(`Dev login → ${devUrl} as ${persona.phoneNumber}`);

  try {
    const res = await fetch(devUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: persona.phoneNumber }),
    });

    if (!res.ok) {
      const body = await res.text();
      log.error(`Dev login failed (${res.status}):`, body);
      return { success: false, error: `${res.status}: ${body}` };
    }

    const data: DevLoginResponse = await res.json();
    await apiClient.setAccessToken(data.accessToken);
    await apiClient.setRefreshToken(data.refreshToken);
    log.info("Dev login OK — user:", data.user.userName ?? data.user.id);
    return { success: true, user: data.user };
  } catch (err: any) {
    log.error("Dev login network error:", err?.message);
    return { success: false, error: err?.message ?? "Network error" };
  }
}

export function buildMockUser(persona: DevPersona): User {
  return {
    id: 99_000 + DEV_PERSONAS.indexOf(persona),
    phoneNumber: persona.phoneNumber,
    status: "active",
    role: persona.userRole,
    isProfileComplete: true,
    isAppleMessagesLinked: true,
    staffFlags: persona.isBackend ? { isBackend: true } : {},
    allowedRoles: persona.allowedRoles,
    productRoles: persona.allowedRoles,
    primaryProductRole: persona.primaryRole,
    firstName: persona.label,
    lastName: "(dev)",
    userName: persona.key,
    bio: persona.subtitle,
  } as User;
}
