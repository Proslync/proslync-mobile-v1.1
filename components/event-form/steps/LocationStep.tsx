// Step 3: Location - Venue selection + address autocomplete

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFormContext } from 'react-hook-form';
import { AddressAutocomplete } from '@/components/event-form/address-autocomplete';
import { VenuePickerModal } from '@/components/event-form/venue-picker-modal';
import { useMyVenues } from '@/hooks';
import type { AddressSuggestion } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LocationDetails } from '@/lib/api/events';
import type { EventFormData } from '@/lib/schemas/events';
import type { Venue } from '@/lib/types/events.types';

export function LocationStep() {
  const { colors } = useAppTheme();
  const { setValue, watch, formState: { errors } } = useFormContext<EventFormData>();
  const [pickerVisible, setPickerVisible] = useState(false);
  const { data: venues = [], isLoading } = useMyVenues();

  const venueId = watch('venueId');
  const location = watch('location');
  const selectedVenue = venues.find((v) => v.id === venueId);
  const hasVenues = venues.length > 0 || isLoading;

  const handleVenueSelect = (venue: Venue | null) => {
    if (venue) {
      setValue('venueId', venue.id, { shouldValidate: true });
      const address = venue.address || venue.name;
      setValue('location', address, { shouldValidate: true });
      setValue('locationDetails', undefined);
    } else {
      setValue('venueId', undefined, { shouldValidate: true });
    }
  };

  const handleAddressChange = (text: string) => {
    setValue('location', text, { shouldValidate: true });
    // Clear locationDetails when user types manually
    setValue('locationDetails', undefined);
  };

  const handleAddressSelect = (suggestion: AddressSuggestion, details: LocationDetails) => {
    setValue('location', details.formattedAddress || suggestion.fullAddress, { shouldValidate: true });
    setValue('locationDetails', details);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      {hasVenues && (
        <View style={styles.venueSection}>
          <Text style={[styles.label, { color: colors.text }]}>Venue</Text>
          <TouchableOpacity
            style={[
              styles.venueSelector,
              { backgroundColor: colors.input, borderColor: colors.inputBorder },
            ]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.venueSelectorText,
                {
                  color: selectedVenue ? colors.text : colors.placeholder,
                },
              ]}
              numberOfLines={1}
            >
              {selectedVenue ? selectedVenue.name : 'Select a venue (optional)'}
            </Text>
            <Text style={[styles.chevron, { color: colors.placeholder }]}>
              ▼
            </Text>
          </TouchableOpacity>

          <VenuePickerModal
            visible={pickerVisible}
            onClose={() => setPickerVisible(false)}
            onSelect={handleVenueSelect}
            selectedVenueId={venueId}
            venues={venues}
            isLoading={isLoading}
          />
        </View>
      )}

      <AddressAutocomplete
        value={location || ''}
        onChangeText={handleAddressChange}
        onSelect={handleAddressSelect}
        label="Where is it happening?"
        placeholder="Search for an address..."
        error={errors.location?.message}
      />
      <Text style={[styles.helperText, { color: colors.textTertiary }]}>
        Enter the full address where your event will take place
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  venueSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  venueSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  venueSelectorText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  chevron: {
    fontSize: 10,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
  },
});
