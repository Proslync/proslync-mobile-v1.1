// Step 2: Date & Time - Start and end date/time

import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { EventFormData } from '@/lib/schemas/events';

export function DateTimeStep() {
  const { colors, isDark } = useAppTheme();
  const { control, getValues, setValue } = useFormContext<EventFormData>();
  const accentColor = '#8b5cf6';

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'Select date';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | undefined | null) => {
    if (!date) return 'Select time';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid time';
    return dateObj.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>When does it start?</Text>
      <Controller
        control={control}
        name="startDate"
        render={({ field: { value, onChange } }) => {
          const dateValue = value instanceof Date ? value : value ? new Date(value) : new Date();
          return (
            <>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  { backgroundColor: colors.input, borderColor: colors.inputBorder },
                ]}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={accentColor} />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {formatDate(dateValue)} at {formatTime(dateValue)}
                </Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker
                  value={dateValue}
                  mode="datetime"
                  display="spinner"
                  onChange={(_, date) => {
                    setShowStartPicker(false);
                    if (date) {
                      onChange(date);
                      // Auto-adjust end date if needed
                      const endDate = getValues('endDate');
                      if (endDate && date >= endDate) {
                        setValue('endDate', new Date(date.getTime() + 4 * 60 * 60 * 1000));
                      }
                    }
                  }}
                  textColor={colors.text}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              )}
            </>
          );
        }}
      />

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>When does it end?</Text>
        <Controller
          control={control}
          name="endDate"
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            const dateValue =
              value instanceof Date
                ? value
                : value
                  ? new Date(value)
                  : new Date(Date.now() + 4 * 60 * 60 * 1000);
            const startDate = getValues('startDate');
            const minDate =
              startDate instanceof Date ? startDate : startDate ? new Date(startDate) : new Date();

            return (
              <>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: colors.input,
                      borderColor: error ? '#ef4444' : colors.inputBorder,
                    },
                  ]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={accentColor} />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {formatDate(dateValue)} at {formatTime(dateValue)}
                  </Text>
                </TouchableOpacity>
                {error && <Text style={styles.errorText}>{error.message}</Text>}

                {showEndPicker && (
                  <DateTimePicker
                    value={dateValue}
                    mode="datetime"
                    display="spinner"
                    minimumDate={minDate}
                    onChange={(_, date) => {
                      setShowEndPicker(false);
                      if (date) onChange(date);
                    }}
                    textColor={colors.text}
                    themeVariant={isDark ? 'dark' : 'light'}
                  />
                )}
              </>
            );
          }}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
    marginTop: 4,
  },
});
