import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  RefreshControl,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import AppButton from "../../src/components/AppButton";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { getIncidentsService } from "../../src/services/staffIncidentService";
import RoleGuard from "../../src/components/RoleGuard";
import AdminReturnButton from "../../src/components/AdminReturnButton";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Received", value: "RECEIVED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Response In Progress", value: "RESPONSE_IN_PROGRESS" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Closed", value: "CLOSED" },
];

function getStatusType(status) {
  switch (status) {
    case "ACCEPTED":
    case "CLOSED":
      return "success";
    case "UNDER_REVIEW":
    case "RESPONSE_IN_PROGRESS":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    case "RECEIVED":
    default:
      return "info";
  }
}

function getPriorityType(level) {
  switch (level) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MODERATE":
      return "info";
    case "LOW":
    default:
      return "neutral";
  }
}

function getIncidentContextLabel(incident) {
  if (!incident) return "No incident context";
  if (incident.subIncidentType) {
    return `${incident.incidentType || "Incident"} • ${incident.subIncidentType}`;
  }
  return incident.incidentType || "Incident context available";
}

function summarizeIncidentRequests(incident) {
  const patients = incident?.patients || [];
  const requests = patients.flatMap((patient) => patient.resourceRequests || []);

  return {
    total: requests.length,
    partial: requests.filter((item) => item.requestStatus === "PARTIALLY_ALLOCATED").length,
    reserved: requests.filter((item) => item.requestStatus === "RESERVED").length,
    completed: requests.filter((item) => item.requestStatus === "COMPLETED").length,
  };
}

export default function IncidentsScreen() {
  const { user, logout } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadIncidents = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const data = await getIncidentsService({
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      setIncidents(data || []);
    } catch (error) {
      showToast({
        title: "Load Failed",
        message: error.message || "Unable to load incidents.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [statusFilter]);

  const filteredIncidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return incidents;

    return incidents.filter((incident) => {
      const context = getIncidentContextLabel(incident).toLowerCase();
      const location = (
        incident.resolvedLocationText ||
        incident.manualLocationText ||
        incident.autoLocationText ||
        ""
      ).toLowerCase();

      return [
        incident.trackingCode,
        context,
        location,
        incident.phoneNumber,
        incident.status,
        incident.aiAssessment?.priorityLevel,
        incident.queuePriority?.finalPriorityLevel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [incidents, search]);

  const summary = useMemo(() => {
    return {
      total: filteredIncidents.length,
      criticalAi: filteredIncidents.filter(
        (item) => item.aiAssessment?.priorityLevel === "CRITICAL"
      ).length,
      partialPressure: filteredIncidents.filter((item) => {
        const requestSummary = summarizeIncidentRequests(item);
        return requestSummary.partial > 0;
      }).length,
      reservedPressure: filteredIncidents.filter((item) => {
        const requestSummary = summarizeIncidentRequests(item);
        return requestSummary.reserved > 0;
      }).length,
    };
  }, [filteredIncidents]);

  const sortedIncidents = useMemo(() => {
    return [...filteredIncidents].sort((a, b) => {
      const aRank = a.queuePriority?.manualOverrideRank ?? Number.MAX_SAFE_INTEGER;
      const bRank = b.queuePriority?.manualOverrideRank ?? Number.MAX_SAFE_INTEGER;

      if (aRank !== bRank) return aRank - bRank;

      const aScore = a.queuePriority?.finalPriorityScore ?? -1;
      const bScore = b.queuePriority?.finalPriorityScore ?? -1;

      if (aScore !== bScore) return bScore - aScore;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredIncidents]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <RoleGuard allowedRoles={["EMERGENCY_NURSE"]}>
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadIncidents(true)} />
        }
      >
        <PageHeader
          eyebrow="Clinical Operations"
          title="Incident Queue"
          subtitle="Review incidents by context, AI priority, and operational pressure."
          icon="list-outline"
        />

        <AdminReturnButton />

        <FormSection title="Appearance">
          <ThemeModeToggle />
        </FormSection>

        <FormSection title="Account Details">
          <Text style={[typography.body, { color: colors.text }]}>Name: {user?.name}</Text>
          <Text style={[typography.body, { color: colors.text }]}>Account Type: {user?.role}</Text>
          <Text style={[typography.body, { color: colors.text }]}>Email: {user?.email}</Text>
          <AppButton title="Logout" onPress={handleLogout} variant="secondary" />
        </FormSection>

        <FormSection title="Queue Overview">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>Loading incidents...</Text>
          ) : (
            <View style={styles.summaryWrap}>
              <SummaryCard label="Visible Incidents" value={summary.total} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Critical AI" value={summary.criticalAi} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Partial Pressure" value={summary.partialPressure} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Reserved Pressure" value={summary.reservedPressure} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
            </View>
          )}
        </FormSection>

        <FormSection title="Filters">
          <FormInput
            label="Search Queue"
            value={search}
            onChangeText={setSearch}
            placeholder="Search by code, type, subtype, location, priority..."
          />

          <FormSelect
            label="Status Filter"
            selectedValue={statusFilter}
            onValueChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
        </FormSection>

        <FormSection title="Incidents">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>Loading incidents...</Text>
          ) : sortedIncidents.length ? (
            sortedIncidents.map((incident) => {
              const patientCount = (incident.patients || []).length;
              const requestSummary = summarizeIncidentRequests(incident);

              return (
                <Pressable
                  key={incident.id}
                  onPress={() =>
                    router.push({
                      pathname: "/staff/incident-details",
                      params: { id: incident.id },
                    })
                  }
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
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {incident.trackingCode}
                    </Text>
                    <StatusBadge
                      label={incident.status}
                      type={getStatusType(incident.status)}
                    />
                  </View>

                  <View style={styles.badgeRow}>
                    {incident.aiAssessment?.priorityLevel ? (
                      <StatusBadge
                        label={`AI ${incident.aiAssessment.priorityLevel}`}
                        type={getPriorityType(incident.aiAssessment.priorityLevel)}
                      />
                    ) : null}

                    {incident.queuePriority?.finalPriorityLevel ? (
                      <StatusBadge
                        label={`QUEUE ${incident.queuePriority.finalPriorityLevel}`}
                        type={getPriorityType(incident.queuePriority.finalPriorityLevel)}
                      />
                    ) : null}

                    {incident.subIncidentType ? (
                      <StatusBadge label="Subtype Context" type="info" />
                    ) : null}
                  </View>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Context: {getIncidentContextLabel(incident)}
                  </Text>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Location:{" "}
                    {incident.resolvedLocationText ||
                      incident.manualLocationText ||
                      incident.autoLocationText ||
                      "Unknown"}
                  </Text>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Estimated Patients: {incident.estimatedVictimCount ?? 0}
                  </Text>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Linked Patients: {patientCount}
                  </Text>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Queue Score: {incident.queuePriority?.finalPriorityScore ?? "Not set"}
                  </Text>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Manual Rank: {incident.queuePriority?.manualOverrideRank ?? "None"}
                  </Text>

                  <View style={{ marginTop: 8 }}>
                    <Text style={[typography.body, { color: colors.textMuted }]}>
                      Resource Pressure:
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      Total Requests: {requestSummary.total}
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      Partial Allocations: {requestSummary.partial}
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      Reserved: {requestSummary.reserved}
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      Completed: {requestSummary.completed}
                    </Text>
                  </View>

                  <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>
                    Created: {new Date(incident.createdAt).toLocaleString()}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <EmptyStateCard
              title="No Incidents Found"
              message="No incidents match the current search or filter."
              icon="list-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/incidents" />
    </>
    </RoleGuard>
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
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 110,
    flexGrow: 1,
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    borderWidth: 1,
    minWidth: 150,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});