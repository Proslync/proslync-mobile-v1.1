import * as React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeSheet, canUseNativeSheet } from '@/components/ui/native-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks/use-debounce';
import { apiClient } from '@/lib/api/client';

const DefaultAvatar = require('@/assets/images/default-avatar.png');

export interface TaggedPerson {
  id: number;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

interface PeopleTagSheetProps {
  visible: boolean;
  onClose: () => void;
  selected: TaggedPerson[];
  onConfirm: (people: TaggedPerson[]) => void;
}

export function PeopleTagSheet({ visible, onClose, selected, onConfirm }: PeopleTagSheetProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<TaggedPerson[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [localSelected, setLocalSelected] = React.useState<TaggedPerson[]>(selected);
  const debouncedQuery = useDebounce(query, 300);
  const { colors } = useAppTheme();

  React.useEffect(() => {
    if (visible) setLocalSelected(selected);
  }, [visible]);

  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const search = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<{
          people: Array<{
            id: number;
            userName: string | null;
            firstName: string;
            lastName: string;
            avatar: { url: string } | null;
          }>;
        }>(`/api/search?query=${encodeURIComponent(debouncedQuery)}&eventsLimit=0&venuesLimit=0&peopleLimit=10`);
        if (!cancelled) {
          setResults(
            (response.people || []).map((p) => ({
              id: p.id,
              userName: p.userName || undefined,
              firstName: p.firstName,
              lastName: p.lastName,
              avatarUrl: p.avatar?.url || null,
            })),
          );
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const isSelected = (id: number) => localSelected.some((p) => p.id === id);

  const toggle = (person: TaggedPerson) => {
    setLocalSelected((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person],
    );
  };

  const handleDone = () => {
    onConfirm(localSelected);
    setQuery('');
    setResults([]);
    onClose();
  };

  const displayName = (p: TaggedPerson) =>
    p.userName || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'User';

  if (!canUseNativeSheet()) return null;

  return (
    <NativeSheet isPresented={visible} onDismiss={onClose} rnContent dragIndicator="visible">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tag People</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.doneText}>Done{localSelected.length > 0 ? ` (${localSelected.length})` : ''}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBox, { borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search people..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>

        {/* Selected chips */}
        {localSelected.length > 0 && (
          <View style={styles.chips}>
            {localSelected.map((p) => (
              <TouchableOpacity key={p.id} style={styles.chip} onPress={() => toggle(p)}>
                <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
                <Text style={styles.chipText}>{displayName(p)}</Text>
                <Ionicons name="close" size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading && <ActivityIndicator style={styles.loader} color={colors.textTertiary} />}

        {results.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => toggle(person)}
            activeOpacity={0.6}
          >
            <Image
              source={person.avatarUrl ? { uri: person.avatarUrl } : DefaultAvatar}
              style={styles.avatar}
            />
            <View style={styles.rowText}>
              <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                {[person.firstName, person.lastName].filter(Boolean).join(' ') || person.userName}
              </Text>
              {person.userName && (
                <Text style={[styles.personHandle, { color: colors.textTertiary }]} numberOfLines={1}>
                  @{person.userName}
                </Text>
              )}
            </View>
            <Ionicons
              name={isSelected(person.id) ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected(person.id) ? '#0A84FF' : colors.textTertiary}
            />
          </TouchableOpacity>
        ))}

        {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No people found</Text>
        )}
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, minHeight: 350 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontFamily: 'Lato_700Bold', color: '#fff' },
  cancelText: { fontSize: 15, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.6)' },
  doneText: { fontSize: 15, fontFamily: 'Lato_700Bold', color: '#0A84FF' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Lato_400Regular' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, overflow: 'hidden',
  },
  chipText: { fontSize: 13, fontFamily: 'Lato_600SemiBold', color: '#fff' },
  loader: { marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  rowText: { flex: 1 },
  personName: { fontSize: 15, fontFamily: 'Lato_600SemiBold' },
  personHandle: { fontSize: 13, fontFamily: 'Lato_400Regular', marginTop: 1 },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 14, fontFamily: 'Lato_400Regular' },
});
