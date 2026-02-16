import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MarketingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Marketing</Text>
        <View style={styles.headerButton} />
      </View>
      <View style={styles.placeholder}>
        <Ionicons name="megaphone-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { fontSize: 16, fontFamily: 'Lato_400Regular' },
});
