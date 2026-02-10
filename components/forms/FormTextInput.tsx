// Reusable TextInput connected to React Hook Form via useFormContext

import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInput, Text, StyleSheet, TextInputProps, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

type FormTextInputProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  multiline?: boolean;
  numberOfLines?: number;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;

export function FormTextInput<T extends FieldValues>({
  name,
  label,
  multiline,
  numberOfLines,
  style,
  ...props
}: FormTextInputProps<T>) {
  const { control } = useFormContext<T>();
  const { colors } = useAppTheme();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
        <View>
          {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
          <TextInput
            style={[
              styles.input,
              multiline && styles.textArea,
              {
                backgroundColor: colors.input,
                borderColor: error ? '#ef4444' : colors.inputBorder,
                color: colors.text,
              },
              style,
            ]}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={colors.placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
            {...props}
          />
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
    marginTop: 4,
  },
});
