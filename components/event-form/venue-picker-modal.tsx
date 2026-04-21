// Modal venue picker for event creation — glass-styled dark theme

import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { Venue } from '@/lib/types/events.types';

interface VenuePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (venue: Venue | null) => void;
  selectedVenueId?: number;
  venues: Venue[];
  isLoading: boolean;
}

export function VenuePickerModal({
  visible,
  onClose,
  onSelect,
  selectedVenueId,
  venues,
  isLoading,
}: VenuePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const handleSelect = (venue: Venue | null) => {
    onSelect(venue);
    onClose();
  };

  const renderVenueItem = ({ item }: { item: Venue }) => {
    const isSelected = item.id === selectedVenueId;
    return (
      <TouchableOpacity
        style={[styles.venueItem, isSelected && { overflow: 'hidden' }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <GlassView
            {...liquidGlass.fill}
            borderRadius={12}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.venueInfo}>
          <Text style={styles.venueName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.address && (
            <Text style={styles.venueAddress} numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Venue</Text>
          <TouchableOpacity
            style={[styles.closeButton, { overflow: 'hidden' }]}
            onPress={onClose}
          >
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={16}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="rgba(0,0,0,0.45)" size="large" />
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No venues found</Text>
          </View>
        ) : (
          <FlatList
            data={venues}
            renderItem={renderVenueItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
              <TouchableOpacity
                style={[
                  styles.venueItem,
                  !selectedVenueId && { overflow: 'hidden' },
                ]}
                onPress={() => handleSelect(null)}
                activeOpacity={0.7}
              >
                {!selectedVenueId && (
                  <GlassView
                    {...liquidGlass.fill}
                    borderRadius={12}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>None</Text>
                  <Text style={styles.venueAddress}>
                    Enter address manually
                  </Text>
                </View>
                {!selectedVenueId && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            }
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  modalTitle: {
    fontSize: 18,
    color: '#1A1A1A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  venueItemSelected: {},
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 17,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  venueAddress: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  checkmark: {
    fontSize: 18,
    color: '#1A1A1A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
});
