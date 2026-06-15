import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";

export default function AuthLayout() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/staff");
      }
    }
  }, [isLoading, isAuthenticated, user, segments]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});