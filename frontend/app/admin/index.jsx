import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  RefreshControl,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import AppButton from "../../src/components/AppButton";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { getAdminDashboardSummaryService } from "../../src/services/adminDashboardService";

const AUTO_REFRESH_MS = 8000;

const QUICK_LINKS = [
  { label: "Emergency Review", route: "/staff/emergency-nurse", icon: "shield-checkmark-outline" },
  { label: "Triage Queue", route: "/staff/triage-nurse", icon: "pulse-outline" },
  { label: "Incident Queue", route: "/staff/incidents", icon: "list-outline" },
  { label: "Inventory", route: "/admin/resource-inventory", icon: "cube-outline" },
  { label: "Staff Users", route: "/admin/staff-users", icon: "people-outline" },
  { label: "System Alerts", route: "/admin/system-alerts", icon: "alert-circle-outline" },
  { label: "Demo Health", route: "/admin/demo-health", icon: "speedometer-outline" },
  { label: "System Checklist", route: "/admin/system-checklist", icon: "checkmark-done-outline" },
];

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [summary, setSummary] = useState({
    openIncidents: 0,
    acceptedIncidents: 0,
    patients: 0,
    untriagedPatients: 0,
    pendingResourceRequests: 0,
    openAlerts: 0,
    lowStockResources: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSummary = async (refresh = false, silent = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else if (!silent) setIsLoading(true);

      const data = await getAdminDashboardSummaryService();
      setSummary(data || {});
    } catch (error) {
      if (!silent) {
        showToast({
          title: "Dashboard Load Failed",
          message: error.message || "Unable to load admin dashboard.",
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadSummary(false, true);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadSummary(true)} />
      }
    >
      <PageHeader
        eyebrow="Administration"
        title="MediFlow Control Center"
        subtitle="Monitor incidents, triage flow, resources, and system alerts."
        icon="grid-outline"
      />

      <FormSection title="Appearance">
        <ThemeModeToggle />
      </FormSection>

      <FormSection title="Account Details">
        <Text style={[typography.body, { color: colors.text }]}>
          Name: {user?.name}
        </Text>
        <Text style={[typography.body, { color: colors.text }]}>
          Role: {user?.role}
        </Text>
        <Text style={[typography.body, { color: colors.text }]}>
          Email: {user?.email}
        </Text>

        <AppButton title="Logout" onPress={handleLogout} variant="secondary" />
      </FormSection>

      <FormSection title="Operational Summary">
        {isLoading ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Loading dashboard summary...
          </Text>
        ) : (
          <>
            <View style={styles.summaryWrap}>
              <SummaryCard label="Open Incidents" value={summary.openIncidents} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Accepted Incidents" value={summary.acceptedIncidents} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Patients" value={summary.patients} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Untriaged Patients" value={summary.untriagedPatients} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Pending Requests" value={summary.pendingResourceRequests} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Open Alerts" value={summary.openAlerts} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Low/Critical Stock" value={summary.lowStockResources} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
            </View>

            <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>
              Dashboard auto-refreshes every {AUTO_REFRESH_MS / 1000} seconds.
            </Text>
          </>
        )}
      </FormSection>

      <FormSection title="Quick Actions">
        <View style={styles.linkWrap}>
          {QUICK_LINKS.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route)}
              style={[
                styles.linkCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                },
                shadow,
              ]}
            >
              <Ionicons name={item.icon} size={24} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </FormSection>
    </ScrollView>
  );
}

function SummaryCard({ label, value, colors, typography, radius, spacing, shadow }) {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadow,
      ]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>
        {value ?? 0}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  summaryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryCard: { borderWidth: 1, minWidth: 150 },
  summaryValue: { fontSize: 24, fontWeight: "800", marginTop: 6 },
  linkWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  linkCard: {
    borderWidth: 1,
    minWidth: 160,
    alignItems: "center",
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});