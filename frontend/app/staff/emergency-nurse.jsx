import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Image,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import {
  getIncomingIncidentsService,
  reviewIncidentService,
} from "../../src/services/emergencyNurseService";
import { resolveMediaUrl } from "../../src/utils/mediaUrl";
import StaffAccountSection from "../../src/components/StaffAccountSection";
import RoleGuard from "../../src/components/RoleGuard";
import AdminReturnButton from "../../src/components/AdminReturnButton";

function getStatusType(status) {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "REJECTED":
      return "danger";
    case "UNDER_REVIEW":
      return "warning";
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
    default:
      return "neutral";
  }
}

export default function EmergencyNurseScreen() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  const loadData = async (refresh = false) => {
    if (isAuthLoading) return;

    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const data = await getIncomingIncidentsService();
      setIncidents(data || []);
    } catch (error) {
      showToast({
        title: "Load Failed",
        message: error.message || "Unable to load incoming incidents.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    loadData();
  }, [isAuthLoading]);

  const summary = useMemo(
    () => ({
      total: incidents.length,
      received: incidents.filter((item) => item.status === "RECEIVED").length,
      underReview: incidents.filter((item) => item.status === "UNDER_REVIEW").length,
      withPhoto: incidents.filter((item) => item.mediaAttachments?.length).length,
    }),
    [incidents]
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const handleReview = async (incident, status) => {
    try {
      setIsUpdatingId(incident.id);

      const fallbackNote =
        status === "ACCEPTED"
          ? "Emergency report accepted. Patients are being prepared for triage."
          : status === "REJECTED"
          ? "Emergency report rejected after review."
          : "Emergency report is under review.";

      const data = await reviewIncidentService(incident.id, {
        status,
        publicStatusNote: reviewNotes[incident.id]?.trim() || fallbackNote,
      });

      const createdCount = data?.createdPatients?.length || 0;

      showToast({
        title:
          status === "ACCEPTED"
            ? "Incident Accepted"
            : status === "REJECTED"
            ? "Incident Rejected"
            : "Incident Updated",
        message:
          status === "ACCEPTED"
            ? `${createdCount} patient placeholder(s) prepared for triage.`
            : "Incident review status updated.",
        type: "success",
      });

      setReviewNotes((prev) => ({
        ...prev,
        [incident.id]: "",
      }));

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Review Failed",
        message: error.message || "Unable to review incident.",
        type: "error",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={["EMERGENCY_NURSE"]}>
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
      >
        <PageHeader
          eyebrow="Emergency Nurse"
          title="Incident Review Workspace"
          subtitle="Review incoming public emergency reports before they enter triage."
          icon="shield-checkmark-outline"
        />

        <AdminReturnButton />

        <FormSection title="Appearance">
          <ThemeModeToggle />
        </FormSection>

        <StaffAccountSection />

        <FormSection title="Incoming Overview">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Loading incoming incidents...
            </Text>
          ) : (
            <View style={styles.summaryWrap}>
              <SummaryCard label="Incoming" value={summary.total} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Received" value={summary.received} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="Under Review" value={summary.underReview} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              <SummaryCard label="With Photo" value={summary.withPhoto} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
            </View>
          )}
        </FormSection>

        <FormSection title="Incoming Incidents">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Loading incidents...
            </Text>
          ) : incidents.length ? (
            incidents.map((incident) => (
              <View
                key={incident.id}
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
                  <StatusBadge label={incident.status} type={getStatusType(incident.status)} />
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
                      label={`Queue ${incident.queuePriority.finalPriorityLevel}`}
                      type={getPriorityType(incident.queuePriority.finalPriorityLevel)}
                    />
                  ) : null}
                </View>

                {incident.mediaAttachments?.[0]?.fileUrl ? (
                  <Image
                    source={{
                      uri: resolveMediaUrl(incident.mediaAttachments[0].filePath),
                    }}
                    style={styles.incidentImage}
                  />
                ) : (
                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    No incident photo available.
                  </Text>
                )}

                <Text style={[typography.body, { color: colors.text }]}>
                  Type: {incident.incidentType}
                </Text>

                {incident.subIncidentType ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Subtype: {incident.subIncidentType}
                  </Text>
                ) : null}

                <Text style={[typography.body, { color: colors.text }]}>
                  Estimated Patients: {incident.estimatedVictimCount}
                </Text>

                <Text style={[typography.body, { color: colors.text }]}>
                  Coordinates: {incident.latitude ?? "N/A"}, {incident.longitude ?? "N/A"}
                </Text>

                <Text style={[typography.body, { color: colors.text }]}>
                  Reporter Phone: {incident.phoneNumber || "Not provided"}
                </Text>

                {incident.notes ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Notes: {incident.notes}
                  </Text>
                ) : null}

                <FormInput
                  label="Public Status Note"
                  value={reviewNotes[incident.id] || ""}
                  onChangeText={(value) =>
                    setReviewNotes((prev) => ({
                      ...prev,
                      [incident.id]: value,
                    }))
                  }
                  placeholder="Message reporter will see on tracking page"
                  multiline
                />

                <View style={styles.actionRow}>
                  {incident.status === "RECEIVED" ? (
                    <AppButton
                      title={isUpdatingId === incident.id ? "Updating..." : "Mark Under Review"}
                      onPress={() => handleReview(incident, "UNDER_REVIEW")}
                      disabled={isUpdatingId === incident.id}
                      variant="secondary"
                    />
                  ) : null}

                  <AppButton
                    title={isUpdatingId === incident.id ? "Accepting..." : "Accept & Create Patients"}
                    onPress={() => handleReview(incident, "ACCEPTED")}
                    disabled={isUpdatingId === incident.id}
                  />

                  <AppButton
                    title={isUpdatingId === incident.id ? "Rejecting..." : "Reject"}
                    onPress={() => handleReview(incident, "REJECTED")}
                    disabled={isUpdatingId === incident.id}
                    variant="secondary"
                  />
                </View>
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Incoming Incidents"
              message="There are no new public emergency reports awaiting review."
              icon="shield-checkmark-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/emergency-nurse" />
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
  incidentImage: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionRow: {
    gap: 10,
  },
});