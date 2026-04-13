import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/constants/theme";

export default function StaffLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isBootstrapping, segments]);

  if (isBootstrapping) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});