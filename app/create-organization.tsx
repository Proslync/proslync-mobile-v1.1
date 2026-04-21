import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassView } from 'expo-glass-effect';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';
import { useCreateOrganization } from '@/hooks/use-organization-mutations';
import {
  liquidGlass,
  glassBorder,
  glassText,
  glassSurfaceTint,
} from '@/constants/glass/liquid-glass';

export default function CreateOrganizationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { isDark, colors } = useAppTheme();
  const { refreshUser } = useAuth();
  const createOrg = useCreateOrganization();

  const [name, setName] = React.useState('');

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const handleSubmit = () => {
    if (!name.trim()) {
      showError('Organization name is required');
      return;
    }

    createOrg.mutate(
      { name: name.trim() },
      {
        onSuccess: async () => {
          await refreshUser();
          showSuccess('Organization created!');
          router.back();
        },
        onError: (error) => {
          showError(error.message || 'Failed to create organization');
        },
      },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: border }]}
          onPress={() => router.back()}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="arrow-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Create Organization</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.formContent}>
          <Text style={[styles.label, { color: t.primary }]}>Organization Name</Text>
          <View style={[styles.inputWrapper, { borderColor: border }]}>
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={12} style={StyleSheet.absoluteFill} />
            <TextInput
              style={[styles.input, { color: t.primary }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter organization name"
              placeholderTextColor={t.faint}
              autoFocus
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !name.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createOrg.isPending || !name.trim()}
            activeOpacity={0.7}
          >
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />
            {createOrg.isPending ? (
              <ActivityIndicator color={t.primary} />
            ) : (
              <Text style={[styles.submitText, { color: t.primary }]}>Create Organization</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSpacer: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 15,
  },
  inputWrapper: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: 16,
  },
});
