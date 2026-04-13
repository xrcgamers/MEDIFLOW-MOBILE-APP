import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  View,
  Modal,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import StatusBadge from "../../src/components/StatusBadge";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import InfoRow from "../../src/components/InfoRow";
import HistoryItem from "../../src/components/HistoryItem";
import StaffLogItem from "../../src/components/StaffLogItem";
import QuickStatusAction from "../../src/components/QuickStatusAction";
import SummaryPill from "../../src/components/SummaryPill";
import PriorityBanner from "../../src/components/PriorityBanner";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import { PUBLIC_REPORT_STATUSES } from "../../src/constants/statusOptions";
import {
  getIncidentByIdService,
  updateIncidentStatusService,
} from "../../src/services/staffIncidentService";
import { API_ROOT_URL } from "../../src/config/api";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";

const QUICK_STATUS_PRESETS = [
  {
    label: "Under Review",
    note: "Incident is being reviewed by emergency staff.",
  },
  {
    label: "Accepted",
    note: "Incident accepted for response and further handling.",
  },
  {
    label: "Response In Progress",
    note: "Emergency response handling is currently in progress.",
  },
  {
    label: "Rejected",
    note: "Incident report was reviewed and rejected.",
  },
  {
    label: "Duplicate",
    note: "This incident was identified as a duplicate report.",
  },
  {
    label: "Closed",
    note: "Incident handling has been completed and closed.",
  },
];

function getStatusType(status) {
  switch (status) {
    case "Accepted":
    case "Closed":
      return "success";
    case "Under Review":
    case "Response In Progress":
    case "Duplicate":
      return "warning";
    case "Received":
      return "info";
    case "Rejected":
      return "danger";
    default:
      return "neutral";
  }
}

function getUrgencyType(urgency) {
  switch (urgency) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Moderate":
      return "info";
    default:
      return "neutral";
  }
}

function computePriority(incident, latestTriage) {
  let score = 0;
  const reasons = [];

  if (latestTriage?.urgency === "Critical") {
    score += 5;
    reasons.push("critical triage urgency");
  } else if (latestTriage?.urgency === "High") {
    score += 4;
    reasons.push("high triage urgency");
  } else if (latestTriage?.urgency === "Moderate") {
    score += 2;
    reasons.push("moderate triage urgency");
  }

  if (Number(incident.victimCount) >= 5) {
    score += 3;
    reasons.push("multiple victims");
  } else if (Number(incident.victimCount) >= 2) {
    score += 2;
    reasons.push("more than one victim");
  } else {
    score += 1;
    reasons.push("single victim");
  }

  if (incident.mediaCount > 0) {
    score += 1;
    reasons.push("evidence available");
  }

  if (
    incident.latitude !== null &&
    incident.latitude !== undefined &&
    incident.longitude !== null &&
    incident.longitude !== undefined
  ) {
    score += 1;
    reasons.push("location confirmed");
  }

  let level = "Low";

  if (score >= 8) {
    level = "Critical";
  } else if (score >= 6) {
    level = "High";
  } else if (score >= 4) {
    level = "Moderate";
  }

  return {
    level,
    score,
    reason: `Priority based on ${reasons.join(", ")}.`,
  };
}

export default function IncidentDetailsScreen() {
  const params = useLocalSearchParams();
  const [incident, setIncident] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Received");
  const [staffNote, setStaffNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setIsLoading(true);
        const data = await getIncidentByIdService(params.id);
        setIncident(data);
        setSelectedStatus(data.status);
        setStaffNote(data.staffNote || "");
      } catch (error) {
        console.error("Failed to load incident:", error.message);
        Alert.alert("Load Failed", "Unable to load incident details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadIncident();
    }
  }, [params.id]);

  const handleAccept = () => setSelectedStatus("Accepted");
  const handleReject = () => setSelectedStatus("Rejected");
  const handleMarkDuplicate = () => setSelectedStatus("Duplicate");

  const handlePresetSelect = (preset) => {
    setSelectedStatus(preset.label);
    setStaffNote(preset.note);
  };

  const handleUpdateStatus = async () => {
    if (!incident) return;

    try {
      setIsUpdating(true);
      const updated = await updateIncidentStatusService(incident.id, {
        status: selectedStatus,
        note: staffNote,
      });

      setIncident(updated);
      setSelectedStatus(updated.status);
      setStaffNote(updated.staffNote || "");
      Alert.alert("Status Updated", `Incident updated to ${updated.status}`);
    } catch (error) {
      Alert.alert("Update Failed", error.message || "Failed to update incident.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProceedToTriage = () => {
    router.push({
      pathname: "/staff/triage",
      params: {
        reportId: incident.id,
        trackingCode: incident.trackingCode,
      },
    });
  };

  const handleGoToIncidents = () => {
    router.push("/staff/incidents");
  };

  const handleGoToResources = () => {
    router.push("/staff/resources");
  };

  const handleGoToDashboard = () => {
    router.push("/staff");
  };

  const openPreview = (url) => {
    setPreviewImageUrl(url);
  };

  const closePreview = () => {
    setPreviewImageUrl(null);
  };

  const handleOpenMaps = async () => {
    if (
      incident?.latitude === null ||
      incident?.latitude === undefined ||
      incident?.longitude === null ||
      incident?.longitude === undefined
    ) {
      Alert.alert("Location Unavailable", "No coordinates available for this report.");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("Maps Unavailable", "Unable to open Google Maps.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Maps Error", "Failed to open map location.");
    }
  };

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <BackNavButton label="Back to Reports" fallbackRoute="/staff/incidents" />
        <PageHeader
          eyebrow="Incident Review"
          title="Incident Details"
          subtitle="Loading incident..."
          icon="eye-outline"
        />
      </ScrollView>
    );
  }

  if (!incident) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <BackNavButton label="Back to Reports" fallbackRoute="/staff/incidents" />
        <PageHeader
          eyebrow="Incident Review"
          title="Incident Details"
          subtitle="Incident not found."
          icon="eye-outline"
        />
      </ScrollView>
    );
  }

  const hasCoordinates =
    incident.latitude !== null &&
    incident.latitude !== undefined &&
    incident.longitude !== null &&
    incident.longitude !== undefined;

  const latestTriage = incident.triageAssessments?.[0] || null;

  const evidenceValue = incident.mediaCount > 0 ? "Available" : "None";
  const evidenceType = incident.mediaCount > 0 ? "info" : "neutral";

  const locationValue = hasCoordinates ? "Available" : "Missing";
  const locationType = hasCoordinates ? "success" : "warning";

  const triageValue = latestTriage?.urgency || "Not Assessed";
  const triageType = latestTriage
    ? getUrgencyType(latestTriage.urgency)
    : "neutral";

  const publicStatusType = getStatusType(selectedStatus);
  const priority = computePriority(incident, latestTriage);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <BackNavButton label="Back to Reports" fallbackRoute="/staff/incidents" />

        <PageHeader
          eyebrow="Incident Review"
          title="Incident Details"
          subtitle="Review the incident and choose the next action."
          icon="eye-outline"
        />

        <FormSection title="Quick Navigation">
          <View style={styles.quickNavWrap}>
            <Pressable style={styles.quickNavButton} onPress={handleGoToDashboard}>
              <Ionicons
                name="home-outline"
                size={18}
                color={COLORS.primaryDark}
                style={styles.quickNavIcon}
              />
              <Text style={styles.quickNavText}>Staff Home</Text>
            </Pressable>

            <Pressable style={styles.quickNavButton} onPress={handleGoToIncidents}>
              <Ionicons
                name="list-outline"
                size={18}
                color={COLORS.primaryDark}
                style={styles.quickNavIcon}
              />
              <Text style={styles.quickNavText}>Reports List</Text>
            </Pressable>

            <Pressable style={styles.quickNavButton} onPress={handleProceedToTriage}>
              <Ionicons
                name="pulse-outline"
                size={18}
                color={COLORS.primaryDark}
                style={styles.quickNavIcon}
              />
              <Text style={styles.quickNavText}>Open Triage</Text>
            </Pressable>

            <Pressable style={styles.quickNavButton} onPress={handleGoToResources}>
              <Ionicons
                name="layers-outline"
                size={18}
                color={COLORS.primaryDark}
                style={styles.quickNavIcon}
              />
              <Text style={styles.quickNavText}>Resources</Text>
            </Pressable>
          </View>
        </FormSection>

        <FormSection title="Priority Overview">
          <PriorityBanner
            level={priority.level}
            score={priority.score}
            reason={priority.reason}
          />
        </FormSection>

        <FormSection title="Quick Summary">
          <View style={styles.summaryWrap}>
            <SummaryPill
              label="Public Status"
              value={selectedStatus}
              type={publicStatusType}
            />
            <SummaryPill
              label="Triage"
              value={triageValue}
              type={triageType}
            />
            <SummaryPill
              label="Evidence"
              value={evidenceValue}
              type={evidenceType}
            />
            <SummaryPill
              label="Location"
              value={locationValue}
              type={locationType}
            />
          </View>
        </FormSection>

        <FormSection title="Incident Summary">
          <InfoRow label="Incident ID" value={incident.id} />
          <InfoRow label="Tracking Code" value={incident.trackingCode} />
          <InfoRow
            label="Type"
            value={incident.resolvedIncidentType || incident.incidentType}
          />
          <InfoRow label="Victims" value={String(incident.victimCount)} />
          <InfoRow
            label="Reported At"
            value={new Date(incident.createdAt).toLocaleString()}
          />
          <InfoRow label="Source" value={incident.source} />
          <StatusBadge
            label={selectedStatus}
            type={getStatusType(selectedStatus)}
          />
        </FormSection>

        <FormSection title="Reporter & Location">
          <InfoRow label="Reporter Phone" value={incident.phoneNumber} />
          <InfoRow label="Resolved Location" value={incident.resolvedLocationText} />
          <InfoRow label="Detected Location" value={incident.autoLocationText} />
          <InfoRow label="Typed Landmark" value={incident.manualLocationText} />
          <InfoRow
            label="Coordinates"
            value={
              hasCoordinates
                ? `${incident.latitude}, ${incident.longitude}`
                : "Not available"
            }
          />
        </FormSection>

        <FormSection title="Location Preview">
          <View style={styles.mapCard}>
            <View style={styles.mapIconWrap}>
              <Ionicons name="location-outline" size={24} color={COLORS.primaryDark} />
            </View>

            <Text style={styles.mapTitle}>
              {incident.resolvedLocationText || "Location not available"}
            </Text>

            <Text style={styles.mapSubtitle}>
              {hasCoordinates
                ? `${incident.latitude}, ${incident.longitude}`
                : "Coordinates not available"}
            </Text>

            <AppButton
              title="Open in Google Maps"
              onPress={handleOpenMaps}
              variant="secondary"
              disabled={!hasCoordinates}
            />
          </View>
        </FormSection>

        <FormSection title="Incident Notes & Media">
          <InfoRow label="Reporter Notes" value={incident.notes} />
          <InfoRow label="Attached Media Count" value={String(incident.mediaCount)} />

          {incident.mediaAttachments?.length ? (
            incident.mediaAttachments.map((item) => {
              const imageUrl = `${API_ROOT_URL}${item.filePath}`;

              return (
                <Pressable
                  key={item.id}
                  style={styles.mediaBlock}
                  onPress={() => openPreview(imageUrl)}
                >
                  <Image source={{ uri: imageUrl }} style={styles.mediaImage} />
                  <Text style={styles.mediaName}>{item.fileName}</Text>
                  <Text style={styles.tapHint}>Tap to view fullscreen</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No uploaded evidence available.</Text>
          )}
        </FormSection>

        <FormSection title="Latest Triage Assessment">
          {latestTriage ? (
            <>
              <StatusBadge
                label={latestTriage.urgency}
                type={getUrgencyType(latestTriage.urgency)}
              />
              <InfoRow label="Score" value={String(latestTriage.score)} />
              <InfoRow label="Advisory" value={latestTriage.advisory} />
              <InfoRow
                label="Assessed At"
                value={new Date(latestTriage.createdAt).toLocaleString()}
              />
              <Text style={styles.reasonTitle}>Reasons</Text>
              {latestTriage.reasons?.length ? (
                latestTriage.reasons.map((reason) => (
                  <Text key={reason} style={styles.reasonItem}>
                    • {reason}
                  </Text>
                ))
              ) : (
                <Text style={styles.reasonItem}>• No reasons recorded</Text>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>No triage assessment linked yet.</Text>
          )}
        </FormSection>

        <FormSection title="Staff Audit Log">
          {incident.staffLogs?.length ? (
            incident.staffLogs.map((log) => (
              <StaffLogItem key={log.id} item={log} />
            ))
          ) : (
            <Text style={styles.emptyText}>No staff actions recorded yet.</Text>
          )}
        </FormSection>

        <FormSection title="Status History">
          {incident.statusHistory?.length ? (
            incident.statusHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={{
                  id: item.id,
                  label: item.label,
                  time: new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No status history available.</Text>
          )}
        </FormSection>

        <FormSection title="Review Actions">
          <AppButton title="Accept Report" onPress={handleAccept} />
          <AppButton
            title="Reject Report"
            onPress={handleReject}
            variant="secondary"
          />
          <AppButton
            title="Mark Duplicate"
            onPress={handleMarkDuplicate}
            variant="secondary"
          />
        </FormSection>

        <FormSection title="Public Tracking Update">
          <Text style={styles.quickTitle}>Quick Presets</Text>
          <View style={styles.quickWrap}>
            {QUICK_STATUS_PRESETS.map((preset) => (
              <QuickStatusAction
                key={preset.label}
                label={preset.label}
                active={selectedStatus === preset.label}
                onPress={() => handlePresetSelect(preset)}
              />
            ))}
          </View>

          <Text style={styles.quickHint}>
            Tap a preset to auto-fill the status and a suggested staff note.
          </Text>

          <FormSelect
            label="Public Status"
            selectedValue={selectedStatus}
            onValueChange={setSelectedStatus}
            options={PUBLIC_REPORT_STATUSES}
            placeholder="Select public status"
          />

          <FormInput
            label="Internal Staff Note"
            placeholder="Add internal note for staff follow-up"
            value={staffNote}
            onChangeText={setStaffNote}
            multiline
          />

          <AppButton
            title={isUpdating ? "Updating..." : "Update Public Status"}
            onPress={handleUpdateStatus}
            disabled={isUpdating}
          />
        </FormSection>

        <FormSection title="Next Step">
          <AppButton title="Proceed to Triage" onPress={handleProceedToTriage} />
        </FormSection>
      </ScrollView>

      <Modal
        visible={!!previewImageUrl}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.closeButton} onPress={closePreview}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </Pressable>

          {previewImageUrl ? (
            <Image
              source={{ uri: previewImageUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  quickNavWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickNavButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  quickNavIcon: {
    marginRight: 6,
  },
  quickNavText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },
  mapCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    padding: 16,
  },
  mapIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.infoBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  mapSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  mediaBlock: {
    marginTop: 12,
    marginBottom: 14,
  },
  mediaImage: {
    width: "100%",
    height: 240,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
  },
  mediaName: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  reasonItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.xs,
  },
  quickHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullscreenImage: {
    width: "100%",
    height: "85%",
    borderRadius: 16,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});