import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <Text style={styles.title}>This is a modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: '#fff',
  },
});
