// Reusable Select (chip-style picker) connected to React Hook Form via useFormContext

import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { Text, StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';

export interface SelectOption {
  value: string;
  label: string;
}

type FormSelectProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  description?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function FormSelect<T extends FieldValues>({
  name,
  label,
  description,
  options,
  placeholder,
}: FormSelectProps<T>) {
  const { control } = useFormContext<T>();
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <View style={styles.container}>
          {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
          {description && (
            <Text style={[styles.description, { color: colors.textTertiary }]}>
              {description}
            </Text>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {/* None / clear option */}
            {placeholder && (
              <TouchableOpacity
                onPress={() => onChange(undefined)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  {
                    overflow: 'hidden',
                    borderColor: !value ? `${glassColor}0.25)` : `${glassColor}0.1)`,
                  },
                ]}
              >
                <GlassView
                  {...(!value ? liquidGlass.fill : liquidGlass.fillFaint)}
                  borderRadius={10}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: !value ? colors.text : colors.textTertiary },
                  ]}
                >
                  {placeholder}
                </Text>
              </TouchableOpacity>
            )}
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onChange(isSelected ? undefined : option.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    {
                      overflow: 'hidden',
                      borderColor: isSelected ? `${glassColor}0.25)` : `${glassColor}0.1)`,
                    },
                  ]}
                >
                  <GlassView
                    {...(isSelected ? liquidGlass.fill : liquidGlass.fillFaint)}
                    borderRadius={10}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? colors.text : colors.textTertiary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
});
