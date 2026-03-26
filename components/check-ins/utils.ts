import type { EventAttendee } from "@/lib/types/events.types";
import { EventUserStatus } from "@/lib/types/events.types";

export interface CheckInContact {
  id: number;
  name: string;
  userName?: string;
  avatarUrl?: string;
  isGuest: boolean;
  source: string;
  lastSeenAt?: string;
  paid: boolean;
  userId?: number;
  phoneNumber?: string;
  email?: string;
  birthDate?: string;
  documentNumber?: string;
  tags?: string[];
  checkInStatus: "approved" | "denied";
}

export const TAG_COLORS: Record<string, string> = {
  free_entry: "#3b82f6",
  vip: "#f59e0b",
  line_skip: "#22c55e",
  backstage: "#a855f7",
  comp: "#3b82f6",
  plus_one: "#ec4899",
};

export const PREDEFINED_VENUE_TAGS = [
  { key: "free_entry", label: "Free Entry" },
  { key: "vip", label: "VIP" },
  { key: "line_skip", label: "Line Skip" },
  { key: "backstage", label: "Backstage" },
] as const;

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sourceLabel(source: string, isGuest: boolean): string {
  if (isGuest) return "Guest";
  if (source === "rsvp") return "RSVP";
  if (source === "ticket_purchase") return "Ticket";
  return "";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function mapAttendee(a: EventAttendee): CheckInContact {
  const name =
    [a.firstName, a.lastName].filter(Boolean).join(" ") ||
    a.guestName ||
    "Unknown";
  const isGuest = a.isGuest ?? !a.userId;
  const isCheckedIn =
    a.checkedIn ||
    a.status === EventUserStatus.CHECKED_IN ||
    a.status === EventUserStatus.VERIFIED ||
    a.status === EventUserStatus.CONFIRMED;
  let source = "check_in";
  if (a.status === EventUserStatus.SIGNED_UP) source = "rsvp";
  else if (a.isRegistered && !isCheckedIn) source = "rsvp";
  const checkInStatus =
    a.status === EventUserStatus.REJECTED ||
    a.status === EventUserStatus.CANCELLED
      ? "denied"
      : "approved";
  return {
    id: a.id,
    name,
    userName: a.userName,
    avatarUrl: a.avatarUrl || a.avatar,
    isGuest,
    source,
    lastSeenAt: a.checkedInAt || a.verifiedAt || a.createdAt,
    paid: false,
    userId: a.userId,
    phoneNumber: a.phoneNumber,
    email: a.email,
    birthDate: a.birthDate,
    tags: a.tags,
    checkInStatus,
  };
}
