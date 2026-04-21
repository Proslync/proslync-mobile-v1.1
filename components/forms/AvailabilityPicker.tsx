// Weekday toggles + blackout-date list wired to React Hook Form.
// Stores { weekdays: string[]; blackouts: string[] (ISO date) }.

import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  useFormContext,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { WEEKDAYS } from "@/lib/data/athlete-data";

type AvailabilityValue = {
  weekdays: string[];
  blackouts: string[];
};

type AvailabilityPickerProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
};

export function AvailabilityPicker<T extends FieldValues>({
  name,
  label,
}: AvailabilityPickerProps<T>) {
  const { control } = useFormContext<T>();
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => {
        const current: AvailabilityValue =
          (value as AvailabilityValue) ?? { weekdays: [], blackouts: [] };

        const toggleWeekday = (id: string) => {
          const has = current.weekdays.includes(id);
          onChange({
            ...current,
            weekdays: has
              ? current.weekdays.filter((w) => w !== id)
              : [...current.weekdays, id],
          });
        };

        const addBlackout = (date: Date) => {
          const iso = date.toISOString().slice(0, 10);
          if (current.blackouts.includes(iso)) return;
          onChange({
            ...current,
            blackouts: [...current.blackouts, iso].sort(),
          });
        };

        const removeBlackout = (iso: string) => {
          onChange({
            ...current,
            blackouts: current.blackouts.filter((b) => b !== iso),
          });
        };

        const handlePickerChange = (
          event: DateTimePickerEvent,
          selected?: Date
        ) => {
          if (Platform.OS === "android") setShowPicker(false);
          if (event.type === "set" && selected) addBlackout(selected);
        };

        return (
          <View>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <Text style={styles.helperText}>Days you're open to appearances</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((d) => {
                const active = current.weekdays.includes(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.weekday, active && styles.weekdayActive]}
                    onPress={() => toggleWeekday(d.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        active && styles.weekdayTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.helperText, { marginTop: 16 }]}>
              Blackout dates (unavailable)
            </Text>
            <View style={styles.blackoutRow}>
              {current.blackouts.map((iso) => (
                <View key={iso} style={styles.blackoutChip}>
                  <Text style={styles.blackoutText}>{iso}</Text>
                  <TouchableOpacity
                    onPress={() => removeBlackout(iso)}
                    accessibilityLabel={`Remove ${iso}`}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color="rgba(255,255,255,0.75)" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addChip}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={14} color="#FF6F3C" />
                <Text style={styles.addChipText}>Add date</Text>
              </TouchableOpacity>
            </View>
            {showPicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handlePickerChange}
                minimumDate={new Date()}
                themeVariant="dark"
              />
            )}
            {Platform.OS === "ios" && showPicker && (
              <TouchableOpacity
                style={styles.closePickerBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.closePickerText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, color: "#FFF", marginBottom: 10 },
  helperText: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 10 },
  weekdayRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  weekday: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    minWidth: 50,
    alignItems: "center",
  },
  weekdayActive: {
    backgroundColor: "rgba(255,111,60,0.15)",
    borderColor: "rgba(255,111,60,0.45)",
  },
  weekdayText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  weekdayTextActive: { color: "#FF6F3C" },
  blackoutRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  blackoutChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  blackoutText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,111,60,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,111,60,0.30)",
  },
  addChipText: { color: "#FF6F3C", fontSize: 13, fontWeight: "600" },
  closePickerBtn: { alignSelf: "flex-end", marginTop: 8, padding: 10 },
  closePickerText: { color: "#FF6F3C", fontSize: 15, fontWeight: "600" },
});
