import { NilManagerView } from '@/components/nil-manager/nil-manager-view';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { StyleSheet, View } from 'react-native';

export default function NilTab() {
  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <NilManagerView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
