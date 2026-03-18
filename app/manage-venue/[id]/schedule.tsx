import { useState, useCallback, useMemo, useEffect } from "react";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassSurface } from "@/components/glass/glass-surface";
import { GlassButton } from "@/components/glass/glass-button";
import { BottomSheet } from "@/components/wallet/bottom-sheet";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";
import {
  useVenueShifts,
  useVenueStaff,
  useCreateVenueShift,
  useDeleteVenueShift,
  useAssignShiftStaff,
} from "@/hooks/use-venue-schedule";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { VenueShift, VenueStaffMember } from "@/lib/api/venue-schedule";

// Get week range starting from today
function getWeekRange(offset: number) {
  const start = new Date();
  start.setDate(start.getDate() + offset * 7);
  start.setHours(0, 0, 0, 0);
  // Set to Monday
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    days: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    }),
  };
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function VenueScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const venueId = id ? Number(id) : 0;
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const { data: shifts = [], isLoading } = useVenueShifts(venueId, {
    startDate: week.startDate,
    endDate: week.endDate,
  });
  const { data: staff = [] } = useVenueStaff(venueId);
  const createShift = useCreateVenueShift(venueId);
  const deleteShift = useDeleteVenueShift(venueId);
  const assignStaff = useAssignShiftStaff(venueId);

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [assignTarget, setAssignTarget] = useState<VenueShift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VenueShift | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(week.startDate);

  // Add shift form
  const [shiftLabel, setShiftLabel] = useState("");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");

  // Assign form
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<number>>(
    new Set(),
  );

  // Reset selected day when week changes
  useEffect(() => {
    setSelectedDay(week.startDate);
  }, [week.startDate]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, VenueShift[]>();
    shifts.forEach((s) => {
      const existing = map.get(s.date) || [];
      existing.push(s);
      map.set(s.date, existing);
    });
    return map;
  }, [shifts]);

  const handleCreateShift = useCallback(async () => {
    if (!shiftLabel.trim()) return;
    await createShift.mutateAsync({
      label: shiftLabel,
      date: selectedDay,
      startTime: shiftStart,
      endTime: shiftEnd,
    });
    setShowAddSheet(false);
    setShiftLabel("");
    setShiftStart("09:00");
    setShiftEnd("17:00");
  }, [shiftLabel, selectedDay, shiftStart, shiftEnd, createShift]);

  const handleOpenAssign = useCallback((shift: VenueShift) => {
    setAssignTarget(shift);
    const existing = new Set(
      shift.assignments?.map((a) => a.venueUserId) || [],
    );
    setSelectedStaffIds(existing);
    setShowAssignSheet(true);
  }, []);

  const toggleStaffSelection = useCallback((venueUserId: number) => {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(venueUserId)) {
        next.delete(venueUserId);
      } else {
        next.add(venueUserId);
      }
      return next;
    });
  }, []);

  const handleSaveAssignments = useCallback(async () => {
    if (!assignTarget) return;
    await assignStaff.mutateAsync({
      shiftId: assignTarget.id,
      venueUserIds: Array.from(selectedStaffIds),
    });
    setShowAssignSheet(false);
    setAssignTarget(null);
  }, [assignTarget, selectedStaffIds, assignStaff]);

  const handleDeleteShift = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteShift.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteShift]);

  const weekLabel = useMemo(() => {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
  }, [week]);

  if (isLoading && shifts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Schedule
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset((o) => o - 1)}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.weekLabel, { color: colors.text }]}>
          {weekLabel}
        </Text>
        <TouchableOpacity onPress={() => setWeekOffset((o) => o + 1)}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {week.days.map((day, i) => {
          const dateStr = day.toISOString().split("T")[0];
          const isSelected = dateStr === selectedDay;
          const hasShifts = shiftsByDate.has(dateStr);
          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => setSelectedDay(dateStr)}
            >
              {isSelected && (
                <GlassView
                  {...liquidGlass.fillStrong}
                  borderRadius={12}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text
                style={[
                  styles.dayName,
                  { color: isSelected ? "#fff" : colors.textSecondary },
                ]}
              >
                {DAY_NAMES[i]}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: isSelected ? "#fff" : colors.text },
                ]}
              >
                {day.getDate()}
              </Text>
              {hasShifts && !isSelected && <View style={styles.dayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Shifts for Selected Day */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          const dayShifts = shiftsByDate.get(selectedDay) || [];
          if (dayShifts.length === 0) {
            return (
              <View style={styles.emptyDay}>
                <Ionicons
                  name="time-outline"
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No shifts scheduled
                </Text>
              </View>
            );
          }
          return dayShifts.map((shift, index) => (
            <Animated.View
              key={shift.id}
              entering={FadeInDown.delay(index * 50).duration(200)}
            >
              <GlassSurface style={styles.shiftCard}>
                <View style={styles.shiftHeader}>
                  <View style={styles.shiftInfo}>
                    <Text style={[styles.shiftLabel, { color: colors.text }]}>
                      {shift.label}
                    </Text>
                    <Text
                      style={[
                        styles.shiftTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatTime12(shift.startTime)} –{" "}
                      {formatTime12(shift.endTime)}
                    </Text>
                  </View>
                  <View style={styles.shiftActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenAssign(shift)}
                      style={styles.shiftActionButton}
                    >
                      <Ionicons
                        name="person-add-outline"
                        size={18}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(shift)}
                      style={styles.shiftActionButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="rgba(255,100,100,0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Assigned Staff */}
                {shift.assignments && shift.assignments.length > 0 ? (
                  <View style={styles.assignedList}>
                    {shift.assignments.map((a) => (
                      <View key={a.id} style={styles.assignedRow}>
                        {a.venueUser?.user?.avatar?.url ? (
                          <Image
                            source={{ uri: a.venueUser.user.avatar.url }}
                            style={styles.miniAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.miniAvatar,
                              styles.miniAvatarPlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="person"
                              size={12}
                              color={colors.textTertiary}
                            />
                          </View>
                        )}
                        <Text
                          style={[styles.assignedName, { color: colors.text }]}
                        >
                          {a.venueUser?.user?.userName
                            ? `@${a.venueUser.user.userName}`
                            : "Staff"}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    style={[styles.noAssigned, { color: colors.textTertiary }]}
                  >
                    No team assigned
                  </Text>
                )}
              </GlassSurface>
            </Animated.View>
          ));
        })()}

        <GlassButton
          label="Add Shift"
          variant="glass"
          icon="add-outline"
          onPress={() => setShowAddSheet(true)}
          style={styles.addButton}
        />
      </ScrollView>

      {/* Add Shift Sheet */}
      <BottomSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            New Shift
          </Text>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Label
          </Text>
          <View style={styles.inputWrapper}>
            {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark ? undefined : colors.backgroundSecondary,
                },
              ]}
              value={shiftLabel}
              onChangeText={setShiftLabel}
              placeholder="e.g. Happy Hour, Closing"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Start
              </Text>
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? undefined : colors.backgroundSecondary,
                    },
                  ]}
                  value={shiftStart}
                  onChangeText={setShiftStart}
                  placeholder="09:00"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
            <View style={styles.timeField}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                End
              </Text>
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? undefined : colors.backgroundSecondary,
                    },
                  ]}
                  value={shiftEnd}
                  onChangeText={setShiftEnd}
                  placeholder="17:00"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
          </View>

          <GlassButton
            label={createShift.isPending ? "Creating..." : "Create Shift"}
            variant="glass"
            onPress={handleCreateShift}
            disabled={!shiftLabel.trim() || createShift.isPending}
            style={styles.sheetButton}
          />
        </View>
      </BottomSheet>

      {/* Assign Staff Sheet */}
      <BottomSheet
        visible={showAssignSheet}
        onClose={() => setShowAssignSheet(false)}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Assign Team to {assignTarget?.label || "Shift"}
          </Text>
          {staff.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No team members. Add team members first.
            </Text>
          ) : (
            staff.map((member) => {
              const isSelected = selectedStaffIds.has(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.staffOption,
                    isSelected && styles.staffOptionSelected,
                  ]}
                  onPress={() => toggleStaffSelection(member.id)}
                >
                  {member.user?.avatar?.url ? (
                    <Image
                      source={{ uri: member.user.avatar.url }}
                      style={styles.optionAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.optionAvatar,
                        styles.miniAvatarPlaceholder,
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionName, { color: colors.text }]}>
                      {member.user?.userName
                        ? `@${member.user.userName}`
                        : "Staff"}
                    </Text>
                    <Text
                      style={[
                        styles.optionRole,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {member.role}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? "#22c55e" : "rgba(255,255,255,0.2)"}
                  />
                </TouchableOpacity>
              );
            })
          )}

          <GlassButton
            label={assignStaff.isPending ? "Saving..." : "Save Assignments"}
            variant="glass"
            onPress={handleSaveAssignments}
            disabled={assignStaff.isPending}
            style={styles.sheetButton}
          />
        </View>
      </BottomSheet>

      {/* Delete Shift Confirmation */}
      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteShift}
        title="Delete Shift"
        message={`Delete "${deleteTarget?.label || "this shift"}"? This will remove all team assignments.`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Lato_700Bold" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  weekLabel: { fontSize: 15, fontFamily: "Lato_700Bold" },
  daySelector: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingBottom: 12,
    gap: 4,
  },
  dayButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    gap: 2,
  },
  dayButtonSelected: {
    overflow: "hidden",
  },
  dayName: { fontSize: 11, fontFamily: "Lato_400Regular" },
  dayNumber: { fontSize: 16, fontFamily: "Lato_700Bold" },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    marginTop: 2,
  },
  scrollContent: { paddingHorizontal: 16, gap: 8 },
  emptyDay: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Lato_400Regular" },
  shiftCard: { borderRadius: 12, overflow: "hidden", padding: 12, gap: 8 },
  shiftHeader: { flexDirection: "row", justifyContent: "space-between" },
  shiftInfo: { flex: 1, gap: 2 },
  shiftLabel: { fontSize: 15, fontFamily: "Lato_700Bold" },
  shiftTime: { fontSize: 13, fontFamily: "Lato_400Regular" },
  shiftActions: { flexDirection: "row", gap: 8 },
  shiftActionButton: { padding: 4 },
  assignedList: { gap: 6, paddingTop: 4 },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12 },
  miniAvatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  assignedName: { fontSize: 13, fontFamily: "Lato_400Regular" },
  noAssigned: { fontSize: 12, fontFamily: "Lato_400Regular", paddingTop: 4 },
  addButton: { marginTop: 8 },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  inputLabel: { fontSize: 13, fontFamily: "Lato_700Bold" },
  inputWrapper: {
    overflow: "hidden" as const,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
  timeRow: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1, gap: 4 },
  sheetButton: { marginTop: 8 },
  staffOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 12,
  },
  staffOptionSelected: {
    borderColor: "rgba(34,197,94,0.4)",
    backgroundColor: "rgba(34,197,94,0.06)",
  },
  optionAvatar: { width: 36, height: 36, borderRadius: 18 },
  optionInfo: { flex: 1, gap: 2 },
  optionName: { fontSize: 14, fontFamily: "Lato_700Bold" },
  optionRole: { fontSize: 12, fontFamily: "Lato_400Regular" },
});
