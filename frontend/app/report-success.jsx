import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "../src/components/AppButton";
import FormSection from "../src/components/FormSection";
import PageHeader from "../src/components/PageHeader";
import { useAppTheme } from "../src/context/ThemeContext";

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

export default function ReportSuccessScreen() {
  const { colors, radius, spacing, shadow, typography } = useAppTheme();
  const params = useLocalSearchParams();

  const trackingCode = params.trackingCode || "Not available";
  const status = params.status || "Received";
  const incidentType = params.incidentType || "Not available";
  const location = params.location || "Not available";

  const statusTheme =
    getStatusType(status) === "success"
      ? { bg: colors.successBg, text: colors.successText }
      : getStatusType(status) === "warning"
      ? { bg: colors.warningBg, text: colors.warningText }
      : getStatusType(status) === "danger"
      ? { bg: colors.dangerBg, text: colors.dangerText }
      : { bg: colors.infoBg, text: colors.infoText };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
          },
          shadow,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.successBg }]}>
          <Ionicons name="checkmark-circle-outline" size={44} color={colors.successText} />
        </View>

        <PageHeader
          eyebrow="Report Submitted"
          title="Emergency Report Received"
          subtitle="Your report has been saved successfully. Keep your tracking code to follow updates."
          icon="shield-checkmark-outline"
        />

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: statusTheme.bg,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text
            style={[styles.statusText, { color: statusTheme.text }]}
            maxFontSizeMultiplier={1.6}
          >
            {status}
          </Text>
        </View>
      </View>

      <FormSection title="Tracking Details">
        <Text
          style={[styles.label, typography.label, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.6}
        >
          Tracking Code
        </Text>
        <Text
          style={[styles.trackingCode, { color: colors.primaryDark }]}
          maxFontSizeMultiplier={1.4}
        >
          {trackingCode}
        </Text>

        <Text
          style={[styles.label, typography.label, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.6}
        >
          Incident Type
        </Text>
        <Text
          style={[styles.value, typography.body, { color: colors.text }]}
          maxFontSizeMultiplier={1.8}
        >
          {incidentType}
        </Text>

        <Text
          style={[styles.label, typography.label, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.6}
        >
          Location
        </Text>
        <Text
          style={[styles.value, typography.body, { color: colors.text }]}
          maxFontSizeMultiplier={1.8}
        >
          {location}
        </Text>
      </FormSection>

      <FormSection title="Next Actions">
        <AppButton
          title="Track This Report"
          onPress={() =>
            router.push({
              pathname: "/track",
              params: { trackingCode },
            })
          }
        />
        <AppButton
          title="Report Another Emergency"
          onPress={() => router.replace("/report")}
          variant="secondary"
        />
        <AppButton
          title="Back to Home"
          onPress={() => router.replace("/")}
          variant="secondary"
        />
      </FormSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  hero: {
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
  },
  trackingCode: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  value: {},
});