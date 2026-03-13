import { View, Text, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ['Personal Info', 'Address', 'Bank Account'];

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View key={i} style={styles.stepItem}>
            <View
              style={[
                styles.dot,
                i < currentStep && styles.dotCompleted,
                i === currentStep && styles.dotActive,
                i > currentStep && styles.dotInactive,
              ]}
            />
            <Text
              style={[
                styles.stepLabel,
                i === currentStep ? styles.stepLabelActive : styles.stepLabelInactive,
              ]}
            >
              {STEP_LABELS[i] ?? `Step ${i + 1}`}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep + 1) / totalSteps) * 100}%` },
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
  dotCompleted: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  dotActive: {
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  stepLabelActive: {
    color: '#fff',
  },
  stepLabelInactive: {
    color: 'rgba(255,255,255,0.4)',
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1.5,
  },
});
