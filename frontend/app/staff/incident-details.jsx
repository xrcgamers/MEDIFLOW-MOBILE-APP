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
import PageHeader from "../../src/components/PageHeader";
import { PUBLIC_REPORT_STATUSES } from "../../src/constants/statusOptions";
import {
  getIncidentByIdService,
  updateIncidentStatusService,
} from "../../src/services/staffIncidentService";
import { API_ROOT_URL } from "../../src/config/api";
import { COLORS, RADIUS } from "../../src/constants/theme";

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

  const hasCoordinates =
    incident.latitude !== null &&
    incident.latitude !== undefined &&
    incident.longitude !== null &&
    incident.longitude !== undefined;

  return (
    <>
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