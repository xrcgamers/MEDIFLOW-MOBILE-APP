import { Slot, usePathname, router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useAppTheme } from "../src/context/ThemeContext";
import { ToastProvider } from "../src/context/ToastContext";
import { getDefaultStaffRoute } from "../src/utils/getDefaultStaffRoute";

function AppShell() {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["/", "/report-emergency", "/track-report"];
    const isPublicRoute =
      publicRoutes.includes(pathname) || pathname.startsWith("/auth");

    const isAdminRoute = pathname.startsWith("/admin");

    if (!isAuthenticated) {
      if (!isPublicRoute) {
        router.replace("/auth/login");
      }
      return;
    }

    if (user?.role !== "ADMIN" && isAdminRoute) {
      router.replace(getDefaultStaffRoute(user?.role));
      return;
    }

    if (pathname === "/auth/login") {
      router.replace(getDefaultStaffRoute(user?.role));
    }
  }, [isLoading, isAuthenticated, pathname, user?.role]);

  if (isLoading) {
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

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}