// Status Card Menu Sheet — QR code + tier perks
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { useAppTheme } from "@/hooks/use-app-theme";
import { generateAppleWalletToken } from "../../lib/api/wallet";
import { WalletUser, TIER_PERKS } from "../../lib/types/wallet.types";
import { GlassCard } from "../glass/glass-card";
import { GlassText } from "../glass/glass-text";
import { radius, spacing, glassBorder } from "../../constants/glass/tokens";

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
  const { isDark } = useAppTheme();
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);
  const perks = TIER_PERKS[user.statusTier] || [];
  const displayPerks = perks.slice(0, 3);

  const sheetBackgroundColor = isDark ? "#000000" : "rgba(255, 255, 255, 0.97)";
  const sheetBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : `rgba(0, 0, 0, ${glassBorder.medium.opacity * 0.3})`;
  const indicatorColor = isDark
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.3)";
  const iconColor = isDark ? "#ffffff" : "#1a1a1a";
  const buttonBgColor = isDark ? "rgba(255, 255, 255, 0.15)" : "#D3D3D3";
  const buttonBorderColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.08)";
  const qrContainerBg = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(0, 0, 0, 0.03)";
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

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleViewOnWallet = () => {
    Linking.openURL("shoebox://");
  };

  const handleAddToWallet = async () => {
    setIsAddingToWallet(true);
    try {
      const response = await generateAppleWalletToken();
      if (response.success && response.data?.downloadUrl) {
        Linking.openURL(response.data.downloadUrl);
      } else {
        Alert.alert("Error", response.error || "Failed to add to Apple Wallet");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add to Apple Wallet");
    } finally {
      setIsAddingToWallet(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      onClose={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.5}
        />
      )}
      backgroundStyle={[
        styles.sheetBackground,
        {
          backgroundColor: sheetBackgroundColor,
          borderColor: sheetBorderColor,
        },
      ]}
      handleIndicatorStyle={[
        styles.sheetIndicator,
        { backgroundColor: indicatorColor },
      ]}
    >
      <BottomSheetView
        style={[styles.container, { paddingBottom: insets.bottom || 8 }]}
      >
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
                {
                  borderColor: qrContainerBorder,
                  backgroundColor: qrContainerBg,
                },
              ]}
            >
              <QRCode
                value={pdf417Payload}
                size={180}
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
              <View
                style={[
                  styles.actionButtonFill,
                  { backgroundColor: buttonBgColor },
                ]}
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
            <View
              style={[
                styles.actionButtonFill,
                { backgroundColor: buttonBgColor },
              ]}
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
            <View
              style={[
                styles.actionButtonFill,
                { backgroundColor: buttonBgColor },
              ]}
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
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderWidth: 1,
  },
  sheetIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: spacing.lg,
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

  // Actions — all buttons in one group with uniform gap
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
  actionButtonFill: {
    ...StyleSheet.absoluteFillObject,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    letterSpacing: 0.5,
  },
});
