import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeSheet } from '@/components/ui/native-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUserVenueTags, useUpdateVenueTags } from '@/hooks/use-venue-contact-tags';
import { TAG_COLORS, PREDEFINED_VENUE_TAGS } from '@/components/check-ins/utils';
import type { OwnerContact } from '@/lib/types/events.types';

interface ContactTagSheetProps {
  contact: OwnerContact | null;
  venueId: number | undefined;
  onDismiss: () => void;
}

export function ContactTagSheet({ contact, venueId, onDismiss }: ContactTagSheetProps) {
  const { colors } = useAppTheme();
  const [customTagInput, setCustomTagInput] = React.useState('');

  const { data: tagData, isLoading } = useUserVenueTags(venueId, contact?.userId ?? undefined);
  const updateTags = useUpdateVenueTags();

  const currentTags = tagData?.tags ?? [];

  const toggleTag = (tagKey: string) => {
    if (!venueId || !contact?.userId) return;
    const newTags = currentTags.includes(tagKey)
      ? currentTags.filter((t) => t !== tagKey)
      : [...currentTags, tagKey];
    updateTags.mutate({ venueId, userId: contact.userId, tags: newTags });
  };

  const addCustomTag = () => {
    const key = customTagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key || !venueId || !contact?.userId) return;
    if (currentTags.includes(key)) {
      setCustomTagInput('');
      return;
    }
    updateTags.mutate({
      venueId,
      userId: contact.userId,
      tags: [...currentTags, key],
    });
    setCustomTagInput('');
  };

  const displayName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Guest'
    : '';
  const initials = contact
    ? `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?'
    : '';

  // Custom tags = tags not in predefined list
  const predefinedKeys = PREDEFINED_VENUE_TAGS.map((t) => t.key);
  const customTags = currentTags.filter((t) => !predefinedKeys.includes(t));

  return (
    <NativeSheet
      isPresented={!!contact}
      onDismiss={onDismiss}
      detents={['medium']}
      rnContent
      scrollable
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {contact?.avatar ? (
            <Image source={{ uri: contact.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
            {contact?.userName && (
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{contact.userName}
              </Text>
            )}
          </View>
        </View>

        {/* Tags section */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tags</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.tagsGrid}>
            {PREDEFINED_VENUE_TAGS.map((tag) => {
              const isActive = currentTags.includes(tag.key);
              const color = TAG_COLORS[tag.key] || '#6b7280';
              return (
                <TouchableOpacity
                  key={tag.key}
                  style={[
                    styles.tagChip,
                    isActive
                      ? { backgroundColor: `${color}30`, borderColor: color }
                      : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(0,0,0,0.06)' },
                  ]}
                  onPress={() => toggleTag(tag.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tagDot, { backgroundColor: color, opacity: isActive ? 1 : 0.4 }]} />
                  <Text style={[styles.tagLabel, { color: isActive ? color : 'rgba(0,0,0,0.45)' }]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom tags */}
            {customTags.map((tag) => {
              const color = '#6b7280';
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: `${color}30`, borderColor: color }]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tagDot, { backgroundColor: color }]} />
                  <Text style={[styles.tagLabel, { color }]}>
                    {tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Add custom tag */}
        <View style={styles.customTagRow}>
          <TextInput
            style={[styles.customTagInput, { color: colors.text, borderColor: 'rgba(0,0,0,0.06)' }]}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            placeholder="Add custom tag..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            onSubmitEditing={addCustomTag}
            returnKeyType="done"
          />
          {customTagInput.trim() !== '' && (
            <TouchableOpacity style={styles.addButton} onPress={addCustomTag} activeOpacity={0.7}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Lato_700Bold',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  addButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
});
