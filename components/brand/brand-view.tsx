// components/brand/brand-view.tsx
// ── BRAND DASHBOARD VIEW ─────────────────────────────────────────────────
// Charter §A — tabs wiped to: Home (default) · Book.
// Floating bottom pill (matches athlete-view). Old top header removed.
// Old tab content (PipelineTab, AthletesTab, InsightsTab, DealsTab)
// unmounted — not deleted; see _unmounted_ comments below.

import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { BrandHome } from '@/components/brand/brand-home';
import { BrandBook } from '@/components/brand/brand-book';
import { FloatingTabPill, useTabCollapse } from '@/components/shared/floating-tab-pill';

// Old tab data (BRAND_ATHLETES, BRAND_CAMPAIGNS, BRAND_DEALS, BRAND_INSIGHTS)
// still lives in lib/data/mock-brand-data.ts — untouched. Old tab components
// (PipelineTab, AthletesTab, InsightsTab, DealsTab, CampaignsTab,
//  CampaignCard, AthleteRow, Metric, parseMoney, formatMoney, daysUntil)
// are preserved as inactive comments below; unmounted but not deleted per charter.

const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar

const BRAND_TABS = ['Home', 'Book'] as const;
type BrandTabLabel = (typeof BRAND_TABS)[number];

export function BrandView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<BrandTabLabel>('Home');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const { collapsed, onScroll } = useTabCollapse();

  return (
    <View style={styles.container}>
      {activeTab === 'Home' && (
        <BrandHome topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />
      )}
      {activeTab === 'Book' && (
        <BrandBook topInset={insets.top} bottomInset={insets.bottom} onScroll={onScroll} />
      )}

      {/* ── Unmounted old tabs — not rendered, not deleted ── */}
      {/* {activeTab === '_pipeline' && <PipelineTab topPad={_topPad} bottomPad={_bottomPad} />} */}
      {/* {activeTab === '_athletes' && <AthletesTab topPad={_topPad} bottomPad={_bottomPad} />} */}
      {/* {activeTab === '_insights' && <InsightsTab topPad={_topPad} bottomPad={_bottomPad} />} */}

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
        tabs={BRAND_TABS}
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
  container: { flex: 1, backgroundColor: '#000' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },
});

// ── Unmounted old tab functions — preserved in comments per charter ────────
// The functions PipelineTab, AthletesTab, InsightsTab, DealsTab, CampaignsTab,
// CampaignCard, AthleteRow, Metric, parseMoney, formatMoney, and daysUntil
// were live here in the previous version. Their data fixtures remain unchanged
// in lib/data/mock-brand-data.ts. The functions are commented out to avoid
// TS errors from unreachable code while preserving the lineage for reference.
