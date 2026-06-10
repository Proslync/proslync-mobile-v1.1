import { SchoolView } from '@/components/school/school-view';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { StyleSheet, View } from 'react-native';

export default function AdTab() {
  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <SchoolView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
