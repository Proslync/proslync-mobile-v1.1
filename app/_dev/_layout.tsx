import { Stack } from "expo-router";

export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#fff",
        headerStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="health" options={{ title: "VPS Health" }} />
    </Stack>
  );
}
