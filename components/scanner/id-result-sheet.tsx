import { TAG_COLORS } from "@/components/check-ins/utils";
import { NativeSheet } from "@/components/ui/native-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface IdScanResult {
  title: string;
  subtitle?: string;
  status: "success" | "warning" | "error";
  fields: { label: string; value: string }[];
  ticketStatus?: "found" | "rsvp" | "none" | "skipped";
  ticketInfo?: string;
}

interface IdResultSheetProps {
  isPresented: boolean;
  idResult: IdScanResult | null;
  isValidating: boolean;
  isSubmitting: boolean;
  venueTags?: string[];
  onApprove: () => void;
  onDeny: () => void;
  onScanNext: () => void;
  onDismiss: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "error":
      return "#ef4444";
    default:
      return "#fff";
  }
};

const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case "success":
      return "checkmark-circle";
    case "warning":
      return "alert-circle";
    case "error":
      return "close-circle";
    default:
      return "checkmark-circle";
  }
};

const getTicketBadge = (ticketStatus?: string) => {
  switch (ticketStatus) {
    case "found":
      return {
        label: "Ticket Found",
        color: "#10b981",
        bg: "rgba(16,185,129,0.15)",
      };
    case "rsvp":
      return { label: "RSVP'd", color: "#10b981", bg: "rgba(16,185,129,0.15)" };
    case "none":
      return {
        label: "No Ticket",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.15)",
      };
    case "skipped":
      return {
        label: "Card Not Scanned",
        color: "rgba(255,255,255,0.4)",
        bg: "rgba(255,255,255,0.08)",
      };
    default:
      return null;
  }
};

export function IdResultSheet({
  isPresented,
  idResult,
  isValidating,
  isSubmitting,
  venueTags = [],
  onApprove,
  onDeny,
  onScanNext,
  onDismiss,
}: IdResultSheetProps) {
  if (!idResult) return null;

  const statusColor = getStatusColor(idResult.status);
  const ticketBadge = getTicketBadge(idResult.ticketStatus);

  return (
    <NativeSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      detents={[{ fraction: 0.75 }, "large"]}
      rnContent
      scrollable
    >
      <View style={styles.container}>
        {/* Status indicator */}
        <View
          style={[styles.statusIndicator, { backgroundColor: statusColor }]}
        >
          <Ionicons
            name={getStatusIcon(idResult.status)}
            size={32}
            color="#fff"
          />
        </View>

        {/* Status badge */}
        {idResult.subtitle && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {idResult.subtitle}
            </Text>
          </View>
        )}

        {/* Ticket status — prominent */}
        {ticketBadge && (
          <View
            style={[
              styles.ticketBadge,
              {
                backgroundColor: ticketBadge.bg,
                borderColor: `${ticketBadge.color}30`,
              },
            ]}
          >
            <Ionicons
              name={
                idResult.ticketStatus === "found" ||
                idResult.ticketStatus === "rsvp"
                  ? "ticket-outline"
                  : "alert-circle-outline"
              }
              size={18}
              color={ticketBadge.color}
            />
            <Text
              style={[styles.ticketBadgeText, { color: ticketBadge.color }]}
            >
              {ticketBadge.label}
            </Text>
            {idResult.ticketInfo && idResult.ticketStatus === "found" && (
              <Text
                style={[styles.ticketBadgeDetail, { color: ticketBadge.color }]}
              >
                {idResult.ticketInfo}
              </Text>
            )}
          </View>
        )}

        {/* Venue tags — separated from ticket info */}
        {venueTags.length > 0 && (
          <>
            <View style={styles.separator} />
            <View style={styles.tagsRow}>
              {venueTags.map((tag) => {
                const color = TAG_COLORS[tag] || "#6b7280";
                return (
                  <View
                    key={tag}
                    style={[styles.tagBadge, { backgroundColor: `${color}25` }]}
                  >
                    <View style={[styles.tagDot, { backgroundColor: color }]} />
                    <Text style={[styles.tagBadgeText, { color }]}>
                      {tag.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Validating indicator */}
        {isValidating && (
          <View style={styles.validatingRow}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
            <Text style={styles.validatingText}>Verifying...</Text>
          </View>
        )}

        {/* Name */}
        <Text style={styles.resultName}>{idResult.title}</Text>

        {/* Fields */}
        {idResult.fields.length > 0 && (
          <View style={styles.fieldsGrid}>
            {idResult.fields.map((field, index) => (
              <View key={index} style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>{field.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.resultActions}>
          {idResult.status !== "error" &&
            idResult.title !== "Could Not Read ID" && (
              <TouchableOpacity
                style={styles.approveButton}
                onPress={onApprove}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

          {idResult.title !== "Could Not Read ID" && (
            <TouchableOpacity
              style={styles.denyButton}
              onPress={onDeny}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={styles.denyButtonText}>Deny</Text>
            </TouchableOpacity>
          )}

          {idResult.title === "Could Not Read ID" && (
            <TouchableOpacity
              style={styles.scanNextButton}
              onPress={onScanNext}
              activeOpacity={0.8}
            >
              <Ionicons name="scan-outline" size={20} color="#fff" />
              <Text style={styles.scanNextButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  statusIndicator: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
    width: "100%",
    justifyContent: "center",
  },
  ticketBadgeText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    letterSpacing: 0.3,
  },
  ticketBadgeDetail: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    opacity: 0.7,
  },
  separator: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  validatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  validatingText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
  resultName: {
    fontSize: 26,
    fontFamily: "Lato_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 28,
    width: "100%",
  },
  fieldItem: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    backgroundColor: "#10b981",
  },
  approveButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  denyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.1)",
    gap: 6,
  },
  denyButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "#ef4444",
  },
  scanNextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    gap: 6,
  },
  scanNextButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
});
