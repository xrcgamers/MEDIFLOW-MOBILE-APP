import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Text, StyleSheet, Alert, ScrollView } from "react-native";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import StatusBadge from "../../src/components/StatusBadge";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
import InfoRow from "../../src/components/InfoRow";
import HistoryItem from "../../src/components/HistoryItem";
import PageHeader from "../../src/components/PageHeader";
import { PUBLIC_REPORT_STATUSES } from "../../src/constants/statusOptions";
import {
  getIncidentByIdService,
  updateIncidentStatusService,
} from "../../src/services/staffIncidentService";
import { COLORS } from "../../src/constants/theme";

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

export default function IncidentDetailsScreen() {
  const params = useLocalSearchParams();
  const [incident, setIncident] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Received");
  const [staffNote, setStaffNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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
    router.push("/staff/triage");
  };

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
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
        <PageHeader
          eyebrow="Incident Review"
          title="Incident Details"
          subtitle="Incident not found."
          icon="eye-outline"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        eyebrow="Incident Review"
        title="Incident Details"
        subtitle="Review the incident and choose the next action."
        icon="eye-outline"
      />

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
            incident.latitude !== null && incident.longitude !== null
              ? `${incident.latitude}, ${incident.longitude}`
              : "Not available"
          }
        />
      </FormSection>

      <FormSection title="Incident Notes & Media">
        <InfoRow label="Reporter Notes" value={incident.notes} />
        <InfoRow label="Attached Media Count" value={String(incident.mediaCount)} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },
});