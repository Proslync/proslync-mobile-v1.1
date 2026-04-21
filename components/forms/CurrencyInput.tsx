// $-prefixed whole-dollar input wired to React Hook Form. Stores cents.

import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import {
  useFormContext,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";

type CurrencyInputProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  placeholder?: string;
} & Omit<TextInputProps, "value" | "onChangeText">;

const formatWithCommas = (digits: string) => {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function CurrencyInput<T extends FieldValues>({
  name,
  label,
  placeholder = "500",
  ...props
}: CurrencyInputProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const cents = typeof value === "number" ? value : 0;
        const whole = Math.floor(cents / 100);
        const [raw, setRaw] = React.useState<string>(whole ? String(whole) : "");

        // Keep local text state synced when the form resets externally.
        React.useEffect(() => {
          const nextWhole = whole ? String(whole) : "";
          if (nextWhole !== raw) setRaw(nextWhole);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [cents]);

        const handleChange = (text: string) => {
          const digits = text.replace(/[^\d]/g, "").slice(0, 9);
          setRaw(digits);
          onChange(digits ? Number(digits) * 100 : 0);
        };

        return (
          <View>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={[styles.wrap, error && styles.wrapError]}>
              <Text style={styles.prefix}>$</Text>
              <TextInput
                style={styles.input}
                value={formatWithCommas(raw)}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
                {...props}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, color: "#FFF", marginBottom: 10 },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 6,
  },
  wrapError: { borderColor: "#ef4444" },
  prefix: { color: "rgba(255,255,255,0.65)", fontSize: 18, fontWeight: "600" },
  input: { flex: 1, color: "#FFF", fontSize: 18, fontWeight: "600" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 4 },
});
