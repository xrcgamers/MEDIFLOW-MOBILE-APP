import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "MediFlow" }} />
      <Stack.Screen name="report" options={{ title: "Report Emergency" }} />
      <Stack.Screen name="track" options={{ title: "Track Report" }} />
    </Stack>
  );
}