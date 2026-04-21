import { requireNativeView } from "expo";
import * as React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface GlassSegmentedControlProps<T extends string = string>
  extends Omit<ViewProps, "children"> {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
  activeTextColor?: string;
  inactiveTextColor?: string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}

type NativeProps = {
  options: readonly string[];
  selectedIndex: number;
  activeTextColor?: string;
  inactiveTextColor?: string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  onSelect?: (event: { nativeEvent: { index: number } }) => void;
};

const NativeGlassSegmentedControl: React.ComponentType<NativeProps> | null =
  Platform.OS === "ios"
    ? (requireNativeView("ExpoGlassSegmented") as React.ComponentType<NativeProps>)
    : null;

function GlassSegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  activeTextColor = "#FFFFFF",
  inactiveTextColor = "rgba(255,255,255,0.55)",
  fontSize = 14,
  style,
  ...viewProps
}: GlassSegmentedControlProps<T>) {
  const selectedIndex = Math.max(0, options.indexOf(selected));

  if (Platform.OS === "ios" && NativeGlassSegmentedControl) {
    return (
      <NativeGlassSegmentedControl
        {...viewProps}
        style={[styles.root, style]}
        options={options}
        selectedIndex={selectedIndex}
        activeTextColor={activeTextColor}
        inactiveTextColor={inactiveTextColor}
        fontSize={fontSize}
        onSelect={(e) => {
          const next = options[e.nativeEvent.index];
          if (next !== undefined && next !== selected) onChange(next);
        }}
      />
    );
  }

  // Android / web fallback — plain pill row with a tinted active background.
  return (
    <View {...viewProps} style={[styles.root, styles.fallbackRow, style]}>
      {options.map((opt) => {
        const isActive = opt === selected;
        return (
          <TouchableOpacity
            key={opt}
            style={styles.fallbackTab}
            onPress={() => onChange(opt)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive && <View style={styles.fallbackActiveFill} />}
            <Text
              style={{
                fontSize,
                fontWeight: isActive ? "600" : "500",
                color: isActive ? activeTextColor : inactiveTextColor,
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", height: 44 },
  fallbackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  fallbackTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  fallbackActiveFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
  },
});

export default GlassSegmentedControl;
