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
      <Stack.Screen name="index" options={{ title: "Dev Tools" }} />
      <Stack.Screen name="health" options={{ title: "VPS Health" }} />
      <Stack.Screen name="personas" options={{ title: "Personas" }} />
      <Stack.Screen name="cache" options={{ title: "React Query Cache" }} />
      <Stack.Screen name="entities" options={{ title: "Entities" }} />
      <Stack.Screen name="flags" options={{ title: "Feature Flags" }} />
      <Stack.Screen name="sockets" options={{ title: "Sockets" }} />
    </Stack>
  );
}
