// components/collective/collective-view.tsx
// ── COLLECTIVE TAB HOST ────────────────────────────────────────────────────
// Charter §B — tab host. Floating bottom pill (matches athlete-view).
//   Tabs: ['Home', 'Fans']. Old top header removed.

import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';

import { CollectiveHome } from '@/components/collective/collective-home';
import { CollectiveFans } from '@/components/collective/collective-fans';
import { FloatingTabPill, useTabCollapse } from '@/components/shared/floating-tab-pill';

const TAB_BAR_TOP_FROM_BOTTOM = 90;

const COLLECTIVE_TABS = ['Home', 'Fans'] as const;
type CollectiveTabLabel = (typeof COLLECTIVE_TABS)[number];

type TabKey = 'home' | 'fans';

function tabLabelToKey(label: CollectiveTabLabel): TabKey {
  return label.toLowerCase() as TabKey;
}

export function CollectiveView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('home');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const { collapsed, onScroll } = useTabCollapse();

  const activeLabel: CollectiveTabLabel = activeTab === 'home' ? 'Home' : 'Fans';

  return (
    <View style={styles.container}>
      {/* Tab content */}
      {activeTab === 'home' && (
        <CollectiveHome topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />
      )}
      {activeTab === 'fans' && (
        <CollectiveFans topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />
      )}

      {/* Top fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      {/* Floating bottom pill */}
      <FloatingTabPill
        tabs={COLLECTIVE_TABS}
        activeKey={activeLabel}
        onSelect={(label) => setActiveTab(tabLabelToKey(label))}
        collapsed={collapsed}
        bottomInset={insets.bottom}
      />

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },
});
