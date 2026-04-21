import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeSheet, canUseNativeSheet } from '@/components/ui/native-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAddressSuggestions } from '@/hooks/use-address-suggestions';
import { useAppTheme } from '@/hooks/use-app-theme';

export interface PostLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: PostLocation) => void;
}

export function LocationPickerSheet({ visible, onClose, onSelect }: LocationPickerSheetProps) {
  const [query, setQuery] = React.useState('');
  const { suggestions, isLoading, retrieve } = useAddressSuggestions(query);
  const { colors } = useAppTheme();

  const handleSelect = async (mapboxId: string, name: string, fullAddress: string) => {
    const details = await retrieve(mapboxId);
    onSelect({
      name,
      address: details?.formattedAddress || fullAddress,
      lat: details?.coordinates?.lat || 0,
      lng: details?.coordinates?.lng || 0,
    });
    setQuery('');
    onClose();
  };

  if (!canUseNativeSheet()) return null;

  return (
    <NativeSheet isPresented={visible} onDismiss={onClose} rnContent dragIndicator="visible">
      <View style={styles.container}>
        <Text style={styles.title}>Add Location</Text>

        <View style={[styles.searchBox, { borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search places..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading && <ActivityIndicator style={styles.loader} color={colors.textTertiary} />}

        {suggestions.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => handleSelect(s.mapboxId, s.name, s.fullAddress)}
            activeOpacity={0.6}
          >
            <View style={styles.iconCircle}>
              <GlassView {...liquidGlass.fillMedium} borderRadius={16} style={StyleSheet.absoluteFill} />
              <Ionicons name="location" size={16} color="#fff" />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
              <Text style={[styles.rowAddress, { color: colors.textTertiary }]} numberOfLines={1}>{s.fullAddress}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {!isLoading && query.length >= 3 && suggestions.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No results found</Text>
        )}
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, minHeight: 300 },
  title: { fontSize: 17, color: '#1A1A1A', textAlign: 'center', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, },
  loader: { marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  rowText: { flex: 1 },
  rowName: { fontSize: 15, },
  rowAddress: { fontSize: 13, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 14, },
});
