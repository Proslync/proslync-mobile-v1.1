import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { fontFamily } from '@/constants/glass/tokens';

const useNativeGlass = isGlassEffectAPIAvailable();

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '\u{1F1EE}\u{1F1F1}' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '\u{1F1F8}\u{1F1EC}' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '\u{1F1F3}\u{1F1FF}' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '\u{1F1EE}\u{1F1EA}' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '\u{1F1F2}\u{1F1FE}' },
];

interface CountryPickerProps {
  selectedCode: string;
  onSelect: (dialCode: string) => void;
}

export function CountryPicker({ selectedCode, onSelect }: CountryPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const selectedCountry = COUNTRIES.find(c => c.dialCode === selectedCode) || COUNTRIES[0];

  const filteredCountries = React.useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (country: Country) => {
    onSelect(country.dialCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  const renderCountryItem = ({ item }: { item: Country }) => {
    const isSelected = item.dialCode === selectedCode;
    return (
      <TouchableOpacity
        style={[
          styles.countryItem,
          isSelected && { overflow: 'hidden' },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        {isSelected && useNativeGlass && (
          <GlassView
            {...liquidGlass.surface}
            style={StyleSheet.absoluteFill}
          />
        )}
        {isSelected && !useNativeGlass && (
          <View style={[StyleSheet.absoluteFill, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            borderRadius: 12,
          }]} />
        )}
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <View style={styles.countryInfo}>
          <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.countryDialCode, { color: colors.textTertiary }]}>{item.dialCode}</Text>
        </View>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorFlag}>{selectedCountry.flag}</Text>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: '#000' }]}>
          {isDark && <DarkGradientBg />}
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
            <GlassSurface
              fill="light"
              border="subtle"
              cornerRadius="3xl"
              style={styles.closeButtonWrapper}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </GlassSurface>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { overflow: 'hidden', borderRadius: 12 }]}>
              {useNativeGlass ? (
                <GlassView
                  {...liquidGlass.surface}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <>
                  <BlurView
                    intensity={isDark ? 20 : 15}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[StyleSheet.absoluteFill, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }]} />
                </>
              )}
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search country..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={item => item.code}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 58,
    gap: 8,
  },
  selectorFlag: {
    fontSize: 28,
  },
  chevron: {
    fontSize: 10,
  },
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
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  closeButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  countryDialCode: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  checkmark: {
    fontSize: 18,
    color: '#34C759',
    fontFamily: 'Lato_700Bold',
  },
});
