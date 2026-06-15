import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  RefreshControl,
} from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import AppButton from "../../src/components/AppButton";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import { getAuditLogsService } from "../../src/services/adminService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";

const ACTION_OPTIONS = [
  { label: "All Actions", value: "" },
  { label: "Incident Status Updated", value: "INCIDENT_STATUS_UPDATED" },
  { label: "Patient Added", value: "PATIENT_ADDED" },
  { label: "Patient Excluded", value: "PATIENT_EXCLUDED" },
  { label: "Patient Care Updated", value: "PATIENT_CARE_UPDATED" },
  { label: "Triage Created", value: "TRIAGE_CREATED" },
  { label: "AI Analysis Run", value: "AI_ANALYSIS_RUN" },
  { label: "Queue Reordered", value: "QUEUE_REORDERED" },
  { label: "Resource Request Created", value: "RESOURCE_REQUEST_CREATED" },
  { label: "Resource Request Updated", value: "RESOURCE_REQUEST_UPDATED" },
  { label: "Resource Allocated", value: "RESOURCE_ALLOCATED" },
  { label: "Resource Allocation Released", value: "RESOURCE_ALLOCATION_RELEASED" },
  { label: "Resource Item Created", value: "RESOURCE_ITEM_CREATED" },
  { label: "Resource Item Updated", value: "RESOURCE_ITEM_UPDATED" },
  { label: "System Alert Resolved", value: "SYSTEM_ALERT_RESOLVED" },
  { label: "Automation Checks Run", value: "AUTOMATION_CHECKS_RUN" },
];

function getActionTypeBadge(actionType) {
  if (actionType.includes("FAILED") || actionType.includes("REJECT")) return "danger";
  if (actionType.includes("CREATED") || actionType.includes("ALLOCATED")) return "success";
  if (actionType.includes("UPDATED") || actionType.includes("REORDERED")) return "warning";
  return "info";
}

export default function AuditLogScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    actionType: "",
    actor: "",
  });

  const loadLogs = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const data = await getAuditLogsService({
        actionType: filters.actionType || undefined,
      });

      setLogs(data || []);
    } catch (error) {
      showToast({
        title: "Audit Log Load Failed",
        message: error.message || "Unable to load audit logs.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const actorQuery = filters.actor.trim().toLowerCase();

    return logs.filter((log) => {
      if (!actorQuery) return true;

      return [
        log.actorUser?.name,
        log.actorUser?.email,
        log.actorRole,
        log.targetTable,
        log.targetId,
        log.reason,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(actorQuery));
    });
  }, [logs, filters.actor]);

  const summary = useMemo(() => {
    return {
      total: filteredLogs.length,
      incidentActions: filteredLogs.filter((item) => item.incidentId).length,
      patientActions: filteredLogs.filter((item) => item.patientId).length,
      inventoryActions: filteredLogs.filter((item) => item.resourceItemId).length,
    };
  }, [filteredLogs]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadLogs(true)} />}
    >
      <BackNavButton label="Back to Admin Dashboard" fallbackRoute="/admin" />

      <PageHeader
        eyebrow="System Administration"
        title="Audit Log"
        subtitle="Review tracked system, staff, patient, and inventory actions."
        icon="document-text-outline"
      />

      <FormSection title="Audit Overview">
        <View style={styles.summaryWrap}>
          <SummaryCard label="Visible Logs" value={summary.total} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
          <SummaryCard label="Incident Actions" value={summary.incidentActions} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
          <SummaryCard label="Patient Actions" value={summary.patientActions} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
          <SummaryCard label="Inventory Actions" value={summary.inventoryActions} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
        </View>
      </FormSection>

      <FormSection title="Filters">
        <FormSelect
          label="Action Type"
          selectedValue={filters.actionType}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, actionType: value }))}
          options={ACTION_OPTIONS}
          placeholder="Select action type"
        />

        <FormInput
          label="Search Actor / Reason / Target"
          value={filters.actor}
          onChangeText={(value) => setFilters((prev) => ({ ...prev, actor: value }))}
          placeholder="e.g. admin, triage, ResourceItem"
        />

        <AppButton title="Apply Action Filter" onPress={() => loadLogs(true)} variant="secondary" />
      </FormSection>

      <FormSection title="Audit Entries">
        {isLoading ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>Loading audit logs...</Text>
        ) : filteredLogs.length ? (
          filteredLogs.map((log) => (
            <View
              key={log.id}
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
                <Text style={[styles.cardTitle, { color: colors.text }]}>{log.actionType}</Text>
                <StatusBadge label={log.targetTable} type={getActionTypeBadge(log.actionType)} />
              </View>

              <Text style={[typography.body, { color: colors.text }]}>
                Actor: {log.actorUser?.name || "System"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Account Type: {log.actorRole || "SYSTEM"}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Target Table: {log.targetTable}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Target ID: {log.targetId}
              </Text>

              {log.incidentId ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Incident ID: {log.incidentId}
                </Text>
              ) : null}

              {log.patientId ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Patient ID: {log.patientId}
                </Text>
              ) : null}

              {log.resourceRequestId ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Resource Request ID: {log.resourceRequestId}
                </Text>
              ) : null}

              {log.resourceItemId ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Resource Item ID: {log.resourceItemId}
                </Text>
              ) : null}

              {log.reason ? (
                <Text style={[typography.body, { color: colors.text }]}>
                  Reason: {log.reason}
                </Text>
              ) : null}

              {log.oldValue ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Old Value: {JSON.stringify(log.oldValue)}
                </Text>
              ) : null}

              {log.newValue ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  New Value: {JSON.stringify(log.newValue)}
                </Text>
              ) : null}

              <Text style={[typography.body, { color: colors.textMuted }]}>
                Created: {new Date(log.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <EmptyStateCard
            title="No Audit Logs"
            message="No audit logs match the current filters."
            icon="document-text-outline"
          />
        )}
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
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});