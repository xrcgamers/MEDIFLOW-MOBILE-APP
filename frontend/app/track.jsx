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
import BackNavButton from "../src/components/BackNavButton";
import ThemeModeToggle from "../src/components/ThemeModeToggle";
import { useAppTheme } from "../src/context/ThemeContext";

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
  const { colors, radius, spacing, typography } = useAppTheme();
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
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <BackNavButton label="Back to Home" fallbackRoute="/" />

      <PageHeader
        eyebrow="Public Tracking"
        title="Track Report"
        subtitle="Enter your tracking code to follow the current report progress."
        icon="locate-outline"
      />

      <FormSection title="Appearance">
        <ThemeModeToggle />
        <Text
          style={[styles.helperText, typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}
          maxFontSizeMultiplier={1.8}
        >
          Choose the appearance mode you prefer.
        </Text>
      </FormSection>

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
            <Text
              style={[styles.summaryLabel, typography.label, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Tracking Code
            </Text>
            <Text
              style={[styles.summaryValue, { color: colors.primaryDark }]}
              maxFontSizeMultiplier={1.4}
            >
              {trackingResult.trackingCode || trackingCode}
            </Text>

            <Text
              style={[styles.summaryLabel, typography.label, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Incident Type
            </Text>
            <Text
              style={[styles.summaryText, typography.body, { color: colors.text }]}
              maxFontSizeMultiplier={1.8}
            >
              {trackingResult.incidentType || "Not available"}
            </Text>

            <Text
              style={[styles.summaryLabel, typography.label, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Last Updated
            </Text>
            <Text
              style={[styles.summaryText, typography.body, { color: colors.text }]}
              maxFontSizeMultiplier={1.8}
            >
              {trackingResult.lastUpdatedAt
                ? new Date(trackingResult.lastUpdatedAt).toLocaleString()
                : "Not available"}
            </Text>
          </FormSection>

          {trackingResult.media?.length ? (
            <FormSection title="Captured Evidence">
              {trackingResult.media.map((item) => (
                <View key={item.id} style={styles.mediaBlock}>
                  <Image
                    source={{ uri: item.url }}
                    style={[styles.mediaImage, { borderRadius: radius.lg }]}
                    accessibilityLabel="Tracked evidence image"
                  />
                  <Text
                    style={[styles.mediaName, typography.body, { color: colors.textMuted }]}
                    maxFontSizeMultiplier={1.8}
                  >
                    {item.fileName}
                  </Text>
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
              <Text
                style={[styles.emptyText, typography.body, { color: colors.textMuted }]}
                maxFontSizeMultiplier={1.8}
              >
                No timeline updates available.
              </Text>
            )}
          </FormSection>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  helperText: {
    lineHeight: 22,
  },
  summaryLabel: {
    marginBottom: 6,
    marginTop: 10,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  summaryText: {},
  emptyText: {},
  mediaBlock: {
    marginBottom: 14,
  },
  mediaImage: {
    width: "100%",
    height: 220,
    marginBottom: 8,
  },
  mediaName: {},
});