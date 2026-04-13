import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl } from "react-native";
import { router } from "expo-router";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import StatCard from "../../src/components/StatCard";
import AlertCard from "../../src/components/AlertCard";
import ResourceAlertCard from "../../src/components/ResourceAlertCard";
import StaffNavBar from "../../src/components/StaffNavBar";
import ProfileCard from "../../src/components/ProfileCard";
import PageHeader from "../../src/components/PageHeader";
import { getDashboardOverviewService } from "../../src/services/dashboardService";
import { COLORS } from "../../src/constants/theme";

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
  const currentUser = {
    id: "staff-001",
    name: "Triage Nurse",
    role: "Staff",
    identifier: "staff001@mediflow.ug",
  };

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

        <Text style={styles.refreshHint}>
          Auto-refreshes every 15 seconds
        </Text>
        <Text style={styles.lastRefreshed}>
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

        <FormSection title="Resource Attention">
          {isLoading ? (
            <Text style={styles.loadingText}>Loading resource alerts...</Text>
          ) : dashboardData.resourceAlerts.length > 0 ? (
            dashboardData.resourceAlerts.map((item) => (
              <ResourceAlertCard key={item.id} item={item} />
            ))
          ) : (
            <Text style={styles.emptyText}>No resource constraints right now.</Text>
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
    marginTop: -10,
    marginBottom: 4,
  },
  lastRefreshed: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
});