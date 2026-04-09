import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardOverviewService();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
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
});