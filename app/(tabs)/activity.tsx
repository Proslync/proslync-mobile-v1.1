import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRole } from '@/lib/providers/role-provider';
import { CoachView } from '@/components/coach/coach-view';
import { AgentView } from '@/components/agent/agent-view';
import { BrandView } from '@/components/brand/brand-view';
import { FanView } from '@/components/fan/fan-view';
import { SchoolView } from '@/components/school/school-view';
import { NilManagerView } from '@/components/nil-manager/nil-manager-view';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

function PlayerActivityPlaceholder() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}>
        <View style={styles.header}>
          <Image source={DefaultAvatarImage} style={styles.avatar} />
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Player feed lands in Phase 2 (athlete role port)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ActivityTab() {
  const { role } = useRole();
  if (role === 'coach') return <CoachView />;
  if (role === 'agent') return <AgentView />;
  if (role === 'brand') return <BrandView />;
  if (role === 'fan') return <FanView />;
  if (role === 'school') return <SchoolView />;
  if (role === 'nilManager') return <NilManagerView />;
  return <PlayerActivityPlaceholder />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 24, alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 48 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
