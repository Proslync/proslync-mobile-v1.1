import * as React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error: Error | null; info: React.ErrorInfo | null };

export class RootErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RootErrorBoundary] caught:', error, info.componentStack);
    this.setState({ error, info });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Something crashed.</Text>
          <Text style={styles.subtitle}>
            Send this to the dev so they can fix it:
          </Text>
          <Text style={styles.code}>
            {this.state.error.name}: {this.state.error.message}
          </Text>
          {this.state.error.stack ? (
            <Text style={styles.code}>{this.state.error.stack}</Text>
          ) : null}
          {this.state.info?.componentStack ? (
            <Text style={styles.code}>{this.state.info.componentStack}</Text>
          ) : null}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 80 },
  scroll: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#FF6F3C' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  code: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
});
