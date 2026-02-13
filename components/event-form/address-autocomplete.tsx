// Address autocomplete input with Mapbox Search Box (addresses + venues/POI)

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useAddressSuggestions } from '@/hooks';
import type { AddressSuggestion } from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LocationDetails } from '@/lib/api/events';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion, details: LocationDetails) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function AddressAutocomplete({
  value,
  onChangeText,
  onSelect,
  label,
  placeholder = 'Search for an address or venue...',
  error,
}: AddressAutocompleteProps) {
  const { colors } = useAppTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [retrieving, setRetrieving] = useState(false);
  const { suggestions, isLoading, retrieve } = useAddressSuggestions(
    showSuggestions ? value : '',
  );
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setShowSuggestions(true);
  };

  const handleSelect = async (suggestion: AddressSuggestion) => {
    setShowSuggestions(false);
    setRetrieving(true);
    Keyboard.dismiss();

    const details = await retrieve(suggestion.mapboxId);
    setRetrieving(false);

    if (details) {
      onSelect(suggestion, details);
    }
  };

  const hasSuggestions = showSuggestions && suggestions.length > 0;

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              borderColor: error ? '#ef4444' : colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
          autoComplete="off"
        />
        {retrieving && (
          <View style={styles.inputSpinner}>
            <ActivityIndicator color={colors.placeholder} size="small" />
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {hasSuggestions && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.input,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionItem}
              onPress={() => handleSelect(suggestion)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.suggestionName, { color: colors.text }]}
                numberOfLines={1}
              >
                {suggestion.name}
              </Text>
              {suggestion.fullAddress !== suggestion.name && (
                <Text
                  style={[
                    styles.suggestionAddress,
                    { color: colors.placeholder },
                  ]}
                  numberOfLines={1}
                >
                  {suggestion.fullAddress}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 44,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
  },
  inputSpinner: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
    marginTop: 4,
  },
  suggestionsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
});
