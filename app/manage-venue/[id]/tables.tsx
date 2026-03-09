import { useState } from 'react';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { BottomSheet } from '@/components/wallet/bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  useVenueSections,
  useCreateSection,
  useDeleteSection,
  useCreateTable,
  useDeleteTable,
} from '@/hooks/use-venue-tables';
import { filesApi } from '@/lib/api/files';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VenueTablesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const venueId = id ? Number(id) : undefined;

  const { data: sections = [], isLoading } = useVenueSections(venueId);
  const createSection = useCreateSection(venueId!);
  const deleteSection = useDeleteSection(venueId!);
  const createTable = useCreateTable(venueId!);
  const deleteTable = useDeleteTable(venueId!);

  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddTable, setShowAddTable] = useState<{ visible: boolean; sectionId: number | null }>({
    visible: false,
    sectionId: null,
  });

  const [sectionName, setSectionName] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableSeatCount, setTableSeatCount] = useState('');
  const [tablePrice, setTablePrice] = useState('');
  const [tableImageUri, setTableImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [permissionAlert, setPermissionAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteTableTarget, setDeleteTableTarget] = useState<{ id: number; label: string } | null>(null);

  const pickTableImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setPermissionAlert(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTableImageUri(result.assets[0].uri);
    }
  };

  const handleCreateSection = async () => {
    if (!sectionName.trim()) return;
    try {
      await createSection.mutateAsync({
        name: sectionName.trim(),
        description: sectionDesc.trim() || undefined,
      });
      setShowAddSection(false);
      setSectionName('');
      setSectionDesc('');
    } catch (err: any) {
      console.error('Failed to create section:', err?.message || err);
      setErrorAlert(err?.message || 'Failed to create section. Please try again.');
    }
  };

  const handleCreateTable = async () => {
    if (!tableLabel.trim() || !tableSeatCount.trim() || !tablePrice.trim() || !showAddTable.sectionId) return;
    setIsUploading(true);
    try {
      let imageUrl: string | undefined;
      if (tableImageUri) {
        try {
          imageUrl = await filesApi.uploadTableImage(tableImageUri);
        } catch (uploadErr: any) {
          console.warn('Image upload failed, creating table without image:', uploadErr?.message);
        }
      }

      await createTable.mutateAsync({
        sectionId: showAddTable.sectionId,
        label: tableLabel.trim(),
        seatCount: parseInt(tableSeatCount, 10),
        minimumSpend: parseFloat(tablePrice),
        imageUrl,
      });
      setShowAddTable({ visible: false, sectionId: null });
      setTableLabel('');
      setTableSeatCount('');
      setTablePrice('');
      setTableImageUri(null);
    } catch (err: any) {
      console.error('Failed to create table:', err?.message || err, err?.response || '');
      setErrorAlert(err?.message || 'Failed to create table. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSection = (sectionId: number, name: string) => {
    setDeleteSectionTarget({ id: sectionId, name });
  };

  const handleDeleteTable = (tableId: number, label: string) => {
    setDeleteTableTarget({ id: tableId, label });
  };

  const resetTableForm = () => {
    setShowAddTable({ visible: false, sectionId: null });
    setTableLabel('');
    setTableSeatCount('');
    setTablePrice('');
    setTableImageUri(null);
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
    },
  ];

  const inputPlaceholderColor = colors.textTertiary;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tables</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tables</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty state */}
        {sections.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No table sections yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Add a section to get started.
            </Text>
          </Animated.View>
        ) : (
          sections.map((section, index) => (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(index * 60).duration(300)}
              style={styles.sectionWrapper}
            >
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.sectionCard}>
                {/* Section header row */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionIconBg, { backgroundColor: colors.backgroundSecondary }]}>
                      <Ionicons name="grid-outline" size={16} color={colors.text} />
                    </View>
                    <View style={styles.sectionTitleBlock}>
                      <Text style={[styles.sectionName, { color: colors.text }]}>{section.name}</Text>
                      {section.description ? (
                        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                          {section.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSection(section.id, section.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />

                {/* Tables list */}
                {section.tables.length === 0 ? (
                  <View style={styles.noTablesRow}>
                    <Text style={[styles.noTablesText, { color: colors.textTertiary }]}>
                      No tables in this section
                    </Text>
                  </View>
                ) : (
                  section.tables.map((table, tIndex) => (
                    <View key={table.id}>
                      {tIndex > 0 && (
                        <View style={[styles.tableDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} />
                      )}
                      <View style={styles.tableRow}>
                        {table.imageUrl ? (
                          <Image source={{ uri: table.imageUrl }} style={styles.tableThumb} />
                        ) : (
                          <View style={[styles.tableIconBg, { backgroundColor: colors.backgroundSecondary }]}>
                            <Ionicons name="square-outline" size={14} color={colors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.tableInfo}>
                          <Text style={[styles.tableLabel, { color: colors.text }]}>{table.label}</Text>
                          <Text style={[styles.tableSeatCount, { color: colors.textTertiary }]}>
                            {table.seatCount} {table.seatCount === 1 ? 'seat' : 'seats'}
                          </Text>
                        </View>
                        {table.minimumSpend != null && Number(table.minimumSpend) > 0 ? (
                          <Text style={[styles.tablePriceTag, { color: colors.text }]}>
                            ${Number(table.minimumSpend).toLocaleString()}
                          </Text>
                        ) : null}
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteTable(table.id, table.label)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle-outline" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                {/* Add Table button */}
                <View style={[styles.addTableRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                  <TouchableOpacity
                    style={styles.addTableButton}
                    onPress={() => setShowAddTable({ visible: true, sectionId: section.id })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.addTableText, { color: colors.textSecondary }]}>Add Table</Text>
                  </TouchableOpacity>
                </View>
              </GlassSurface>
            </Animated.View>
          ))
        )}

        {/* Add Section button */}
        <Animated.View entering={FadeInDown.delay(sections.length * 60).duration(300)} style={styles.addSectionRow}>
          <GlassButton
            label="Add Section"
            icon={<Ionicons name="add" size={18} color={isDark ? '#ffffff' : '#1a1a1a'} />}
            variant="glass"
            size="md"
            fullWidth
            onPress={() => setShowAddSection(true)}
          />
        </Animated.View>
      </ScrollView>

      {/* Add Section Bottom Sheet */}
      <BottomSheet
        visible={showAddSection}
        onClose={() => {
          setShowAddSection(false);
          setSectionName('');
          setSectionDesc('');
        }}
      >
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Section</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
              Sections group tables together (e.g. VIP, Main Floor)
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Section Name</Text>
            <TextInput
              style={inputStyle}
              value={sectionName}
              onChangeText={setSectionName}
              placeholder="e.g. VIP Section"
              placeholderTextColor={inputPlaceholderColor}
              autoFocus
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Description{' '}
              <Text style={[styles.fieldLabelOptional, { color: colors.textTertiary }]}>(optional)</Text>
            </Text>
            <TextInput
              style={inputStyle}
              value={sectionDesc}
              onChangeText={setSectionDesc}
              placeholder="e.g. Premium elevated seating area"
              placeholderTextColor={inputPlaceholderColor}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleCreateSection();
              }}
            />

            <View style={styles.sheetActions}>
              <GlassButton
                label="Create Section"
                variant="glass"
                size="md"
                fullWidth
                loading={createSection.isPending}
                disabled={!sectionName.trim() || createSection.isPending}
                onPress={handleCreateSection}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Add Table Bottom Sheet */}
      <BottomSheet visible={showAddTable.visible} onClose={resetTableForm}>
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Table</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
              Add a VIP table to the selected section
            </Text>

            {/* Image picker */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Photo{' '}
              <Text style={[styles.fieldLabelOptional, { color: colors.textTertiary }]}>(optional)</Text>
            </Text>
            <TouchableOpacity onPress={pickTableImage} activeOpacity={0.7}>
              {tableImageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: tableImageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => setTableImageUri(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[
                  styles.imagePlaceholder,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  },
                ]}>
                  <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.textTertiary }]}>
                    Add a photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Table Label</Text>
            <TextInput
              style={inputStyle}
              value={tableLabel}
              onChangeText={setTableLabel}
              placeholder="e.g. T1, Table 1, Booth A"
              placeholderTextColor={inputPlaceholderColor}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Seat Count</Text>
            <TextInput
              style={inputStyle}
              value={tableSeatCount}
              onChangeText={setTableSeatCount}
              placeholder="e.g. 8"
              placeholderTextColor={inputPlaceholderColor}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Price</Text>
            <TextInput
              style={inputStyle}
              value={tablePrice}
              onChangeText={setTablePrice}
              placeholder="e.g. 500"
              placeholderTextColor={inputPlaceholderColor}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleCreateTable();
              }}
            />

            <View style={styles.sheetActions}>
              <GlassButton
                label={isUploading ? 'Uploading...' : 'Create Table'}
                variant="glass"
                size="md"
                fullWidth
                loading={isUploading || createTable.isPending}
                disabled={!tableLabel.trim() || !tableSeatCount.trim() || !tablePrice.trim() || isUploading || createTable.isPending}
                onPress={handleCreateTable}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>

      <ConfirmModal
        visible={permissionAlert}
        onClose={() => setPermissionAlert(false)}
        title="Permission Required"
        message="Permission to access photos is required."
        alertOnly
        icon="camera-outline"
      />

      <ConfirmModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        title="Error"
        message={errorAlert || ''}
        alertOnly
        icon="alert-circle-outline"
      />

      <ConfirmModal
        visible={!!deleteSectionTarget}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={() => { if (deleteSectionTarget) { deleteSection.mutateAsync(deleteSectionTarget.id); setDeleteSectionTarget(null); } }}
        title="Delete Section"
        message={`Delete "${deleteSectionTarget?.name}"? All tables in this section will also be deleted.`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />

      <ConfirmModal
        visible={!!deleteTableTarget}
        onClose={() => setDeleteTableTarget(null)}
        onConfirm={() => { if (deleteTableTarget) { deleteTable.mutateAsync(deleteTableTarget.id); setDeleteTableTarget(null); } }}
        title="Delete Table"
        message={`Delete table "${deleteTableTarget?.label}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  sectionWrapper: {},
  sectionCard: {
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleBlock: {
    flex: 1,
  },
  sectionName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  noTablesRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noTablesText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  tableDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  tableThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  tableIconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableInfo: {
    flex: 1,
  },
  tableLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  tableSeatCount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  tablePriceTag: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    marginRight: 4,
  },
  addTableRow: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addTableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addTableText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  addSectionRow: {
    marginTop: 4,
  },
  // Bottom sheet
  sheetContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 20,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldLabelOptional: {
    fontFamily: 'Lato_400Regular',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 12,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
  },
  sheetActions: {
    marginTop: 4,
  },
  // Image picker
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 0,
  },
  imagePreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  imagePlaceholder: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 0,
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
});
