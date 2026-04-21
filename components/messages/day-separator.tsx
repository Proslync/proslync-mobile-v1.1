// Day Separator - Date divider between messages

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDateLabel } from '@/lib/utils/date';

interface DaySeparatorProps {
  date: Date;
}

export function DaySeparator({ date }: DaySeparatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{formatDateLabel(date)}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
