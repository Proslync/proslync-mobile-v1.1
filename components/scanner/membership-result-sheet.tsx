import * as React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeSheet } from '@/components/ui/native-sheet';
import { TAG_COLORS } from '@/components/check-ins/utils';
import type { PublicUserProfile } from '@/lib/types/auth.types';

interface MembershipData {
  rawPayload: string;
  memberName?: string;
  memberId?: string;
  cardId?: string;
}

interface MembershipResultSheetProps {
  isPresented: boolean;
  membershipData: MembershipData | null;
  memberProfile: PublicUserProfile | null;
  memberProfileLoading: boolean;
  venueTags?: string[];
  onContinueToId: () => void;
  onScanDifferent: () => void;
  onDismiss: () => void;
}

export function MembershipResultSheet({
  isPresented,
  membershipData,
  memberProfile,
  memberProfileLoading,
  venueTags = [],
  onContinueToId,
  onScanDifferent,
  onDismiss,
}: MembershipResultSheetProps) {
  if (!membershipData) return null;

  const displayName = memberProfile
    ? [memberProfile.firstName, memberProfile.lastName].filter(Boolean).join(' ') || membershipData.memberName || 'Member'
    : membershipData.memberName || 'Member';

  // Parse member since date
  let memberSince: string | null = null;
  const dateStr = memberProfile?.createdAt ?? (() => {
    try {
      return JSON.parse(membershipData.rawPayload)?.issuedAt;
    } catch {
      return null;
    }
  })();
  if (dateStr) {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' });
    memberSince = `Member since ${month} ${date.getFullYear()}`;
  }

  return (
    <NativeSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      detents={['medium']}
      rnContent
      scrollable
    >
      <View style={styles.container}>
        {/* Profile Card */}
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {memberProfileLoading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="small" color="rgba(0,0,0,0.45)" />
              </View>
            ) : memberProfile?.avatar?.url ? (
              <Image source={{ uri: memberProfile.avatar.url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color="rgba(0,0,0,0.45)" />
              </View>
            )}
            <View style={styles.avatarRing} />
          </View>

          {/* Name */}
          <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>

          {/* Username + verified */}
          {(memberProfile?.userName || membershipData.memberId) && (
            <View style={styles.handleRow}>
              <Text style={styles.handle} numberOfLines={1}>
                @{memberProfile?.userName || `user${membershipData.memberId}`}
              </Text>
              {memberProfile?.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={15} color="#3897F0" />
              )}
            </View>
          )}

          {/* Member since */}
          {memberSince && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={11} color="rgba(0,0,0,0.45)" />
              <Text style={styles.metaText}>{memberSince}</Text>
            </View>
          )}

          {/* Status Member badge */}
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10b981" />
            <Text style={styles.statusBadgeText}>Status Member</Text>
          </View>

          {/* Venue Tags */}
          {venueTags.length > 0 && (
            <View style={styles.tagsRow}>
              {venueTags.map((tag) => {
                const color = TAG_COLORS[tag] || '#6b7280';
                return (
                  <View key={tag} style={[styles.tagBadge, { backgroundColor: `${color}25` }]}>
                    <View style={[styles.tagDot, { backgroundColor: color }]} />
                    <Text style={[styles.tagBadgeText, { color }]}>
                      {tag.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Continue to ID Scan */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinueToId}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to ID Scan</Text>
          <Ionicons name="arrow-forward" size={20} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Scan different card */}
        <TouchableOpacity
          style={styles.rescanLink}
          onPress={onScanDifferent}
          activeOpacity={0.7}
        >
          <Text style={styles.rescanLinkText}>Scan Different Card</Text>
        </TouchableOpacity>
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  displayName: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 3,
  },
  handle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.45)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
  },
  rescanLink: {
    marginTop: 16,
    padding: 8,
  },
  rescanLinkText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
  },
});
