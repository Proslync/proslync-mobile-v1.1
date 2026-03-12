import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { authApi } from "@/lib/api/auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";

interface MiniUserCardProps {
  userId: number;
}

export function MiniUserCard({ userId }: MiniUserCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => authApi.getUserById(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: followStatus } = useQuery({
    queryKey: ["follow-status", userId],
    queryFn: () => authApi.getFollowStatus(userId),
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });

  const handleFollow = async () => {
    if (isFollowing || followStatus?.isFollowing || followLoading) return;
    setFollowLoading(true);
    try {
      await authApi.followUser(userId);
      setIsFollowing(true);
      queryClient.invalidateQueries({ queryKey: ["follow-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePress = () => {
    if (!user?.userName) return;
    router.push({
      pathname: "/user/[username]",
      params: { username: user.userName },
    });
  };

  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  if (isLoading) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={colors.textSecondary}
          style={{ padding: 20 }}
        />
      </View>
    );
  }

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const avatarUrl = user.avatar?.url;
  const alreadyFollowing = isFollowing || followStatus?.isFollowing;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <Ionicons name="person" size={22} color={colors.textTertiary} />
        </View>
      )}

      {/* User Info Column */}
      <View style={styles.infoColumn}>
        <View style={styles.usernameRow}>
          <Text
            style={[styles.username, { color: colors.text }]}
            numberOfLines={1}
          >
            @{user.userName}
          </Text>
          {user.isVerified && (
            <MaterialCommunityIcons
              name="check-decagram"
              size={14}
              color="#0095F6"
            />
          )}
        </View>
        {fullName ? (
          <Text
            style={[styles.fullName, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {fullName}
          </Text>
        ) : null}
      </View>

      {/* Follow Button */}
      <TouchableOpacity
        style={[
          styles.followButton,
          alreadyFollowing && styles.followButtonDone,
        ]}
        onPress={(e) => {
          e.stopPropagation?.();
          handleFollow();
        }}
        disabled={!!alreadyFollowing || followLoading}
        activeOpacity={0.8}
      >
        {followLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            style={[
              styles.followText,
              alreadyFollowing && styles.followTextDone,
            ]}
          >
            {alreadyFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 240;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoColumn: {
    flex: 1,
    gap: 2,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    flexShrink: 1,
  },
  fullName: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  followButton: {
    backgroundColor: "#0095F6",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonDone: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  followText: {
    fontSize: 12,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  followTextDone: {
    color: "rgba(255,255,255,0.5)",
  },
});
