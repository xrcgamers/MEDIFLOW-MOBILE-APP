import { Slot, router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { getDefaultStaffRoute } from "../../src/utils/getDefaultStaffRoute";

export default function AdminLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.replace(getDefaultStaffRoute(user?.role));
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}