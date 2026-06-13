import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

export type ProfileRole = 'player' | 'coach' | 'agent' | 'brand' | 'fan' | 'school' | 'nilManager' | 'collective';

const STORAGE_KEY = '@proslync/profile-role';

type RoleContextValue = {
  role: ProfileRole;
  setRole: (role: ProfileRole) => void;
  ready: boolean;
};

const RoleContext = React.createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<ProfileRole>('player');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && ['player', 'coach', 'agent', 'brand', 'fan', 'school', 'nilManager', 'collective'].includes(stored)) {
          setRoleState(stored as ProfileRole);
        }
      } catch {
        // ignore — fall back to default
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setRole = React.useCallback((next: ProfileRole) => {
    setRoleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = React.useMemo(() => ({ role, setRole, ready }), [role, setRole, ready]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
