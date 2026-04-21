// Chip/tag input wired to React Hook Form. Value is string[].
// User types a tag and presses Enter / comma / space-after-comma to commit.

import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
} from "react-native";
import {
  useFormContext,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

type TagInputProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  suggestions?: readonly string[];
  maxTags?: number;
} & Omit<TextInputProps, "value" | "onChangeText">;

export function TagInput<T extends FieldValues>({
  name,
  label,
  placeholder = "Type and press Enter",
  suggestions,
  maxTags = 20,
  ...props
}: TagInputProps<T>) {
  const { control } = useFormContext<T>();
  const [draft, setDraft] = React.useState("");

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const tags: string[] = Array.isArray(value) ? (value as string[]) : [];

        const commit = (raw: string) => {
          const next = raw.trim();
          if (!next) return;
          if (tags.length >= maxTags) return;
          if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) return;
          onChange([...tags, next]);
        };

        const remove = (i: number) => {
          const copy = tags.slice();
          copy.splice(i, 1);
          onChange(copy);
        };

        const handleSubmit = () => {
          if (draft.trim()) {
            commit(draft);
            setDraft("");
          }
        };

        const handleChange = (t: string) => {
          if (t.endsWith(",")) {
            commit(t.slice(0, -1));
            setDraft("");
          } else {
            setDraft(t);
          }
        };

        const notYetAdded = (suggestions ?? []).filter(
          (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
        );

        return (
          <View>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={styles.chipRow}>
              {tags.map((tag, i) => (
                <View key={`${tag}-${i}`} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => remove(i)}
                    accessibilityLabel={`Remove ${tag}`}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color="rgba(255,255,255,0.75)" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={handleChange}
                onSubmitEditing={handleSubmit}
                onBlur={handleSubmit}
                placeholder={tags.length >= maxTags ? "Max reached" : placeholder}
                placeholderTextColor="rgba(255,255,255,0.35)"
                editable={tags.length < maxTags}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCapitalize="none"
                {...props}
              />
            </View>
            {notYetAdded.length > 0 ? (
              <View style={styles.suggestRow}>
                {notYetAdded.slice(0, 8).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestChip}
                    onPress={() => commit(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestChipText}>+ {s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, color: "#FFF", marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
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
  chipText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  inputWrap: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFF",
  },
  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  suggestChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,111,60,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,111,60,0.30)",
  },
  suggestChipText: { color: "#FF6F3C", fontSize: 12, fontWeight: "600" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 4 },
});
