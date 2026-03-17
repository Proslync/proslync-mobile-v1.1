// Status Card Menu Sheet — QR code + tier perks (gorhom BottomSheet, detached)
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView } from "expo-glass-effect";
import QRCode from "react-native-qrcode-svg";
import { useAppTheme } from "@/hooks/use-app-theme";
import { generateAppleWalletToken } from "../../lib/api/wallet";
import { WalletUser, TIER_PERKS } from "../../lib/types/wallet.types";
import { ConfirmModal } from "../shared/confirm-modal";
import { GlassCard } from "../glass/glass-card";
import { GlassText } from "../glass/glass-text";
import { radius, spacing } from "../../constants/glass/tokens";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

interface StatusCardMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onExpandQR: () => void;
  user: WalletUser;
  pdf417Payload?: string;
  cardNumber?: string;
  isLoadingCard?: boolean;
}

export function StatusCardMenuSheet({
  visible,
  onClose,
  onExpandQR,
  user,
  pdf417Payload,
  cardNumber,
  isLoadingCard,
}: StatusCardMenuSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [walletError, setWalletError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, user?.statusTier, pdf417Payload, isLoadingCard]);

  const handleDismiss = React.useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleExpandQR = React.useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => onExpandQR(), 150);
  }, [onExpandQR]);

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{
          backgroundColor: "transparent",
          borderRadius: TAB_BAR_RADIUS,
        }}
        handleIndicatorStyle={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.3)",
        }}
        style={{ marginHorizontal: 12 }}
        bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
        detached
      >
        <BottomSheetView style={styles.sheetContent}>
          <GlassView
            {...liquidGlass.surface}
            borderRadius={TAB_BAR_RADIUS}
            style={StyleSheet.absoluteFill}
          />

          <StatusCardMenuContent
            user={user}
            pdf417Payload={pdf417Payload}
            isLoadingCard={isLoadingCard}
            onExpandQR={handleExpandQR}
            onDismiss={handleDismiss}
            onWalletError={setWalletError}
          />
        </BottomSheetView>
      </BottomSheet>

      <ConfirmModal
        visible={!!walletError}
        onClose={() => setWalletError(null)}
        title="Error"
        message={walletError || ""}
        alertOnly
        icon="alert-circle-outline"
      />
    </>
  );
}

function StatusCardMenuContent({
  user,
  pdf417Payload,
  isLoadingCard,
  onExpandQR,
  onDismiss,
  onWalletError,
}: {
  user: WalletUser;
  pdf417Payload?: string;
  isLoadingCard?: boolean;
  onExpandQR: () => void;
  onDismiss: () => void;
  onWalletError: (error: string) => void;
}) {
  const { isDark } = useAppTheme();
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);
  const perks = TIER_PERKS[user.statusTier] || [];
  const displayPerks = perks.slice(0, 3);

  const iconColor = isDark ? "#ffffff" : "#1a1a1a";
  const buttonBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.08)";
  const qrContainerBorder = isDark
    ? "rgba(255, 255, 255, 0.10)"
    : "rgba(0, 0, 0, 0.06)";
  const qrColor = isDark ? "#ffffff" : "#000000";
  const separatorColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.08)";
  const perksIconBg = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.05)";
  const perksIconBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.05)";
  const highlightGradientColors = isDark
    ? (["rgba(255, 255, 255, 0.02)", "transparent"] as const)
    : (["rgba(0, 0, 0, 0.02)", "transparent"] as const);

  const handleViewOnWallet = () => {
    onDismiss();
    setTimeout(() => Linking.openURL("shoebox://"), 100);
  };

  const handleAddToWallet = async () => {
    setIsAddingToWallet(true);
    try {
      const response = await generateAppleWalletToken();
      if (response.success && response.data?.downloadUrl) {
        onDismiss();
        setTimeout(() => Linking.openURL(response.data!.downloadUrl!), 100);
      } else {
        onWalletError(response.error || "Failed to add to Apple Wallet");
      }
    } catch (error: any) {
      onWalletError(error.message || "Failed to add to Apple Wallet");
    } finally {
      setIsAddingToWallet(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* QR Code Section */}
      <View style={styles.qrSection}>
        {isLoadingCard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={iconColor} />
          </View>
        ) : pdf417Payload ? (
          <View
            style={[
              styles.qrContainer,
              { borderColor: qrContainerBorder },
            ]}
          >
            <GlassView
              {...liquidGlass.surface}
              borderRadius={20}
              style={StyleSheet.absoluteFillObject}
            />
            <QRCode
              value={pdf417Payload}
              size={140}
              color={qrColor}
              backgroundColor="transparent"
            />
          </View>
        ) : null}
      </View>

      {/* Tier Perks */}
      {displayPerks.length > 0 && (
        <GlassCard
          fill="light"
          border="subtle"
          cornerRadius="2xl"
          shadowLevel="md"
          blurIntensity="medium"
          style={styles.perksCard}
        >
          <LinearGradient
            colors={highlightGradientColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={styles.innerHighlight}
          />

          <View style={styles.perksTitleRow}>
            <View
              style={[
                styles.perksIcon,
                { backgroundColor: perksIconBg, borderColor: perksIconBorder },
              ]}
            >
              <Ionicons name="star-outline" size={14} color="#FFD700" />
            </View>
            <GlassText weight="bold" size={15}>
              {user.statusTier} Perks
            </GlassText>
          </View>

          {displayPerks.map((perk, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <View
                  style={[
                    styles.perkSeparator,
                    { backgroundColor: separatorColor },
                  ]}
                />
              )}
              <View style={styles.perkRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
                <GlassText
                  hierarchy="secondary"
                  size={14}
                  style={styles.perkText}
                >
                  {perk}
                </GlassText>
              </View>
            </React.Fragment>
          ))}
        </GlassCard>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {pdf417Payload ? (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: buttonBorderColor }]}
            onPress={onExpandQR}
            activeOpacity={0.7}
          >
            <GlassView
              {...liquidGlass.surface}
              borderRadius={radius.md}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="expand-outline" size={18} color={iconColor} />
            <Text style={[styles.actionButtonText, { color: iconColor }]}>
              Full Screen
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: buttonBorderColor }]}
          onPress={handleViewOnWallet}
          activeOpacity={0.7}
        >
          <GlassView
            {...liquidGlass.surface}
            borderRadius={radius.md}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="wallet-outline" size={18} color={iconColor} />
          <Text style={[styles.actionButtonText, { color: iconColor }]}>
            View on Apple Wallet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: buttonBorderColor }]}
          onPress={handleAddToWallet}
          activeOpacity={0.7}
          disabled={isAddingToWallet}
        >
          <GlassView
            {...liquidGlass.surface}
            borderRadius={radius.md}
            style={StyleSheet.absoluteFillObject}
          />
          {isAddingToWallet ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={18} color={iconColor} />
              <Text style={[styles.actionButtonText, { color: iconColor }]}>
                Add to Apple Wallet
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingBottom: 8,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 8,
  },

  // QR Section
  qrSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  qrContainer: {
    padding: 18,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },

  // Perks
  perksCard: {
    marginBottom: 16,
    overflow: "hidden",
  },
  innerHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
  },
  perksTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  perksIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  perkSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg + 22 + spacing.md,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#34c759",
    justifyContent: "center",
    alignItems: "center",
  },
  perkText: {
    flex: 1,
  },

  // Actions
  actionsSection: {
    gap: 10,
  },
  actionButton: {
    height: 48,
    borderRadius: radius.md,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    letterSpacing: 0.5,
  },
});
