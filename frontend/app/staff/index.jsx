import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  View,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import StatCard from "../../src/components/StatCard";
import AlertCard from "../../src/components/AlertCard";
import ResourceAlertCard from "../../src/components/ResourceAlertCard";
import StaffNavBar from "../../src/components/StaffNavBar";
import ProfileCard from "../../src/components/ProfileCard";
import PageHeader from "../../src/components/PageHeader";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { getDashboardOverviewService } from "../../src/services/dashboardService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";

const AUTO_REFRESH_INTERVAL = 15000;

function getStatNavigationParams(label) {
  if (label === "Critical Cases") {
    return {
      pathname: "/staff/incidents",
      params: { priority: "Critical" },
    };
  }
  if (label === "High Urgency Cases") {
    return {
      pathname: "/staff/incidents",
      params: { priority: "High" },
    };
  }
  if (label === "Reports Received Today") {
    return {
      pathname: "/staff/incidents",
      params: { status: "Received" },
    };
  }
  if (label === "Emergency Beds Available") {
    return {
      pathname: "/staff/resources",
      params: { section: "beds" },
    };
  }
  if (label === "Theatres Ready") {
    return {
      pathname: "/staff/resources",
      params: { section: "theatre" },
    };
  }
  return null;
}

export default function StaffHomeScreen() {
  const { user, logout } = useAuth();
  const { colors, spacing, typography } = useAppTheme();

  const [dashboardData, setDashboardData] = useState({
    stats: [],
    alerts: [],
    resourceAlerts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadDashboard = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading((prev) => (dashboardData.stats.length === 0 ? true : prev));
      }

      const data = await getDashboardOverviewService();
      setDashboardData(data);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to load dashboard:", error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const intervalId = setInterval(() => {
      loadDashboard();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background, paddingBottom: 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboard(true)}
          />
        }
      >
        <PageHeader
          eyebrow="Operations Dashboard"
          title="Staff Home"
          subtitle="Operational overview for emergency intake, triage, and readiness."
          icon="speedometer-outline"
        />

        <FormSection title="Appearance">
          <ThemeModeToggle />
          <Text
            style={[
              styles.helperText,
              typography.body,
              { color: colors.textMuted, marginTop: spacing.sm },
            ]}
            maxFontSizeMultiplier={1.8}
          >
            Choose light, dark, or follow the device setting.
          </Text>
        </FormSection>

        <FormSection title="Quick Navigation">
          <View style={styles.quickNavWrap}>
            {[
              { label: "Reports List", icon: "list-outline", route: "/staff/incidents" },
              { label: "Open Triage", icon: "pulse-outline", route: "/staff/triage" },
              { label: "Resources", icon: "layers-outline", route: "/staff/resources" },
              { label: "Settings", icon: "settings-outline", route: "/staff/settings" },
            ].map((item) => (
              <Pressable
                key={item.route}
                style={[
                  styles.quickNavButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={colors.primaryDark}
                  style={styles.quickNavIcon}
                />
                <Text
                  style={[
                    styles.quickNavText,
                    typography.label,
                    { color: colors.primaryDark },
                  ]}
                  maxFontSizeMultiplier={1.7}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormSection>

        <Text
          style={[styles.refreshHint, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.7}
        >
          Auto-refreshes every 15 seconds
        </Text>
        <Text
          style={[styles.lastRefreshed, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.7}
        >
          Last refreshed:{" "}
          {lastRefreshed
            ? lastRefreshed.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "Not yet loaded"}
        </Text>

        <FormSection title="Your Session">
          <ProfileCard
            user={{
              id: user?.id,
              name: user?.name,
              role: user?.role,
              email: user?.email,
              staffId: user?.staffId,
              identifier: user?.email || user?.staffId,
            }}
          />
          <AppButton title="Logout" onPress={handleLogout} variant="secondary" />
        </FormSection>

        <FormSection title="Today’s Overview">
          {isLoading ? (
            <Text
              style={[typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              Loading dashboard stats...
            </Text>
          ) : dashboardData.stats.length > 0 ? (
            dashboardData.stats.map((item) => {
              const navigationTarget = getStatNavigationParams(item.label);
              return (
                <StatCard
                  key={item.id}
                  item={item}
                  onPress={
                    navigationTarget
                      ? () => router.push(navigationTarget)
                      : undefined
                  }
                />
              );
            })
          ) : (
            <Text
              style={[typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              No dashboard stats available.
            </Text>
          )}
        </FormSection>

        <FormSection title="Priority Alerts">
          {isLoading ? (
            <Text
              style={[typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              Loading alerts...
            </Text>
          ) : dashboardData.alerts.length > 0 ? (
            dashboardData.alerts.map((item) => <AlertCard key={item.id} item={item} />)
          ) : (
            <Text
              style={[typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              No active alerts right now.
            </Text>
          )}
        </FormSection>

        <FormSection title="Resource Attention">
          {isLoading ? (
            <Text
              style={[typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              Loading resource alerts...
            </Text>
          ) : dashboardData.resourceAlerts.length > 0 ? (
            dashboardData.resourceAlerts.map((item) => (
              <ResourceAlertCard key={item.id} item={item} />
            ))
          ) : (
            <Text
              style={[typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              No resource constraints right now.
            </Text>
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  quickNavWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickNavButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    minHeight: 44,
  },
  quickNavIcon: {
    marginRight: 6,
  },
  quickNavText: {},
  helperText: {
    lineHeight: 22,
  },
  refreshHint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 4,
  },
  lastRefreshed: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
});