import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, StyleSheet, ScrollView, Image, View } from "react-native";
import { validateTrackForm } from "../src/validators/reportValidators";
import { trackReportService } from "../src/services/trackService";
import FormInput from "../src/components/FormInput";
import AppButton from "../src/components/AppButton";
import FormSection from "../src/components/FormSection";
import TimelineItem from "../src/components/TimelineItem";
import StatusBadge from "../src/components/StatusBadge";
import PageHeader from "../src/components/PageHeader";
import { COLORS, RADIUS } from "../src/constants/theme";

function getTrackingStatusType(status) {
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

export default function TrackScreen() {
  const params = useLocalSearchParams();
  const [trackingCode, setTrackingCode] = useState(params.trackingCode || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [errors, setErrors] = useState({});

  const handleTrack = async () => {
    const validationErrors = validateTrackForm({
      trackingCode,
      phoneNumber,
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setTrackingResult(null);
      return;
    }

    try {
      const result = await trackReportService({
        trackingCode,
        phoneNumber,
      });

      setTrackingResult(result);
    } catch (error) {
      setTrackingResult({
        trackingCode,
        incidentType: "Unknown",
        lastUpdatedAt: new Date().toISOString(),
        status: "Unable to fetch report status right now.",
        timeline: [],
        media: [],
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        eyebrow="Public Tracking"
        title="Track Report"
        subtitle="Enter your tracking code to follow the current report progress."
        icon="locate-outline"
      />

      <FormSection title="Tracking Details">
        <FormInput
          label="Tracking Code"
          placeholder="Enter tracking code"
          value={trackingCode}
          onChangeText={setTrackingCode}
          error={errors.trackingCode}
        />

        <FormInput
          label="Phone Number (Optional)"
          placeholder="07XXXXXXXX or +2567XXXXXXXX"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          error={errors.phoneNumber}
        />
      </FormSection>

      <AppButton
        title="Check Status"
        onPress={handleTrack}
        variant="secondary"
      />

      {trackingResult ? (
        <>
          <FormSection title="Report Summary">
            <Text style={styles.summaryLabel}>Tracking Code</Text>
            <Text style={styles.summaryValue}>
              {trackingResult.trackingCode || trackingCode}
            </Text>

            <Text style={styles.summaryLabel}>Incident Type</Text>
            <Text style={styles.summaryText}>
              {trackingResult.incidentType || "Not available"}
            </Text>

            <Text style={styles.summaryLabel}>Last Updated</Text>
            <Text style={styles.summaryText}>
              {trackingResult.lastUpdatedAt
                ? new Date(trackingResult.lastUpdatedAt).toLocaleString()
                : "Not available"}
            </Text>
          </FormSection>

          {trackingResult.media?.length ? (
            <FormSection title="Captured Evidence">
              {trackingResult.media.map((item) => (
                <View key={item.id} style={styles.mediaBlock}>
                  <Image source={{ uri: item.url }} style={styles.mediaImage} />
                  <Text style={styles.mediaName}>{item.fileName}</Text>
                </View>
              ))}
            </FormSection>
          ) : null}

          <FormSection title="Current Status">
            <StatusBadge
              label={trackingResult.status}
              type={getTrackingStatusType(trackingResult.status)}
            />
          </FormSection>

          <FormSection title="Status Timeline">
            {trackingResult.timeline.length > 0 ? (
              trackingResult.timeline.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  isLast={index === trackingResult.timeline.length - 1}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No timeline updates available.</Text>
            )}
          </FormSection>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },
  mediaBlock: {
    marginBottom: 14,
  },
  mediaImage: {
    width: "100%",
    height: 220,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
  },
  mediaName: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});