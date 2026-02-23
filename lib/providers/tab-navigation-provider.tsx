import * as React from 'react';
import * as Haptics from 'expo-haptics';

// Tab order must match the order in (tabs)/_layout.tsx
export const TAB_ORDER = ['search', 'explore', 'index', 'activity', 'profile'] as const;
export type TabName = typeof TAB_ORDER[number];

interface TabNavigationContextType {
  currentTabIndex: number;
  currentTab: TabName;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  goToTab: (index: number) => void;
  goToTabByName: (name: TabName) => void;
  syncTabIndex: (index: number) => void;
  openAccountSwitcher: () => void;
  isAccountSwitcherOpen: boolean;
  closeAccountSwitcher: () => void;
  // New: Allow _layout.tsx to register its pager control functions
  registerPagerControl: (control: PagerControl | null) => void;
}

interface PagerControl {
  setPage: (index: number) => void;
  getCurrentIndex: () => number;
}

const TabNavigationContext = React.createContext<TabNavigationContextType | null>(null);

export function useTabNavigation() {
  const context = React.useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within TabNavigationProvider');
  }
  return context;
}

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = React.useState(false);
  const [currentTabIndex, setCurrentTabIndex] = React.useState(2); // Default to 'index' (Home)
  const pagerControlRef = React.useRef<PagerControl | null>(null);

  const currentTab = TAB_ORDER[currentTabIndex] || 'index';

  const registerPagerControl = React.useCallback((control: PagerControl | null) => {
    pagerControlRef.current = control;
    if (control) {
      setCurrentTabIndex(control.getCurrentIndex());
    }
  }, []);

  // Allow _layout.tsx to sync the current tab index when PagerView page changes
  const syncTabIndex = React.useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, TAB_ORDER.length - 1));
    setCurrentTabIndex(clamped);
  }, []);

  const navigateToTab = React.useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, TAB_ORDER.length - 1));

    if (clampedIndex === currentTabIndex) return;

    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If pager is registered, use it for navigation
    if (pagerControlRef.current) {
      pagerControlRef.current.setPage(clampedIndex);
    }

    setCurrentTabIndex(clampedIndex);
  }, [currentTabIndex]);

  const goToNextTab = React.useCallback(() => {
    if (currentTabIndex < TAB_ORDER.length - 1) {
      navigateToTab(currentTabIndex + 1);
    }
  }, [currentTabIndex, navigateToTab]);

  const goToPreviousTab = React.useCallback(() => {
    if (currentTabIndex > 0) {
      navigateToTab(currentTabIndex - 1);
    }
  }, [currentTabIndex, navigateToTab]);

  const goToTab = React.useCallback((index: number) => {
    navigateToTab(index);
  }, [navigateToTab]);

  const goToTabByName = React.useCallback((name: TabName) => {
    const index = TAB_ORDER.indexOf(name);
    if (index >= 0) {
      navigateToTab(index);
    }
  }, [navigateToTab]);

  const openAccountSwitcher = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAccountSwitcherOpen(true);
  }, []);

  const closeAccountSwitcher = React.useCallback(() => {
    setIsAccountSwitcherOpen(false);
  }, []);

  const value = React.useMemo(() => ({
    currentTabIndex,
    currentTab,
    goToNextTab,
    goToPreviousTab,
    goToTab,
    goToTabByName,
    syncTabIndex,
    openAccountSwitcher,
    isAccountSwitcherOpen,
    closeAccountSwitcher,
    registerPagerControl,
  }), [
    currentTabIndex,
    currentTab,
    goToNextTab,
    goToPreviousTab,
    goToTab,
    goToTabByName,
    syncTabIndex,
    openAccountSwitcher,
    isAccountSwitcherOpen,
    closeAccountSwitcher,
    registerPagerControl,
  ]);

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}
