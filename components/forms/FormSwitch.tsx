// Reusable Switch connected to React Hook Form via useFormContext

import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { Switch, Text, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

type FormSwitchProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  description?: string;
};

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  description,
}: FormSwitchProps<T>) {
  const { control } = useFormContext<T>();
  const { colors, isDark } = useAppTheme();
  const accentColor = isDark ? '#FFFFFF' : '#3897F0';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <View style={styles.container}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            {description && (
              <Text style={[styles.description, { color: colors.textTertiary }]}>
                {description}
              </Text>
            )}
          </View>
          <Switch
            value={value ?? false}
            onValueChange={onChange}
            trackColor={{
              false: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              true: accentColor,
            }}
            thumbColor="#fff"
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingVertical: 12,
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  description: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
});
