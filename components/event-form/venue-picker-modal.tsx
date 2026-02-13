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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const handleSelect = (venue: Venue | null) => {
    onSelect(venue);
    onClose();
  };

  const renderVenueItem = ({ item }: { item: Venue }) => {
    const isSelected = item.id === selectedVenueId;
    return (
      <TouchableOpacity
        style={[styles.venueItem, isSelected && styles.venueItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
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
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Venue</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#fff" size="large" />
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
                  !selectedVenueId && styles.venueItemSelected,
                ]}
                onPress={() => handleSelect(null)}
                activeOpacity={0.7}
              >
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
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
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
  venueItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 17,
    color: '#fff',
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  venueAddress: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkmark: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
