import { Redirect } from 'expo-router';

export default function DeprecatedDealsTab() {
  return <Redirect href={"/(tabs)/index" as any} />;
}
