import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl, View } from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import AppButton from "../../src/components/AppButton";
import StaffNavBar from "../../src/components/StaffNavBar";
import {
  getSystemAlertsService,
  resolveSystemAlertService,
} from "../../src/services/systemAlertService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";

function getSeverityType(severity) {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    default:
      return "info";
  }
}

export default function StaffAlertsScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAlerts = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await getSystemAlertsService();
      setAlerts(data);
    } catch (error) {
      showToast({
        title: "Alert Load Failed",
        message: error.message || "Unable to load alerts.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleResolve = async (alertId) => {
    try {
      await resolveSystemAlertService(alertId);
      await loadAlerts(true);

      showToast({
        title: "Alert Resolved",
        message: "Alert resolved successfully.",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Resolve Failed",
        message: error.message || "Unable to resolve alert.",
        type: "error",
      });
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadAlerts(true)} />
        }
      >
        <BackNavButton label="Back to Staff Home" fallbackRoute="/staff" />

        <PageHeader
          eyebrow="Operational Alerts"
          title="Staff Alerts"
          subtitle="Review and resolve current operational alerts."
          icon="warning-outline"
        />

        <FormSection title="Open Alerts">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Loading alerts...
            </Text>
          ) : alerts.length ? (
            alerts.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                  shadow,
                ]}
              >
                <View style={styles.headerRow}>
                  <Text style={[typography.label, { color: colors.text }]}>
                    {item.alertType}
                  </Text>
                  <StatusBadge
                    label={item.severity}
                    type={getSeverityType(item.severity)}
                  />
                </View>

                <Text style={[typography.body, { color: colors.text }]}>
                  {item.message}
                </Text>
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Created: {new Date(item.createdAt).toLocaleString()}
                </Text>

                <AppButton
                  title="Resolve"
                  onPress={() => handleResolve(item.id)}
                  variant="secondary"
                />
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Open Alerts"
              message="No active alerts right now."
              icon="checkmark-done-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/alerts" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 110,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
    alignItems: "center",
  },
});