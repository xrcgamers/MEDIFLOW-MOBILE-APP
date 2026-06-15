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
} from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import AppButton from "../../src/components/AppButton";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThreadPanel from "../../src/components/ThreadPanel";
import {
  getIncidentByIdService,
  updateIncidentStatusService,
  analyzeIncidentPriorityService,
  reorderIncidentQueueService,
  addPatientToIncidentService,
} from "../../src/services/staffIncidentService";
import { getIncidentThreadUiService } from "../../src/services/communicationService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { resolveMediaUrl } from "../../src/utils/mediaUrl";
import AdminReturnButton from "../../src/components/AdminReturnButton";

const STATUS_OPTIONS = [
  { label: "Received", value: "RECEIVED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Response In Progress", value: "RESPONSE_IN_PROGRESS" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Closed", value: "CLOSED" },
];

const QUEUE_OPTIONS = Array.from({ length: 10 }).map((_, index) => ({
  label: String(index + 1),
  value: String(index + 1),
}));

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
    default:
      return "info";
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

function getCategoryType(name) {
  switch (name) {
    case "BLOOD":
      return "danger";
    case "IMAGING":
      return "info";
    case "THEATRE":
      return "warning";
    case "BED":
      return "success";
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

function summarizeRequests(patients = []) {
  const requests = patients.flatMap((patient) => patient.resourceRequests || []);

  return {
    total: requests.length,
    partial: requests.filter((r) => r.requestStatus === "PARTIALLY_ALLOCATED").length,
    reserved: requests.filter((r) => r.requestStatus === "RESERVED").length,
    completed: requests.filter((r) => r.requestStatus === "COMPLETED").length,
  };
}

export default function IncidentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: "",
    note: "",
    rejectionReason: "",
  });

  const [queueForm, setQueueForm] = useState({
    manualOverrideRank: "",
    manualOverrideReason: "",
  });

  const [addPatientNote, setAddPatientNote] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [isSubmittingQueue, setIsSubmittingQueue] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isRunningAi, setIsRunningAi] = useState(false);

  const loadIncident = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const data = await getIncidentByIdService(id);
      setIncident(data);

      setStatusForm((prev) => ({
        ...prev,
        status: data.status || "",
      }));
    } catch (error) {
      showToast({
        title: "Incident Load Failed",
        message: error.message || "Unable to load incident details.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) loadIncident();
  }, [id]);

  const activePatients = useMemo(
    () => (incident?.patients || []).filter((item) => !item.isExcluded),
    [incident]
  );

  const requestSummary = useMemo(
    () => summarizeRequests(activePatients),
    [activePatients]
  );

  const handleRunAi = async () => {
    try {
      setIsRunningAi(true);
      await analyzeIncidentPriorityService(id);
      await loadIncident(true);

      showToast({
        title: "AI Analysis Complete",
        message: "Incident priority was refreshed successfully.",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "AI Analysis Failed",
        message: error.message || "Unable to analyze incident.",
        type: "error",
      });
    } finally {
      setIsRunningAi(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusForm.status) {
      showToast({
        title: "Missing Status",
        message: "Select an incident status first.",
        type: "warning",
      });
      return;
    }

    if (
      ["REJECTED", "CANCELLED"].includes(statusForm.status) &&
      !statusForm.rejectionReason.trim()
    ) {
      showToast({
        title: "Missing Reason",
        message: "Enter a rejection or cancellation reason.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmittingStatus(true);

      await updateIncidentStatusService(id, {
        status: statusForm.status,
        note: statusForm.note.trim(),
        rejectionReason: statusForm.rejectionReason.trim() || null,
      });

      setStatusForm((prev) => ({
        ...prev,
        note: "",
        rejectionReason: "",
      }));

      showToast({
        title: "Status Updated",
        message: "Incident status updated successfully.",
        type: "success",
      });

      await loadIncident(true);
    } catch (error) {
      showToast({
        title: "Status Update Failed",
        message: error.message || "Unable to update incident.",
        type: "error",
      });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleQueueOverride = async () => {
    if (!queueForm.manualOverrideRank || !queueForm.manualOverrideReason.trim()) {
      showToast({
        title: "Missing Queue Data",
        message: "Select a rank and enter a reason.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmittingQueue(true);

      await reorderIncidentQueueService(id, {
        manualOverrideRank: Number(queueForm.manualOverrideRank),
        manualOverrideReason: queueForm.manualOverrideReason.trim(),
      });

      setQueueForm({
        manualOverrideRank: "",
        manualOverrideReason: "",
      });

      showToast({
        title: "Queue Updated",
        message: "Manual queue override applied.",
        type: "success",
      });

      await loadIncident(true);
    } catch (error) {
      showToast({
        title: "Queue Override Failed",
        message: error.message || "Unable to override queue.",
        type: "error",
      });
    } finally {
      setIsSubmittingQueue(false);
    }
  };

  const handleAddPatient = async () => {
    try {
      setIsAddingPatient(true);

      await addPatientToIncidentService(id, {
        note: addPatientNote.trim(),
      });

      setAddPatientNote("");

      showToast({
        title: "Patient Added",
        message: "A new patient was added to this incident.",
        type: "success",
      });

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
          contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        >
          <BackNavButton label="Back to Incidents" fallbackRoute="/staff/incidents" />
          <PageHeader
            eyebrow="Incident Coordination"
            title="Incident Details"
            subtitle="Loading incident details..."
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
          contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        >
          <BackNavButton label="Back to Incidents" fallbackRoute="/staff/incidents" />
          <PageHeader
            eyebrow="Incident Coordination"
            title="Incident Details"
            subtitle="Incident data is unavailable."
            icon="document-text-outline"
          />
          <EmptyStateCard
            title="Incident Not Found"
            message="This incident could not be loaded."
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
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
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
              <StatusBadge label={incident.status} type={getStatusType(incident.status)} />

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
            </View>

            <Text style={[typography.body, { color: colors.text }]}>
              Incident Type: {incident.incidentType || "Unknown"}
            </Text>

            {incident.subIncidentType ? (
              <Text style={[typography.body, { color: colors.text }]}>
                Incident Subtype: {incident.subIncidentType}
              </Text>
            ) : null}

            {incident.otherIncidentType ? (
              <Text style={[typography.body, { color: colors.text }]}>
                Other Type Detail: {incident.otherIncidentType}
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
              Coordinates: {incident.latitude ?? "N/A"}, {incident.longitude ?? "N/A"}
            </Text>

            <Text style={[typography.body, { color: colors.text }]}>
              Estimated Patients: {incident.estimatedVictimCount ?? 0}
            </Text>

            <Text style={[typography.body, { color: colors.text }]}>
              Reporter Phone: {incident.phoneNumber || "Not provided"}
            </Text>

            {incident.notes ? (
              <Text style={[typography.body, { color: colors.text }]}>
                Notes: {incident.notes}
              </Text>
            ) : null}

            {incident.mediaAttachments?.[0]?.fileUrl ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Incident Photo:
                </Text>

                <Image
                  source={{
                    uri: resolveMediaUrl(incident.mediaAttachments[0].filePath),
                  }}
                  style={styles.incidentImage}
                />
              </View>
            ) : (
              <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>
                No incident photo available.
              </Text>
            )}
          </View>
        </FormSection>

        <FormSection title="Resource Fulfillment Overview">
          <View style={styles.summaryWrap}>
            <MiniCard label="Requests" value={requestSummary.total} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
            <MiniCard label="Partial" value={requestSummary.partial} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
            <MiniCard label="Reserved" value={requestSummary.reserved} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
            <MiniCard label="Completed" value={requestSummary.completed} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
          </View>
        </FormSection>

        <FormSection title="AI Priority Analysis">
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
              <StatusBadge
                label={incident.aiAssessment.priorityLevel}
                type={getPriorityType(incident.aiAssessment.priorityLevel)}
              />

              <Text style={[typography.body, { color: colors.text }]}>
                Confidence: {incident.aiAssessment.confidence}%
              </Text>

              <Text style={[typography.body, { color: colors.text }]}>
                Recommended Action: {incident.aiAssessment.recommendedNextAction}
              </Text>

              <Text style={[typography.body, { color: colors.textMuted }]}>
                Basis: {incident.aiAssessment.analysisBasis}
              </Text>

              {incident.aiAssessment.keyRiskFactors?.length ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    Key Risk Factors:
                  </Text>
                  {incident.aiAssessment.keyRiskFactors.map((factor, index) => (
                    <Text
                      key={`${factor}-${index}`}
                      style={[typography.body, { color: colors.text }]}
                    >
                      • {factor}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <EmptyStateCard
              title="No AI Analysis"
              message="Run AI analysis to refresh incident priority."
              icon="sparkles-outline"
            />
          )}

          <AppButton
            title={isRunningAi ? "Running..." : "Run AI Analysis"}
            onPress={handleRunAi}
            loading={isRunningAi}
            disabled={isRunningAi}
          />
        </FormSection>

        <FormSection title="Queue Priority Override">
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Final Priority Level: {incident.queuePriority?.finalPriorityLevel || "Not set"}
          </Text>

          <Text style={[typography.body, { color: colors.textMuted }]}>
            Final Priority Score: {incident.queuePriority?.finalPriorityScore ?? "Not set"}
          </Text>

          <FormSelect
            label="Manual Queue Rank"
            selectedValue={queueForm.manualOverrideRank}
            onValueChange={(value) =>
              setQueueForm((prev) => ({
                ...prev,
                manualOverrideRank: value,
              }))
            }
            options={QUEUE_OPTIONS}
            placeholder="Select manual rank"
          />

          <FormInput
            label="Override Reason"
            value={queueForm.manualOverrideReason}
            onChangeText={(value) =>
              setQueueForm((prev) => ({
                ...prev,
                manualOverrideReason: value,
              }))
            }
            placeholder="Why are you changing queue order?"
            multiline
          />

          <AppButton
            title={isSubmittingQueue ? "Applying..." : "Apply Queue Override"}
            onPress={handleQueueOverride}
            loading={isSubmittingQueue}
            disabled={isSubmittingQueue}
            variant="secondary"
          />
        </FormSection>

        <FormSection title="Incident Status Update">
          <FormSelect
            label="Status"
            selectedValue={statusForm.status}
            onValueChange={(value) =>
              setStatusForm((prev) => ({
                ...prev,
                status: value,
              }))
            }
            options={STATUS_OPTIONS}
            placeholder="Select incident status"
          />

          <FormInput
            label="Status Note"
            value={statusForm.note}
            onChangeText={(value) =>
              setStatusForm((prev) => ({
                ...prev,
                note: value,
              }))
            }
            placeholder="Enter operational or public note"
            multiline
          />

          {["REJECTED", "CANCELLED"].includes(statusForm.status) ? (
            <FormInput
              label="Rejection / Cancellation Reason"
              value={statusForm.rejectionReason}
              onChangeText={(value) =>
                setStatusForm((prev) => ({
                  ...prev,
                  rejectionReason: value,
                }))
              }
              placeholder="Enter reason"
              multiline
            />
          ) : null}

          <AppButton
            title={isSubmittingStatus ? "Updating..." : "Update Status"}
            onPress={handleUpdateStatus}
            loading={isSubmittingStatus}
            disabled={isSubmittingStatus}
          />
        </FormSection>

        <FormSection title="Patients">
          <FormInput
            label="Add Patient Note"
            value={addPatientNote}
            onChangeText={setAddPatientNote}
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

          {activePatients.length ? (
            activePatients.map((patient) => {
              const latestTriage = patient.triages?.[0] || null;

              return (
                <Pressable
                  key={patient.id}
                  style={[
                    styles.patientCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                    },
                    shadow,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/staff/patient-details",
                      params: { patientId: patient.id },
                    })
                  }
                >
                  <View style={styles.badgeRow}>
                    <StatusBadge label={patient.status} type="info" />
                    {latestTriage ? (
                      <StatusBadge
                        label={latestTriage.urgencyLevel}
                        type={getPriorityType(latestTriage.urgencyLevel)}
                      />
                    ) : null}
                  </View>

                  <Text style={[typography.label, { color: colors.text }]}>
                    {patient.patientCode}
                  </Text>

                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    {patient.fullName || "Unnamed patient"}
                  </Text>

                  {patient.resourceRequests?.length ? (
                    <View style={{ marginTop: 8 }}>
                      {patient.resourceRequests.map((request) => (
                        <View key={request.id} style={styles.requestLine}>
                          <View style={styles.badgeRow}>
                            <StatusBadge
                              label={request.resourceCategory?.name || "RESOURCE"}
                              type={getCategoryType(request.resourceCategory?.name)}
                            />
                            <StatusBadge
                              label={request.requestStatus}
                              type={getRequestType(request.requestStatus)}
                            />
                          </View>
                          <Text style={[typography.body, { color: colors.textMuted }]}>
                            {request.requestReason}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
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

        <ThreadPanel
          title="Incident Communication"
          loadKey={incident.id}
          loadThread={() => getIncidentThreadUiService(incident.id)}
        />

        <FormSection title="Status Timeline">
          {incident.statusHistory?.length ? (
            incident.statusHistory.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.timelineItem,
                  {
                    borderLeftColor: colors.primary,
                    backgroundColor: colors.surface,
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
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Status History"
              message="No timeline entries are available yet."
              icon="time-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/incidents" />
    </>
  );
}

function MiniCard({ label, value, colors, typography, radius, spacing, shadow }) {
  return (
    <View
      style={[
        styles.miniCard,
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
      <Text style={[styles.miniValue, { color: colors.text }]}>{value}</Text>
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
  },
  incidentImage: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  miniCard: {
    borderWidth: 1,
    minWidth: 140,
  },
  miniValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  patientCard: {
    borderWidth: 1,
    marginBottom: 10,
  },
  requestLine: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  timelineItem: {
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
  },
});