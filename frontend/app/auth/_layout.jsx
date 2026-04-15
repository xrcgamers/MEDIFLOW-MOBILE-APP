import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";

export default function AuthLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { colors } = useAppTheme();
  const segments = useSegments();

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/staff");
    }
  }, [isAuthenticated, isBootstrapping, segments]);

  if (isBootstrapping) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[styles.loaderText, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.6}
        >
          Restoring session...
        </Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
});