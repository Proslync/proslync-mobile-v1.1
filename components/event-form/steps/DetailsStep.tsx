// Step 4: Details - Capacity, age requirement, visibility, paid/free

import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FormTextInput, FormSwitch } from '@/components/forms';
import type { EventFormData } from '@/lib/schemas/events';

export function DetailsStep() {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <FormTextInput<EventFormData>
        name="maxCapacity"
        label="Capacity"
        placeholder="Max attendees (optional)"
        keyboardType="number-pad"
      />

      <View style={styles.section}>
        <FormTextInput<EventFormData>
          name="minimumAge"
          label="Minimum Age"
          placeholder="21"
          keyboardType="number-pad"
        />
      </View>

      <FormSwitch<EventFormData>
        name="isPublic"
        label="Public Event"
        description="Anyone can see and RSVP to your event"
      />

      <FormSwitch<EventFormData>
        name="isPaid"
        label="Paid Event"
        description="Charge admission with ticket tiers and pricing"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
});
