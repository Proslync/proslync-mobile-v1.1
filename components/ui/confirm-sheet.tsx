import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { GlassView, GlassContainer } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { NativeSheet, canUseNativeSheet } from "./native-sheet";
import { ConfirmModal as ConfirmModalFallback } from "@/components/shared/confirm-modal";

interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** When true, shows only a single "OK" button (no cancel). Used for error/info alerts. */
  alertOnly?: boolean;
}

export function ConfirmSheet(props: ConfirmSheetProps) {
  if (!canUseNativeSheet()) {
    return <ConfirmModalFallback {...props} />;
  }

  return <NativeConfirmSheet {...props} />;
}

function NativeConfirmSheet({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isLoading = false,
  icon,
  alertOnly = false,
}: ConfirmSheetProps) {
  const iconColor = destructive ? "#ff3b30" : "#1A1A1A";

  const handleCancel = React.useCallback(() => {
    onClose();
  }, [onClose]);

  const handleConfirm = React.useCallback(() => {
    onClose();
    onConfirm?.();
  }, [onClose, onConfirm]);

  return (
    <NativeSheet
      isPresented={visible}
      onDismiss={onClose}
      detents={[{ fraction: 0.35 }]}
      rnContent
      dragIndicator="visible"
    >
      <View style={styles.container}>
        <GlassContainer spacing={8} style={styles.glassContainer}>
          {/* Icon + text header */}
          <GlassView
            {...liquidGlass.surface}
            borderRadius={24}
            style={styles.headerGlass}
          >
            {icon && (
              <View style={styles.iconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={28}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name={icon} size={28} color={iconColor} />
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </GlassView>

          {/* Action buttons */}
          <View style={styles.actionsGlass}>
            {alertOnly ? (
              <TouchableOpacity
                style={styles.btn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.cancelBtn,
                    isLoading && { opacity: 0.5 },
                  ]}
                  onPress={handleCancel}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...liquidGlass.fillMedium}
                    borderRadius={14}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.cancelText}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.confirmBtn,
                    isLoading && { opacity: 0.5 },
                  ]}
                  onPress={handleConfirm}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...(destructive
                      ? liquidGlass.danger
                      : liquidGlass.fillStrong)}
                    borderRadius={14}
                    style={StyleSheet.absoluteFill}
                    isInteractive
                  />
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#1A1A1A" />
                  ) : (
                    <Text style={styles.confirmText}>{confirmLabel}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassContainer>
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  glassContainer: {
    gap: 8,
  },
  headerGlass: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  title: {
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.45)",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsGlass: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
    overflow: "hidden",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  confirmBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  cancelText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  confirmText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
});
