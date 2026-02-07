import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '../glass/glass-button';
import { radius, spacing, glassBorder } from '../../constants/glass/tokens';

interface FriendProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  friend: {
    id: string;
    name: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
  } | null;
}

export function FriendProfileSheet({
  visible,
  onClose,
  friend,
}: FriendProfileSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleGetDirections = () => {
    if (!friend) return;
    const { latitude, longitude, name } = friend;

    if (Platform.OS === 'ios') {
      Linking.openURL(
        `maps:?daddr=${latitude},${longitude}&dirflg=d&t=m`
      );
    } else {
      Linking.openURL(
        `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`
      );
    }
  };

  if (!friend) return null;

  // Time-based sharing status text
  const sharingText = 'Sharing location now';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <BottomSheetView style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
        {/* Profile section */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: friend.imageUrl }} style={styles.avatar} />
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>{friend.name}</Text>
            <View style={styles.statusRow}>
              <Ionicons name="location" size={14} color="#34c759" />
              <Text style={styles.statusText}>{sharingText}</Text>
            </View>
          </View>
        </View>

        {/* Coordinates pill */}
        <View style={styles.coordPill}>
          <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.coordFill} />
          <Ionicons name="navigate-outline" size={14} color="rgba(0,0,0,0.5)" />
          <Text style={styles.coordText}>
            {friend.latitude.toFixed(4)}, {friend.longitude.toFixed(4)}
          </Text>
        </View>

        {/* Directions button */}
        <GlassButton
          label="Get Directions"
          icon={<Ionicons name="map-outline" size={18} color="#1a1a1a" />}
          variant="glass"
          size="lg"
          fullWidth
          onPress={handleGetDirections}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: spacing.lg,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#34c759',
  },
  liveBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34c759',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
  },

  // Coordinate pill
  coordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  coordFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  coordText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
  },
});
