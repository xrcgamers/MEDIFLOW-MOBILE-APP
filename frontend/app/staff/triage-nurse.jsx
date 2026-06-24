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
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { getTriageQueueService } from "../../src/services/triageNurseService";
import StaffAccountSection from "../../src/components/StaffAccountSection";
import RoleGuard from "../../src/components/RoleGuard";
import AdminReturnButton from "../../src/components/AdminReturnButton";

const AUTO_REFRESH_MS = 15000;

function getPriorityType(level) {
  switch (level) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MODERATE":
      return "info";
    default:
      return "neutral";
  }
}

export default function TriageNurseScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (refresh = false, silent = false) => {
    if (isAuthLoading) return;

    try {
      if (refresh) setIsRefreshing(true);
      else if (!silent) setIsLoading(true);

      const data = await getTriageQueueService();
      setPatients(data || []);
    } catch (error) {
      if (!silent) {
        showToast({
          title: "Load Failed",
          message: error.message || "Unable to load triage queue.",
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) loadData();
  }, [isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading) return;

    const timer = setInterval(() => {
      loadData(false, true);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, [isAuthLoading]);

  const summary = useMemo(
    () => ({
      total: patients.length,
      untriaged: patients.filter((item) => item.status === "UNTRIAGED").length,
      triaged: patients.filter((item) => item.status === "TRIAGED").length,
      critical: patients.filter(
        (item) => item.triages?.[0]?.urgencyLevel === "CRITICAL"
      ).length,
      assignedToMe: patients.filter(
        (item) => item.assignedTriageNurseId === user?.id
      ).length,
      unassigned: patients.filter((item) => !item.assignedTriageNurseId).length,
    }),
    [patients, user]
  );

  return (
    <RoleGuard allowedRoles={["TRIAGE_NURSE"]}>
      <>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
            />
          }
        >
          <PageHeader
            eyebrow="Triage Nurse"
            title="Patient Triage Queue"
            subtitle="Claim patients, perform triage, and request needed resources."
            icon="pulse-outline"
          />

          <AdminReturnButton />
          <StaffAccountSection />

          <FormSection title="Appearance">
            <ThemeModeToggle />
          </FormSection>

          <FormSection title="Queue Overview">
            <View style={styles.summaryWrap}>
              <SummaryCard
                label="Patients"
                value={summary.total}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Unassigned"
                value={summary.unassigned}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Assigned To Me"
                value={summary.assignedToMe}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Untriaged"
                value={summary.untriaged}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Triaged"
                value={summary.triaged}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Critical"
                value={summary.critical}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
            </View>

            <Text
              style={[
                typography.body,
                { color: colors.textMuted, marginTop: 8 },
              ]}
            >
              Queue auto-refreshes every {AUTO_REFRESH_MS / 1000} seconds.
            </Text>
          </FormSection>

          <FormSection title="Patients">
            {isLoading ? (
              <Text style={[typography.body, { color: colors.textMuted }]}>
                Loading patients...
              </Text>
            ) : patients.length ? (
              patients.map((patient) => {
                const latestTriage = patient.triages?.[0] || null;
                const isAssignedToMe = patient.assignedTriageNurseId === user?.id;
                const isUnassigned = !patient.assignedTriageNurseId;

                return (
                  <Pressable
                    key={patient.id}
                    onPress={() =>
                      router.push({
                        pathname: "/staff/patient-details",
                        params: { patientId: patient.id },
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
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                          {patient.fullName || patient.patientCode}
                        </Text>

                        {patient.fullName ? (
                          <Text
                            style={[
                              typography.body,
                              { color: colors.textMuted },
                            ]}
                          >
                            Code: {patient.patientCode}
                          </Text>
                        ) : null}
                      </View>

                      {latestTriage ? (
                        <StatusBadge
                          label={latestTriage.urgencyLevel}
                          type={getPriorityType(latestTriage.urgencyLevel)}
                        />
                      ) : (
                        <StatusBadge label="UNTRIAGED" type="warning" />
                      )}
                    </View>

                    <View style={styles.badgeRow}>
                      {isAssignedToMe ? (
                        <StatusBadge label="ASSIGNED TO YOU" type="success" />
                      ) : isUnassigned ? (
                        <StatusBadge label="UNASSIGNED" type="warning" />
                      ) : (
                        <StatusBadge
                          label={`Assigned: ${
                            patient.assignedTriageNurse?.name || "Another Nurse"
                          }`}
                          type="danger"
                        />
                      )}
                    </View>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Incident: {patient.incident?.trackingCode}
                    </Text>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Context: {patient.incident?.incidentType}
                      {patient.incident?.subIncidentType
                        ? ` / ${patient.incident.subIncidentType}`
                        : ""}
                    </Text>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Estimated Patients in Incident:{" "}
                      {patient.incident?.estimatedVictimCount}
                    </Text>

                    {latestTriage ? (
                      <Text style={[typography.body, { color: colors.textMuted }]}>
                        Latest Score: {latestTriage.triageScore}
                      </Text>
                    ) : isUnassigned ? (
                      <Text style={[typography.body, { color: colors.textMuted }]}>
                        Tap to claim this patient before editing.
                      </Text>
                    ) : isAssignedToMe ? (
                      <Text style={[typography.body, { color: colors.textMuted }]}>
                        Tap to continue triage or request resources.
                      </Text>
                    ) : (
                      <Text style={[typography.body, { color: colors.textMuted }]}>
                        View only. This patient is assigned to another nurse.
                      </Text>
                    )}
                  </Pressable>
                );
              })
            ) : (
              <EmptyStateCard
                title="No Patients Awaiting Triage"
                message="Accepted incidents will create patient placeholders here."
                icon="pulse-outline"
              />
            )}
          </FormSection>
        </ScrollView>

        <StaffNavBar activeRoute="/staff/triage-nurse" />
      </>
    </RoleGuard>
  );
}

function SummaryCard({
  label,
  value,
  colors,
  typography,
  radius,
  spacing,
  shadow,
}) {
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
        {value}
      </Text>
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
    gap: 8,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});