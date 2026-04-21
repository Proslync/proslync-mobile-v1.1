import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  useContentModerationRules,
  useCreateModerationRule,
  useUpdateModerationRule,
  useDeleteModerationRule,
} from '@/hooks/use-admin';
import { liquidGlass } from '@/constants/glass/liquid-glass';

import type { ModerationRule, ContentType } from '@/lib/api/admin';

const CONTENT_TYPES: { key: ContentType; label: string }[] = [
  { key: 'post', label: 'Posts' },
  { key: 'profile_text', label: 'Bio / Name' },
  { key: 'profile_picture', label: 'Profile Pic' },
  { key: 'event_flyer', label: 'Flyers' },
  { key: 'event_description', label: 'Event Desc' },
];

function ContentTypeTag({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tag,
        {
          overflow: 'hidden' as const,
          backgroundColor: undefined,
          borderColor: selected ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <GlassView {...(selected ? liquidGlass.fill : liquidGlass.fillFaint)} borderRadius={8} style={StyleSheet.absoluteFillObject} />
      <Text style={[styles.tagText, { color: selected ? colors.text : colors.textTertiary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RuleRow({
  rule,
  onPress,
  onToggle,
  colors,
}: {
  rule: ModerationRule;
  onPress: () => void;
  onToggle: (enabled: boolean) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity
      style={[styles.ruleRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.ruleContent}>
        <Text style={[styles.ruleName, { color: colors.text }]} numberOfLines={1}>
          {rule.name}
        </Text>
        <Text style={[styles.ruleDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {rule.description}
        </Text>
        <View style={styles.tagRow}>
          {rule.contentTypes.map((ct) => {
            const found = CONTENT_TYPES.find((c) => c.key === ct);
            return (
              <View
                key={ct}
                style={[styles.miniTag, { backgroundColor: 'rgba(0,0,0,0.06)' }]}
              >
                <Text style={[styles.miniTagText, { color: colors.textTertiary }]}>
                  {found?.label ?? ct}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <Switch
        value={rule.isEnabled}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(0,0,0,0.1)', true: 'rgba(76,175,80,0.4)' }}
        thumbColor={rule.isEnabled ? '#4CAF50' : '#888'}
      />
    </TouchableOpacity>
  );
}

export default function ModerationRulesScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors } = useAppTheme();

  const { data: rules, isLoading } = useContentModerationRules();
  const createRule = useCreateModerationRule();
  const updateRule = useUpdateModerationRule();
  const deleteRule = useDeleteModerationRule();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>([]);

  const activeCount = rules?.filter((r) => r.isEnabled).length ?? 0;

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingRule(null);
    setName('');
    setDescription('');
    setSelectedTypes([]);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEdit = useCallback((rule: ModerationRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setDescription(rule.description);
    setSelectedTypes([...rule.contentTypes]);
    setShowForm(true);
  }, []);

  const toggleContentType = useCallback((ct: ContentType) => {
    setSelectedTypes((prev) =>
      prev.includes(ct) ? prev.filter((t) => t !== ct) : [...prev, ct],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !description.trim() || selectedTypes.length === 0) {
      Alert.alert('Missing Fields', 'Name, description, and at least one content type are required.');
      return;
    }

    if (editingRule) {
      await updateRule.mutateAsync({
        id: editingRule.id,
        name: name.trim(),
        description: description.trim(),
        contentTypes: selectedTypes,
      });
    } else {
      await createRule.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        contentTypes: selectedTypes,
      });
    }
    resetForm();
  }, [name, description, selectedTypes, editingRule, updateRule, createRule, resetForm]);

  const handleDelete = useCallback(
    (rule: ModerationRule) => {
      Alert.alert('Delete Rule', `Delete "${rule.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRule.mutate(rule.id),
        },
      ]);
    },
    [deleteRule],
  );

  const handleToggle = useCallback(
    (rule: ModerationRule, enabled: boolean) => {
      updateRule.mutate({ id: rule.id, isEnabled: enabled });
    },
    [updateRule],
  );

  const renderRule = useCallback(
    ({ item }: { item: ModerationRule }) => (
      <RuleRow
        rule={item}
        onPress={() => openEdit(item)}
        onToggle={(enabled) => handleToggle(item, enabled)}
        colors={colors}
      />
    ),
    [colors, openEdit, handleToggle],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color="rgba(0,0,0,0.5)" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#000000' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        <View style={styles.pillLabel}>
          {isLiquidGlassSupported ? (
            <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
          ) : (
            <GlassView {...liquidGlass.surface} tintColor="rgba(0,0,0,0.12)" borderRadius={19} style={StyleSheet.absoluteFill} />
          )}
          <Text style={styles.pillLabelText}>Rules</Text>
        </View>
        <TouchableOpacity style={styles.pillIcon} onPress={openCreate} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={styles.topFade} pointerEvents="none" />

      {/* Form */}
      {showForm && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.formCard, { overflow: 'hidden' }]}
        >
          <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {editingRule ? 'Edit Rule' : 'New Rule'}
            </Text>
            <View style={styles.formActions}>
              {editingRule && (
                <TouchableOpacity onPress={() => handleDelete(editingRule)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={resetForm} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Rule name"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Description (sent to AI as guideline)"
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Applies to:
          </Text>
          <View style={styles.tagRow}>
            {CONTENT_TYPES.map((ct) => (
              <ContentTypeTag
                key={ct.key}
                label={ct.label}
                selected={selectedTypes.includes(ct.key)}
                onPress={() => toggleContentType(ct.key)}
                colors={colors}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { overflow: 'hidden' as const, borderColor: 'rgba(0,0,0,0.15)' },
            ]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={createRule.isPending || updateRule.isPending}
          >
            <GlassView {...liquidGlass.fill} borderRadius={10} style={StyleSheet.absoluteFillObject} />
            {(createRule.isPending || updateRule.isPending) ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.text }]}>
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Rules List */}
      <FlatList
        data={rules ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRule}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No moderation rules yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Tap + to create your first rule
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillLabel: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  pillLabelText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.8)' },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 22, },
  statLabel: { fontSize: 11, },
  formCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: { fontSize: 16, },
  formActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 13, },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, },
  saveBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 14, },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  ruleContent: { flex: 1, gap: 4 },
  ruleName: { fontSize: 15, },
  ruleDesc: { fontSize: 13, },
  miniTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  miniTagText: { fontSize: 10, },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, },
  emptySubtext: { fontSize: 13, },
});
