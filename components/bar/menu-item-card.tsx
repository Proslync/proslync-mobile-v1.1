import { QuantityBadge } from "@/components/ui/quantity-badge";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import * as React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SWIPE_THRESHOLD = -80;

interface MenuItemCardProps {
  name: string;
  priceCents: number;
  quantity?: number;
  onAdd: () => void;
  onRemove?: () => void;
  onSetQuantity?: (qty: number) => void;
  onClear?: () => void;
}

export function MenuItemCard({
  name,
  priceCents,
  quantity = 0,
  onAdd,
  onRemove,
  onSetQuantity,
  onClear,
}: MenuItemCardProps) {
  const [showQtyInput, setShowQtyInput] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const translateX = useSharedValue(0);

  // Swipe left to remove
  const handleSwipeRemove = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClear?.();
  }, [onClear]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -120);
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD && quantity > 0) {
        translateX.value = withTiming(-200, { duration: 150 }, () => {
          runOnJS(handleSwipeRemove)();
          translateX.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.();
  };

  const handleBadgeTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputValue(String(quantity));
    setShowQtyInput(true);
  };

  const handleQtySubmit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed === 0) {
        onClear?.();
      } else {
        onSetQuantity?.(parsed);
      }
    }
    setShowQtyInput(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Delete background revealed on swipe */}
      {quantity > 0 && (
        <View style={styles.deleteBackground}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardOuter, swipeStyle]}>
          <TouchableOpacity onPress={handleAdd} activeOpacity={0.7}>
            {/* @ts-expect-error — augmented GlassViewProps */}
            <GlassView
              {...liquidGlass.fillMedium}
              {...(quantity > 0 && { tintColor: "rgba(52, 199, 89, 0.25)" })}
              borderRadius={16}
              style={styles.card}
            >
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>

              <Text style={styles.price}>${(priceCents / 100).toFixed(2)}</Text>

              {quantity > 0 && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(100)}
                  style={styles.controls}
                >
                  <TouchableOpacity
                    onPress={handleRemove}
                    hitSlop={8}
                    style={styles.glassBtn}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleBadgeTap} hitSlop={4}>
                    <QuantityBadge count={quantity} size={42} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAdd}
                    hitSlop={8}
                    style={styles.glassBtn}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Inline quantity input overlay */}
              {showQtyInput && (
                <View style={styles.qtyInputOverlay}>
                  {/* @ts-expect-error — augmented GlassViewProps */}
                  <GlassView
                    {...liquidGlass.surface}
                    borderRadius={16}
                    style={styles.qtyInputCard}
                  >
                    <TextInput
                      style={styles.qtyInput}
                      value={inputValue}
                      onChangeText={setInputValue}
                      keyboardType="number-pad"
                      autoFocus
                      selectTextOnFocus
                      returnKeyType="done"
                      onSubmitEditing={handleQtySubmit}
                      onBlur={handleQtySubmit}
                      maxLength={3}
                    />
                  </GlassView>
                </View>
              )}
            </GlassView>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 59, 48, 0.6)",
    borderRadius: 16,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 20,
  },
  cardOuter: {
    borderRadius: 16,
    overflow: "hidden",
  },
  card: {
    padding: 14,
    minHeight: 90,
    justifyContent: "space-between",
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  price: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  controls: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  qtyInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  qtyInputCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  qtyInput: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 60,
  },
});
