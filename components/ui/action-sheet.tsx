import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { GlassView, GlassContainer } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { NativeSheet, canUseNativeSheet } from "./native-sheet";
import { ActionSheet as ActionSheetFallback } from "@/components/shared/action-sheet";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export function ActionSheet(props: ActionSheetProps) {
  if (!canUseNativeSheet()) {
    return <ActionSheetFallback {...props} />;
  }

  return <NativeActionSheet {...props} />;
}

function NativeActionSheet({
  visible,
  title,
  options,
  onClose,
}: ActionSheetProps) {
  const handleSelect = React.useCallback(
    (option: ActionSheetOption) => {
      onClose();
      setTimeout(() => option.onPress(), 150);
    },
    [onClose],
  );

  return (
    <NativeSheet
      isPresented={visible}
      onDismiss={onClose}
      detents={[{ fraction: 0.08 + options.length * 0.065 + (title ? 0.05 : 0) }]}
      rnContent
      dragIndicator="visible"
    >
      <View style={styles.container}>
        <GlassContainer spacing={8} style={styles.glassContainer}>
          {/* Title area */}
          {title && (
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={24}
              style={styles.titleGlass}
            >
              <Text style={styles.title}>{title}</Text>
            </GlassView>
          )}

          {/* Options group */}
          <GlassView
            {...liquidGlass.surface}
            borderRadius={24}
            style={styles.optionsGlass}
          >
            {options.map((option, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.6}
                >
                  {option.icon && (
                    <View style={styles.iconCircle}>
                      <GlassView
                        {...liquidGlass.fillMedium}
                        borderRadius={16}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons
                        name={option.icon}
                        size={18}
                        color={option.destructive ? "#FF3B30" : "#fff"}
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      option.destructive && styles.optionDestructive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </GlassView>
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
  titleGlass: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.45)",
    textAlign: "center",
  },
  optionsGlass: {
    paddingVertical: 4,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    color: "#1A1A1A",
  },
  optionDestructive: {
    color: "#FF3B30",
  },
});
