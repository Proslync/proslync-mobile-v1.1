import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ['Personal Info', 'Address', 'Bank Account'];

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View key={i} style={styles.stepItem}>
            <View
              style={[
                styles.dot,
                i < currentStep && { backgroundColor: colors.textSecondary },
                i === currentStep && { backgroundColor: colors.text, shadowColor: colors.text, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 },
                i > currentStep && { backgroundColor: colors.border },
              ]}
            />
            <Text
              style={[
                styles.stepLabel,
                i === currentStep ? { color: colors.text } : { color: colors.textTertiary },
              ]}
            >
              {STEP_LABELS[i] ?? `Step ${i + 1}`}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: colors.textSecondary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLabel: {
    fontSize: 12,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
