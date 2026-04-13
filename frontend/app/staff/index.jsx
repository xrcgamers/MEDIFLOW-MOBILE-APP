import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl } from "react-native";
import { router } from "expo-router";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import StatCard from "../../src/components/StatCard";
import AlertCard from "../../src/components/AlertCard";
import StaffNavBar from "../../src/components/StaffNavBar";
import ProfileCard from "../../src/components/ProfileCard";
import PageHeader from "../../src/components/PageHeader";
import { getDashboardOverviewService } from "../../src/services/dashboardService";
import { COLORS } from "../../src/constants/theme";

const AUTO_REFRESH_INTERVAL = 15000;

export default function StaffHomeScreen() {
  const currentUser = {
    id: "staff-001",
    name: "Triage Nurse",
    role: "Staff",
    identifier: "staff001@mediflow.ug",
  };

  const [dashboardData, setDashboardData] = useState({
    stats: [],
    alerts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading((prev) => (dashboardData.stats.length === 0 ? true : prev));
      }

      const data = await getDashboardOverviewService();
      setDashboardData(data);
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

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
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

        <FormSection title="Your Session">
          <ProfileCard user={currentUser} />
          <AppButton
            title="Logout"
            onPress={() => router.replace("/auth/login")}
            variant="secondary"
          />
        </FormSection>

        <FormSection title="Today’s Overview">
          {isLoading ? (
            <Text style={styles.loadingText}>Loading dashboard stats...</Text>
          ) : dashboardData.stats.length > 0 ? (
            dashboardData.stats.map((item) => (
              <StatCard key={item.id} item={item} />
            ))
          ) : (
            <Text style={styles.emptyText}>No dashboard stats available.</Text>
          )}
        </FormSection>

        <FormSection title="Priority Alerts">
          {isLoading ? (
            <Text style={styles.loadingText}>Loading alerts...</Text>
          ) : dashboardData.alerts.length > 0 ? (
            dashboardData.alerts.map((item) => (
              <AlertCard key={item.id} item={item} />
            ))
          ) : (
            <Text style={styles.emptyText}>No active alerts right now.</Text>
          )}
        </FormSection>

        <FormSection title="Operations">
          <AppButton
            title="View Incoming Reports"
            onPress={() => router.push("/staff/incidents")}
          />
          <AppButton
            title="Open Triage"
            onPress={() => router.push("/staff/triage")}
            variant="secondary"
          />
          <AppButton
            title="View Resources"
            onPress={() => router.push("/staff/resources")}
            variant="secondary"
          />
        </FormSection>

        <Text style={styles.refreshHint}>Auto-refreshes every 15 seconds</Text>
      </ScrollView>

      <StaffNavBar activeRoute="/staff" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 120,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  refreshHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
});