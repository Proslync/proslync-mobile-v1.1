import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { GlassSegmentedControl } from "@/modules/expo-glass-segmented";
import {
  FormTextInput,
  TagInput,
  CurrencyInput,
  AvailabilityPicker,
} from "@/components/forms";
import {
  SPORTS,
  SCHOOLS,
  DIVISIONS,
  DEAL_TYPES,
  CONTENT_CATEGORIES,
  findSchool,
  positionsForSports,
} from "@/lib/data/athlete-data";
import {
  athleteRegistrationSchema,
  type AthleteRegistrationValues,
} from "@/lib/validation/athlete-registration";

type Section = "Identity" | "Profile" | "Deals";

interface AthleteProfileStepProps {
  onComplete: (values: AthleteRegistrationValues) => void;
  onBack: () => void;
}

export function AthleteProfileStep({
  onComplete,
  onBack,
}: AthleteProfileStepProps) {
  const insets = useSafeAreaInsets();
  const [section, setSection] = React.useState<Section>("Identity");
  const [schoolPickerOpen, setSchoolPickerOpen] = React.useState(false);

  const methods = useForm<AthleteRegistrationValues>({
    resolver: zodResolver(athleteRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      legalName: "",
      displayName: "",
      profilePhotoUri: "",
      sports: [],
      schoolId: "",
      conference: "",
      division: "",
      position: "",
      hometown: "",
      jerseyNumber: "",
      agentName: "",
      agentEmail: "",
      currentBrands: [],
      charities: [],
      extracurriculars: [],
      interests: [],
      bio: "",
      minDealAmountCents: 0,
      dealTypes: [],
      contentCategories: [],
      availability: { weekdays: [], blackouts: [] },
    },
  });

  const schoolId = methods.watch("schoolId");
  const sports = methods.watch("sports");
  const profilePhotoUri = methods.watch("profilePhotoUri");

  // Auto-populate conference + division from school.
  React.useEffect(() => {
    if (!schoolId) return;
    const school = findSchool(schoolId);
    if (school) {
      methods.setValue("conference", school.conference, { shouldValidate: true });
      if (!methods.getValues("division")) {
        methods.setValue("division", school.division, { shouldValidate: true });
      }
    }
  }, [schoolId, methods]);

  const positionOptions = React.useMemo(() => positionsForSports(sports ?? []), [sports]);

  const handleNext = async () => {
    if (section === "Identity") {
      const ok = await methods.trigger([
        "legalName",
        "displayName",
        "profilePhotoUri",
        "sports",
        "schoolId",
        "conference",
        "division",
        "hometown",
      ]);
      if (ok) setSection("Profile");
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (section === "Profile") {
      const ok = await methods.trigger([
        "agentEmail",
        "bio",
      ]);
      if (ok) setSection("Deals");
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const ok = await methods.trigger([
        "minDealAmountCents",
        "dealTypes",
      ]);
      if (!ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      const values = methods.getValues();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(values);
    }
  };

  const handleBackBtn = () => {
    if (section === "Deals") setSection("Profile");
    else if (section === "Profile") setSection("Identity");
    else onBack();
  };

  const pickProfilePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Library access required", "Grant access to pick a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      methods.setValue("profilePhotoUri", result.assets[0].uri, {
        shouldValidate: true,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackBtn} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Build your profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <GlassSegmentedControl
          style={styles.segmented}
          options={["Identity", "Profile", "Deals"] as const}
          selected={section}
          onChange={(s) => setSection(s as Section)}
          fontSize={13}
        />

        <FormProvider {...methods}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + 120 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {section === "Identity" ? (
              <View style={styles.gap}>
                <TouchableOpacity
                  style={styles.avatarPicker}
                  onPress={pickProfilePhoto}
                  activeOpacity={0.8}
                >
                  {profilePhotoUri ? (
                    <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={28} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.avatarHelper}>Add photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {methods.formState.errors.profilePhotoUri ? (
                  <Text style={styles.errorText}>Profile photo is required</Text>
                ) : null}

                <FormTextInput<AthleteRegistrationValues>
                  name="legalName"
                  label="Full legal name"
                  placeholder="Jane Avery Rodriguez"
                  autoCapitalize="words"
                />
                <FormTextInput<AthleteRegistrationValues>
                  name="displayName"
                  label="Display name"
                  placeholder="jrodg"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Sport</Text>
                <MultiChipField
                  options={SPORTS.map((s) => ({ value: s.id, label: s.label }))}
                  values={sports ?? []}
                  onChange={(v) => methods.setValue("sports", v, { shouldValidate: true })}
                />

                <Text style={styles.label}>School / Institution</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setSchoolPickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectValue, !schoolId && styles.selectPlaceholder]}>
                    {schoolId ? findSchool(schoolId)?.name : "Select your school"}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                <FormTextInput<AthleteRegistrationValues>
                  name="conference"
                  label="Conference (auto)"
                  editable={false}
                />

                <Text style={styles.label}>Division level</Text>
                <SingleChipField
                  options={DIVISIONS.map((d) => ({ value: d, label: d }))}
                  value={methods.watch("division")}
                  onChange={(v) =>
                    methods.setValue("division", v, { shouldValidate: true })
                  }
                />

                {positionOptions.length > 0 ? (
                  <>
                    <Text style={styles.label}>Position</Text>
                    <SingleChipField
                      options={positionOptions.map((p) => ({ value: p, label: p }))}
                      value={methods.watch("position") ?? ""}
                      onChange={(v) =>
                        methods.setValue("position", v, { shouldValidate: true })
                      }
                    />
                  </>
                ) : null}

                <FormTextInput<AthleteRegistrationValues>
                  name="hometown"
                  label="Hometown"
                  placeholder="San Diego, CA"
                />
                <FormTextInput<AthleteRegistrationValues>
                  name="jerseyNumber"
                  label="Jersey number (optional)"
                  placeholder="0 – 99"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            ) : null}

            {section === "Profile" ? (
              <View style={styles.gap}>
                <FormTextInput<AthleteRegistrationValues>
                  name="agentName"
                  label="Agent / representative (optional)"
                  placeholder="Name"
                />
                <FormTextInput<AthleteRegistrationValues>
                  name="agentEmail"
                  label="Agent email (optional)"
                  placeholder="agent@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TagInput<AthleteRegistrationValues>
                  name="currentBrands"
                  label="Current brands / partners"
                  placeholder="Add a brand…"
                  suggestions={["Nike", "Adidas", "Gatorade", "Celsius", "Gymshark"]}
                />
                <TagInput<AthleteRegistrationValues>
                  name="charities"
                  label="Charities you support"
                  placeholder="Add a charity…"
                  suggestions={[
                    "Boys & Girls Clubs",
                    "After-School All-Stars",
                    "Team IMPACT",
                    "Make-A-Wish",
                  ]}
                />
                <TagInput<AthleteRegistrationValues>
                  name="extracurriculars"
                  label="Extracurriculars"
                  placeholder="e.g. student government"
                />
                <TagInput<AthleteRegistrationValues>
                  name="interests"
                  label="Hobbies & interests"
                  placeholder="e.g. music, gaming"
                  suggestions={[
                    "Music",
                    "Gaming",
                    "Fashion",
                    "Cooking",
                    "Photography",
                    "Film",
                    "Real estate",
                    "Entrepreneurship",
                  ]}
                />
                <FormTextInput<AthleteRegistrationValues>
                  name="bio"
                  label="Personal bio (250 words max)"
                  placeholder="Your story in your own words…"
                  multiline
                  numberOfLines={6}
                />
              </View>
            ) : null}

            {section === "Deals" ? (
              <View style={styles.gap}>
                <CurrencyInput<AthleteRegistrationValues>
                  name="minDealAmountCents"
                  label="Minimum deal amount"
                  placeholder="500"
                />

                <Text style={styles.label}>Deal types accepted</Text>
                <MultiChipField
                  options={DEAL_TYPES.map((t) => ({ value: t, label: t }))}
                  values={methods.watch("dealTypes") ?? []}
                  onChange={(v) =>
                    methods.setValue("dealTypes", v, { shouldValidate: true })
                  }
                />
                {methods.formState.errors.dealTypes ? (
                  <Text style={styles.errorText}>Pick at least one deal type</Text>
                ) : null}

                <Text style={styles.label}>Content categories you're comfortable with</Text>
                <MultiChipField
                  options={CONTENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  values={methods.watch("contentCategories") ?? []}
                  onChange={(v) =>
                    methods.setValue("contentCategories", v, { shouldValidate: true })
                  }
                />

                <AvailabilityPicker<AthleteRegistrationValues>
                  name="availability"
                  label="Availability for appearances"
                />
              </View>
            ) : null}
          </ScrollView>
        </FormProvider>

        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {section === "Deals" ? "Complete registration" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SchoolPicker
        visible={schoolPickerOpen}
        onClose={() => setSchoolPickerOpen(false)}
        onSelect={(id) => {
          methods.setValue("schoolId", id, { shouldValidate: true });
          setSchoolPickerOpen(false);
        }}
        selectedId={schoolId}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Inline helpers ────────────────────────────────────────────────

function MultiChipField({
  options,
  values,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) => {
    const has = values.includes(v);
    onChange(has ? values.filter((x) => x !== v) : [...values, v]);
  };
  return (
    <View style={styles.chipGrid}>
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.optChip, active && styles.optChipActive]}
            onPress={() => toggle(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SingleChipField({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.optChip, active && styles.optChipActive]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optChipText, active && styles.optChipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SchoolPicker({
  visible,
  onClose,
  onSelect,
  selectedId,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SCHOOLS;
    return SCHOOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.conference.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.pickerRoot}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={styles.pickerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>Select school</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.pickerSearch}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.55)" />
          <TextInput
            style={styles.pickerSearchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or conference"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerRowName}>{item.name}</Text>
                <Text style={styles.pickerRowMeta}>
                  {item.conference} · {item.division}
                </Text>
              </View>
              {selectedId === item.id ? (
                <Ionicons name="checkmark" size={22} color="#FF6F3C" />
              ) : null}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
          ListEmptyComponent={
            <Text style={styles.pickerEmpty}>No schools match "{query}"</Text>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  segmented: { marginBottom: 8, height: 52 },
  scroll: { paddingTop: 8 },
  gap: { gap: 18 },
  label: { fontSize: 16, color: "#FFF", marginBottom: 10, marginTop: 2 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  optChipActive: {
    backgroundColor: "rgba(255,111,60,0.15)",
    borderColor: "rgba(255,111,60,0.45)",
  },
  optChipText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" },
  optChipTextActive: { color: "#FF6F3C" },
  avatarPicker: {
    alignSelf: "center",
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarHelper: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectValue: { flex: 1, color: "#FFF", fontSize: 16 },
  selectPlaceholder: { color: "rgba(255,255,255,0.4)" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: -8 },
  ctaBar: { paddingTop: 10, paddingHorizontal: 0 },
  primaryBtn: {
    backgroundColor: "#FF6F3C",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },

  // School picker
  pickerRoot: { flex: 1, backgroundColor: "#0b0b0b" },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  pickerCancel: { color: "#FF6F3C", fontSize: 16, fontWeight: "600", width: 50 },
  pickerTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  pickerSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pickerSearchInput: { flex: 1, color: "#FFF", fontSize: 15 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pickerRowName: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  pickerRowMeta: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },
  pickerSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 20,
  },
  pickerEmpty: {
    textAlign: "center",
    padding: 32,
    color: "rgba(255,255,255,0.4)",
  },
});
