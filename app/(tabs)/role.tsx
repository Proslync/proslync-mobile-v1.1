import { Redirect } from 'expo-router';

export default function DeprecatedRoleTab() {
  return <Redirect href={"/(tabs)/index" as any} />;
}
