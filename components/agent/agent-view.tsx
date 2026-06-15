// components/agent/agent-view.tsx
// ── AGENT DASHBOARD VIEW ─────────────────────────────────────────────────
// Charter §A — tabs wiped to: Home (default) · Clients.
// Floating bottom pill (matches athlete-view). Old top header removed.
// Old tab content (PipelineTab, RosterTab, InsightsTab) unmounted — files
// not deleted; see _unmounted_ sections below.

import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { AgentHome } from '@/components/agent/agent-home';
import { AgentClients } from '@/components/agent/agent-clients';
import { FloatingTabPill, useTabCollapse } from '@/components/shared/floating-tab-pill';
import { CANVAS } from '@/components/shared/ui-kit/tokens';

// Old tab data (AGENT_ATHLETES, AGENT_DEALS, AGENT_OFFERS, AGENT_INSIGHTS) still
// lives in lib/data/mock-agent-data.ts — untouched. Old tab components
// (PipelineTab, RosterTab, InsightsTab) are inlined below in commented form;
// they are unmounted but not deleted per charter pattern.

const TAB_BAR_TOP_FROM_BOTTOM = 90;

const AGENT_TABS = ['Home', 'Clients'] as const;
type AgentTabLabel = (typeof AGENT_TABS)[number];

export function AgentView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<AgentTabLabel>('Home');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const { collapsed, onScroll } = useTabCollapse();

  return (
    <View style={styles.container}>
      {activeTab === 'Home' && (
        <AgentHome topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />
      )}
      {activeTab === 'Clients' && (
        <AgentClients topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />
      )}

      {/* ── Unmounted old tabs — not rendered, not deleted ── */}
      {/* {activeTab === '_pipeline' && <PipelineTab topPad={topPad} bottomPad={bottomPad} />} */}
      {/* {activeTab === '_roster' && <RosterTab topPad={topPad} bottomPad={bottomPad} />} */}
      {/* {activeTab === '_insights' && <InsightsTab topPad={topPad} bottomPad={bottomPad} />} */}

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
        tabs={AGENT_TABS}
        activeKey={activeTab}
        onSelect={setActiveTab}
        collapsed={collapsed}
        bottomInset={insets.bottom}
      />

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },
});

