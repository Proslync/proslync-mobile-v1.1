import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface PublicTablesCardData {
  id: string;
  brandColor: string; // fallback #6B3FA0
  tables: {
    id: string;
    venueName: string;
    tableName: string;
    minSpend: string;
    originalPrice?: string;
    isSaved: boolean;
  }[];
  promoText?: string;
  promoBadge?: string;
  promoDetail?: string;
}

interface PublicTablesCardProps {
  data: PublicTablesCardData;
  onSaveToggle: (tableId: string) => void;
  onRequestTable: () => void;
  onMore: () => void;
}

const CARD_HORIZONTAL_MARGIN = 12;
const CARD_PADDING = 14;
const GRID_GAP = 10;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const INNER_WIDTH =
  SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2 - CARD_PADDING * 2;
const TABLE_CARD_WIDTH = (INNER_WIDTH - GRID_GAP) / 2;

function HeartButton({
  isSaved,
  onPress,
}: {
  isSaved: boolean;
  onPress: () => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Animated.View style={[styles.heartButton, { transform: [{ scale }] }]}>
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={16}
          color="#FFFFFF"
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function PublicTablesCard({
  data,
  onSaveToggle,
  onRequestTable,
  onMore,
}: PublicTablesCardProps) {
  const bgColor = data.brandColor || "#6B3FA0";

  return (
    <View style={[styles.outerCard, { backgroundColor: bgColor }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topLabel}>{"PUBLIC\nTABLES"}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onMore}>
          <Text style={styles.ellipsis}>...</Text>
        </TouchableOpacity>
      </View>

      {/* 2-column grid */}
      <View style={styles.grid}>
        {data.tables.map((table) => (
          <View key={table.id} style={styles.tableCard}>
            {/* Price badge */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{table.minSpend} min</Text>
              {table.originalPrice ? (
                <Text style={styles.originalPrice}>{table.originalPrice}</Text>
              ) : null}
            </View>

            {/* Center info */}
            <View style={styles.tableInfo}>
              <Text style={styles.venueName} numberOfLines={1}>
                {table.venueName}
              </Text>
              <Text style={styles.tableName} numberOfLines={1}>
                {table.tableName}
              </Text>
            </View>

            {/* Heart button */}
            <View style={styles.heartContainer}>
              <HeartButton
                isSaved={table.isSaved}
                onPress={() => onSaveToggle(table.id)}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <Text style={styles.requestText}>Request Table</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onRequestTable}>
          <View style={styles.arrowButton}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Promo strip */}
      {data.promoBadge || data.promoDetail ? (
        <View style={styles.promoStrip}>
          {data.promoBadge ? (
            <View style={[styles.promoPill, { backgroundColor: bgColor }]}>
              <Text style={styles.promoPillText}>{data.promoBadge}</Text>
            </View>
          ) : null}
          {data.promoDetail ? (
            <Text style={styles.promoDetail}>{data.promoDetail}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerCard: {
    height: SCREEN_HEIGHT - 218,
    borderRadius: 28,
    padding: CARD_PADDING,
    marginBottom: 10,
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  topLabel: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  ellipsis: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  tableCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    height: 160,
    width: TABLE_CARD_WIDTH,
    justifyContent: "space-between",
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  priceText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  originalPrice: {
    color: "#AAAAAA",
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  tableInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  venueName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  tableName: {
    color: "#FFFFFF",
    fontSize: 11,
    opacity: 0.75,
    textAlign: "center",
    marginTop: 2,
  },
  heartContainer: {
    alignItems: "flex-end",
  },
  heartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  requestText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 22,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoStrip: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promoPillText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  promoDetail: {
    color: "#FFFFFF",
    fontSize: 13,
  },
});
