// Step 3: Location - Event venue/address

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FormTextInput } from '@/components/forms';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { EventFormData } from '@/lib/schemas/events';

export function LocationStep() {
  const { colors } = useAppTheme();

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <FormTextInput<EventFormData>
        name="location"
        label="Where is it happening?"
        placeholder="Enter address or venue name"
        autoFocus
      />
      <Text style={[styles.helperText, { color: colors.textTertiary }]}>
        Enter the full address where your event will take place
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
  },
});
