import { useState } from "react";
import { ScrollView, Text, StyleSheet, View, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import BackNavButton from "../src/components/BackNavButton";
import PageHeader from "../src/components/PageHeader";
import FormSection from "../src/components/FormSection";
import FormInput from "../src/components/FormInput";
import AppButton from "../src/components/AppButton";
import EmptyStateCard from "../src/components/EmptyStateCard";
import StatusBadge from "../src/components/StatusBadge";
import { useAppTheme } from "../src/context/ThemeContext";
import { useToast } from "../src/context/ToastContext";
import {
  trackIncidentByCodeService,
  addPublicFollowUpNoteService,
} from "../src/services/reportService";
import { resolveMediaUrl } from "../src/utils/mediaUrl";

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

function formatDateTime(value) {
  if (!value) {
    return {
      date: "N/A",
      time: "N/A",
    };
  }

  const date = new Date(value);

  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
  };
}

export default function TrackReportScreen() {
  const params = useLocalSearchParams();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [trackingCode, setTrackingCode] = useState(
    params?.trackingCode ? String(params.trackingCode) : ""
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [incident, setIncident] = useState(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleTrack = async () => {
    if (!trackingCode.trim()) {
      showToast({
        title: "Tracking Code Required",
        message: "Enter your tracking code.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSearching(true);

      const data = await trackIncidentByCodeService({
        trackingCode: trackingCode.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });

      setIncident(data);
    } catch (error) {
      setIncident(null);
      showToast({
        title: "Report Not Found",
        message: error.message || "Unable to find this report.",
        type: "error",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowUp = async () => {
    if (!incident?.trackingCode) return;

    if (!followUpNote.trim()) {
      showToast({
        title: "Note Required",
        message: "Enter a follow-up note.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmittingNote(true);

      const updated = await addPublicFollowUpNoteService(incident.trackingCode, {
        note: followUpNote.trim(),
      });

      setIncident(updated);
      setFollowUpNote("");

      showToast({
        title: "Follow-up Sent",
        message: "Your update was added to the report.",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Follow-up Failed",
        message: error.message || "Unable to add follow-up note.",
        type: "error",
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackNavButton label="Back to Home" fallbackRoute="/" />

      <PageHeader
        eyebrow="Public Tracking"
        title="Track Report"
        subtitle="Check emergency report progress using your tracking code."
        icon="search-outline"
      />

      <FormSection title="Find Report">
        <FormInput
          label="Tracking Code"
          value={trackingCode}
          onChangeText={setTrackingCode}
          placeholder="e.g. MDF-123456"
        />

        <FormInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Optional but recommended"
          keyboardType="phone-pad"
        />

        <AppButton
          title={isSearching ? "Searching..." : "Track Report"}
          onPress={handleTrack}
          loading={isSearching}
          disabled={isSearching}
        />
      </FormSection>

      {incident ? (
        <>
          <FormSection title="Report Status">
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
                label={incident.status}
                type={getStatusType(incident.status)}
              />

              <Text style={[typography.body, { color: colors.text }]}>
                Tracking Code: {incident.trackingCode}
              </Text>

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
                {incident.manualLocationText ||
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

              {incident.mediaAttachments?.length ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    Attached Photo:
                  </Text>

                  <Image
                    source={{
                      uri: resolveMediaUrl(incident.mediaAttachments[0].filePath),
                    }}
                    style={styles.reportImage}
                  />
                </View>
              ) : null}
            </View>
          </FormSection>

          <FormSection title="Add Follow-up Note">
            <FormInput
              label="Follow-up Note"
              value={followUpNote}
              onChangeText={setFollowUpNote}
              placeholder="Add new information, location detail, or patient update"
              multiline
            />

            <AppButton
              title={isSubmittingNote ? "Sending..." : "Send Follow-up"}
              onPress={handleFollowUp}
              loading={isSubmittingNote}
              disabled={isSubmittingNote}
            />
          </FormSection>

          <FormSection title="Status History">
            {incident.statusHistory?.length ? (
              incident.statusHistory.map((item) => {
                const stamped = formatDateTime(item.createdAt);

                return (
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
                      Date: {stamped.date}
                    </Text>

                    <Text style={[typography.body, { color: colors.textMuted }]}>
                      Time: {stamped.time}
                    </Text>

                    {item.note ? (
                      <Text style={[typography.body, { color: colors.text }]}>
                        {item.note}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <EmptyStateCard
                title="No History Yet"
                message="No public status updates are available yet."
                icon="time-outline"
              />
            )}
          </FormSection>
        </>
      ) : (
        <EmptyStateCard
          title="No Report Loaded"
          message="Enter a tracking code to view report progress."
          icon="search-outline"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
  },
  reportImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 8,
  },
  timelineItem: {
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
  },
});