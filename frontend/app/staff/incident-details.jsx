import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  RefreshControl,
  Pressable,
  Image,
  Linking,
} from "react-native";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import AppButton from "../../src/components/AppButton";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import RoleGuard from "../../src/components/RoleGuard";
import AdminReturnButton from "../../src/components/AdminReturnButton";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { resolveMediaUrl } from "../../src/utils/mediaUrl";
import {
  getIncidentByIdService,
  analyzeIncidentPriorityService,
  updateIncidentStatusService,
  addPatientToIncidentService,
  reorderIncidentQueueService,
} from "../../src/services/staffIncidentService";

const STATUS_OPTIONS = [
  { label: "Received", value: "RECEIVED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Response In Progress", value: "RESPONSE_IN_PROGRESS" },
  { label: "Closed", value: "CLOSED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const QUEUE_OVERRIDE_OPTIONS = [
  { label: "Normal", value: "NORMAL" },
  { label: "High Priority", value: "HIGH" },
  { label: "Critical Priority", value: "CRITICAL" },
  { label: "Hold / Deprioritize", value: "HOLD" },
];

function queueLevelToRank(level) {
  switch (level) {
    case "CRITICAL":
      return 1;
    case "HIGH":
      return 3;
    case "HOLD":
      return 10;
    case "NORMAL":
    default:
      return 5;
  }
}

function getStatusType(status) {
  switch (status) {
    case "ACCEPTED":
    case "CLOSED":
      return "success";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    case "UNDER_REVIEW":
    case "RESPONSE_IN_PROGRESS":
      return "warning";
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

function getRequestType(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "APPROVED":
    case "PARTIALLY_ALLOCATED":
    case "RESERVED":
    case "IN_PROGRESS":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "info";
  }
}

function getIncidentContextLabel(incident) {
  if (!incident) return "No incident context";
  if (incident.subIncidentType) {
    return `${incident.incidentType || "Incident"} • ${incident.subIncidentType}`;
  }
  return incident.incidentType || "Incident context available";
}

function summarizeRequests(incident) {
  const patients = incident?.patients || [];
  const requests = patients.flatMap((patient) => patient.resourceRequests || []);

  return {
    total: requests.length,
    partial: requests.filter((item) => item.requestStatus === "PARTIALLY_ALLOCATED").length,
    reserved: requests.filter((item) => item.requestStatus === "RESERVED").length,
    completed: requests.filter((item) => item.requestStatus === "COMPLETED").length,
  };
}

export default function IncidentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: "",
    note: "",
    rejectionReason: "",
  });

  const [queueForm, setQueueForm] = useState({
    overrideLevel: "NORMAL",
    overrideReason: "",
    expectedAction: "",
  });

  const [patientNote, setPatientNote] = useState("");

  const loadIncident = async (refresh = false) => {
    if (!id) return;

    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const data = await getIncidentByIdService(id);
      setIncident(data);

      setStatusForm((prev) => ({
        ...prev,
        status: data?.status || "",
      }));

      setQueueForm((prev) => ({
        ...prev,
        overrideReason: data?.queuePriority?.manualOverrideReason || "",
      }));
    } catch (error) {
      showToast({
        title: "Load Failed",
        message: error.message || "Unable to load incident details.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const requestSummary = useMemo(() => summarizeRequests(incident), [incident]);

  const handleOpenGoogleMaps = async () => {
    if (!incident?.latitude || !incident?.longitude) {
      showToast({
        title: "Location Unavailable",
        message: "This incident does not have usable coordinates.",
        type: "warning",
      });
      return;
    }

    const url = `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`;

    try {
      await Linking.openURL(url);
    } catch {
      showToast({
        title: "Map Failed",
        message: "Unable to open Google Maps.",
        type: "error",
      });
    }
  };

  const handleAnalyzeIncident = async () => {
    try {
      setIsAnalyzing(true);

      await analyzeIncidentPriorityService(id);

      showToast({
        title: "Incident Assessment Complete",
        message: "Incident response assessment was refreshed.",
        type: "success",
      });

      await loadIncident(true);
    } catch (error) {
      showToast({
        title: "Incident Assessment Failed",
        message: error.message || "Unable to assess incident.",
        type: "error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQueueOverride = async () => {
    if (!queueForm.overrideReason.trim()) {
      showToast({
        title: "Reason Required",
        message: "Enter a reason for the queue override.",
        type: "warning",
      });
      return;
    }

    try {
      setIsReordering(true);

      const reason = [
        `Override Level: ${queueForm.overrideLevel}`,
        `Reason: ${queueForm.overrideReason.trim()}`,
        queueForm.expectedAction.trim()
          ? `Expected Action: ${queueForm.expectedAction.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      await reorderIncidentQueueService(id, {
        manualOverrideRank: queueLevelToRank(queueForm.overrideLevel),
        manualOverrideReason: reason,
      });

      showToast({
        title: "Queue Updated",
        message: "Incident queue override was applied.",
        type: "success",
      });

      await loadIncident(true);
    } catch (error) {
      showToast({
        title: "Queue Override Failed",
        message: error.message || "Unable to update queue priority.",
        type: "error",
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusForm.status) {
      showToast({
        title: "Status Required",
        message: "Select an incident status.",
        type: "warning",
      });
      return;
    }

    try {
      setIsUpdatingStatus(true);

      await updateIncidentStatusService(id, {
        status: statusForm.status,
        note: statusForm.note.trim(),
        rejectionReason:
          statusForm.status === "REJECTED" || statusForm.status === "CANCELLED"
            ? statusForm.rejectionReason.trim() || statusForm.note.trim()
            : null,
      });

      showToast({
        title: "Status Updated",
        message: "Incident status was updated successfully.",
        type: "success",
      });

      setStatusForm((prev) => ({
        ...prev,
        note: "",
        rejectionReason: "",
      }));

      await loadIncident(true);
    } catch (error) {
      showToast({
        title: "Status Update Failed",
        message: error.message || "Unable to update incident status.",
        type: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddPatient = async () => {
    try {
      setIsAddingPatient(true);

      await addPatientToIncidentService(id, {
        note: patientNote.trim(),
      });

      showToast({
        title: "Patient Added",
        message: "A patient record was added to this incident.",
        type: "success",
      });

      setPatientNote("");
      await loadIncident(true);
    } catch (error) {
      showToast({
        title: "Add Patient Failed",
        message: error.message || "Unable to add patient.",
        type: "error",
      });
    } finally {
      setIsAddingPatient(false);
    }
  };

  if (isLoading && !incident) {
    return (
      <>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
        >
          <BackNavButton label="Back to Incidents" fallbackRoute="/staff/incidents" />
          <PageHeader
            eyebrow="Incident Coordination"
            title="Incident Details"
            subtitle="Loading incident..."
            icon="document-text-outline"
          />
        </ScrollView>
        <StaffNavBar activeRoute="/staff/incidents" />
      </>
    );
  }

  if (!incident) {
    return (
      <>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
        >
          <BackNavButton label="Back to Incidents" fallbackRoute="/staff/incidents" />
          <EmptyStateCard
            title="Incident Not Found"
            message="Unable to load this incident."
            icon="document-text-outline"
            actionLabel="Retry"
            onAction={() => loadIncident(true)}
          />
        </ScrollView>
        <StaffNavBar activeRoute="/staff/incidents" />
      </>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "EMERGENCY_NURSE"]}>
      <>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadIncident(true)}
            />
          }
        >
          <BackNavButton label="Back to Incidents" fallbackRoute="/staff/incidents" />

          <PageHeader
            eyebrow="Incident Coordination"
            title={incident.trackingCode}
            subtitle={getIncidentContextLabel(incident)}
            icon="document-text-outline"
          />

          <AdminReturnButton />

          <FormSection title="Incident Summary">
            <View
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
              <View style={styles.badgeRow}>
                <StatusBadge
                  label={incident.status}
                  type={getStatusType(incident.status)}
                />
              </View>

              <Text style={[typography.body, { color: colors.text }]}>
                Incident Type: {incident.incidentType}
              </Text>

              {incident.subIncidentType ? (
                <Text style={[typography.body, { color: colors.text }]}>
                  Incident Subtype: {incident.subIncidentType}
                </Text>
              ) : null}

              <Text style={[typography.body, { color: colors.text }]}>
                Location:{" "}
                {incident.resolvedLocationText ||
                  incident.manualLocationText ||
                  incident.autoLocationText ||
                  "Coordinates submitted"}
              </Text>

              <Text style={[typography.body, { color: colors.text }]}>
                Coordinates: {incident.latitude ?? "N/A"},{" "}
                {incident.longitude ?? "N/A"}
              </Text>

              <Text style={[typography.body, { color: colors.text }]}>
                Estimated Patients: {incident.estimatedVictimCount}
              </Text>

              <Text style={[typography.body, { color: colors.text }]}>
                Reporter Phone: {incident.phoneNumber}
              </Text>

              {incident.notes ? (
                <Text style={[typography.body, { color: colors.text }]}>
                  Notes: {incident.notes}
                </Text>
              ) : null}

              <AppButton
                title="Open Location in Google Maps"
                onPress={handleOpenGoogleMaps}
                variant="secondary"
              />

              {incident.mediaAttachments?.length ? (
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
            </View>
          </FormSection>

          <FormSection title="Resource Fulfillment Overview">
            <View style={styles.summaryWrap}>
              <SummaryCard
                label="Requests"
                value={requestSummary.total}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Partial"
                value={requestSummary.partial}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Reserved"
                value={requestSummary.reserved}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
              <SummaryCard
                label="Completed"
                value={requestSummary.completed}
                colors={colors}
                typography={typography}
                radius={radius}
                spacing={spacing}
                shadow={shadow}
              />
            </View>
          </FormSection>

          <FormSection title="Incident Response Assessment">
            {incident.aiAssessment ? (
              <View
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
                <View style={styles.badgeRow}>
                  <StatusBadge
                    label={incident.aiAssessment.priorityLevel}
                    type={getPriorityType(incident.aiAssessment.priorityLevel)}
                  />
                </View>

                <Text style={[typography.body, { color: colors.text }]}>
                  Confidence: {incident.aiAssessment.confidence}%
                </Text>

                <Text style={[typography.body, { color: colors.text }]}>
                  Recommended Action:{" "}
                  {incident.aiAssessment.recommendedNextAction}
                </Text>

                <Text style={[typography.body, { color: colors.text }]}>
                  Basis: {incident.aiAssessment.analysisBasis}
                </Text>

                {incident.aiAssessment.keyRiskFactors?.length ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Key Risk Factors:{" "}
                    {incident.aiAssessment.keyRiskFactors.join("; ")}
                  </Text>
                ) : null}
              </View>
            ) : (
              <EmptyStateCard
                title="No Incident Assessment"
                message="Run assessment to refresh incident response priority."
                icon="sparkles-outline"
              />
            )}

            <AppButton
              title={isAnalyzing ? "Assessing..." : "Run Incident Assessment"}
              onPress={handleAnalyzeIncident}
              loading={isAnalyzing}
              disabled={isAnalyzing}
            />
          </FormSection>

          <FormSection title="Queue Override">
            <Text style={[typography.body, { color: colors.text }]}>
              Final Priority Level:{" "}
              {incident.queuePriority?.finalPriorityLevel || "Not set"}
            </Text>

            <Text style={[typography.body, { color: colors.text }]}>
              Final Priority Score:{" "}
              {incident.queuePriority?.finalPriorityScore ?? "Not set"}
            </Text>

            <Text style={[typography.body, { color: colors.text }]}>
              Current Manual Rank:{" "}
              {incident.queuePriority?.manualOverrideRank ?? "None"}
            </Text>

            <FormSelect
              label="Queue Override Level"
              selectedValue={queueForm.overrideLevel}
              onValueChange={(value) =>
                setQueueForm((prev) => ({
                  ...prev,
                  overrideLevel: value,
                }))
              }
              options={QUEUE_OVERRIDE_OPTIONS}
              placeholder="Select override level"
            />

            <FormInput
              label="Override Reason"
              value={queueForm.overrideReason}
              onChangeText={(value) =>
                setQueueForm((prev) => ({
                  ...prev,
                  overrideReason: value,
                }))
              }
              placeholder="Why is this incident being moved in the queue?"
              multiline
            />

            <FormInput
              label="Expected Action"
              value={queueForm.expectedAction}
              onChangeText={(value) =>
                setQueueForm((prev) => ({
                  ...prev,
                  expectedAction: value,
                }))
              }
              placeholder="e.g. Prepare resuscitation bay, alert theatre, monitor only..."
              multiline
            />

            <AppButton
              title={isReordering ? "Applying..." : "Apply Queue Override"}
              onPress={handleQueueOverride}
              loading={isReordering}
              disabled={isReordering}
              variant="secondary"
            />
          </FormSection>

          <FormSection title="Incident Status Update">
            <FormSelect
              label="Status"
              selectedValue={statusForm.status}
              onValueChange={(value) =>
                setStatusForm((prev) => ({ ...prev, status: value }))
              }
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />

            {statusForm.status === "REJECTED" ||
            statusForm.status === "CANCELLED" ? (
              <FormInput
                label="Rejection / Cancellation Reason"
                value={statusForm.rejectionReason}
                onChangeText={(value) =>
                  setStatusForm((prev) => ({
                    ...prev,
                    rejectionReason: value,
                  }))
                }
                placeholder="Explain reason"
                multiline
              />
            ) : null}

            <FormInput
              label="Status Note"
              value={statusForm.note}
              onChangeText={(value) =>
                setStatusForm((prev) => ({ ...prev, note: value }))
              }
              placeholder="Enter operational or public note"
              multiline
            />

            <AppButton
              title={isUpdatingStatus ? "Updating..." : "Update Status"}
              onPress={handleUpdateStatus}
              loading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            />
          </FormSection>

          <FormSection title="Patients">
            <FormInput
              label="Add Patient Note"
              value={patientNote}
              onChangeText={setPatientNote}
              placeholder="Optional note"
              multiline
            />

            <AppButton
              title={isAddingPatient ? "Adding..." : "Add Patient"}
              onPress={handleAddPatient}
              loading={isAddingPatient}
              disabled={isAddingPatient}
              variant="secondary"
            />

            {incident.patients?.length ? (
              incident.patients.map((patient) => {
                const latestTriage = patient.triages?.[0] || null;

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
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {patient.fullName || patient.patientCode}
                      </Text>

                      {latestTriage ? (
                        <StatusBadge
                          label={latestTriage.urgencyLevel}
                          type={getPriorityType(latestTriage.urgencyLevel)}
                        />
                      ) : (
                        <StatusBadge label={patient.status} type="warning" />
                      )}
                    </View>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Status: {patient.status}
                    </Text>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Requests: {patient.resourceRequests?.length || 0}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <EmptyStateCard
                title="No Patients"
                message="No patients have been added to this incident yet."
                icon="people-outline"
              />
            )}
          </FormSection>

          <FormSection title="Status Timeline">
            {incident.statusHistory?.length ? (
              incident.statusHistory.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.timelineItem,
                    {
                      backgroundColor: colors.surface,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: colors.text }]}>
                    {item.status}
                  </Text>

                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>

                  {item.note ? (
                    <Text style={[typography.body, { color: colors.text }]}>
                      {item.note}
                    </Text>
                  ) : null}

                  {item.rejectionReason ? (
                    <Text style={[typography.body, { color: colors.text }]}>
                      Reason: {item.rejectionReason}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <EmptyStateCard
                title="No Timeline"
                message="No status updates have been recorded yet."
                icon="time-outline"
              />
            )}
          </FormSection>
        </ScrollView>

        <StaffNavBar activeRoute="/staff/incidents" />
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
  card: {
    borderWidth: 1,
    marginBottom: 10,
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    borderWidth: 1,
    minWidth: 140,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  incidentImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 12,
  },
  timelineItem: {
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
  },
});