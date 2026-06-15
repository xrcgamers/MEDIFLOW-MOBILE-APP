import { useEffect } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import PageHeader from "../../src/components/PageHeader";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { getDefaultStaffRoute } from "../../src/utils/getDefaultStaffRoute";

export default function StaffIndexScreen() {
  const { user, isLoading } = useAuth();
  const { colors, typography } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    router.replace(getDefaultStaffRoute(user.role));
  }, [isLoading, user]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <PageHeader
        eyebrow="Staff Access"
        title="Loading Dashboard"
        subtitle="Redirecting you to the correct MediFlow workspace."
        icon="sync-outline"
      />

      <Text style={[typography.body, { color: colors.textMuted }]}>
        Please wait...
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
});