import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, StyleSheet, View, Alert, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import FormSwitch from "../../src/components/FormSwitch";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import { getTriageAssessment } from "../../src/services/triageService";
import { COLORS, RADIUS, SPACING } from "../../src/constants/theme";

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

export default function TriageScreen() {
  const params = useLocalSearchParams();
  const linkedReportId = params.reportId || null;
  const linkedTrackingCode = params.trackingCode || null;

  const [form, setForm] = useState({
    unconscious: false,
    notBreathingNormally: false,
    severeBleeding: false,
    multipleVictims: false,
    painScore: "",
  });

  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAssess = async () => {
    try {
      setIsSubmitting(true);
      const assessment = await getTriageAssessment(form, linkedReportId);
      setResult(assessment);
      Alert.alert(
        "Triage Saved",
        linkedTrackingCode
          ? `Assessment saved for report ${linkedTrackingCode}.`
          : "Assessment completed successfully."
      );
    } catch (error) {
      Alert.alert(
        "Assessment Failed",
        error.message || "Unable to run triage assessment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToHome = () => {
    router.push("/staff");
  };

  const handleGoToIncidents = () => {
    router.push("/staff/incidents");
  };

  const handleGoToResources = () => {
    router.push("/staff/resources");
  };

  const handleBackToIncident = () => {
    if (linkedReportId) {
      router.push({
        pathname: "/staff/incident-details",
        params: { id: linkedReportId },
      });
      return;
    }

    router.push("/staff/incidents");
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <BackNavButton
          label={linkedReportId ? "Back to Incident" : "Back to Reports"}
          fallbackRoute={linkedReportId ? "/staff/incidents" : "/staff/incidents"}
        />

        <PageHeader
          eyebrow="Clinical Decision Support"
          title="Triage Support"
          subtitle={
            linkedTrackingCode
              ? `Linked to report ${linkedTrackingCode}.`
              : "Advisory only. Final clinical judgment remains with staff."
          }
          icon="pulse-outline"
        />

        <FormSection title="Quick Navigation">
          <View style={styles.quickNavWrap}>
            <Pressable style={styles.quickNavButton} onPress={handleGoToHome}>
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

            <Pressable style={styles.quickNavButton} onPress={handleGoToResources}>
              <Ionicons
                name="layers-outline"
                size={18}
                color={COLORS.primaryDark}
                style={styles.quickNavIcon}
              />
              <Text style={styles.quickNavText}>Resources</Text>
            </Pressable>

            {linkedReportId ? (
              <Pressable style={styles.quickNavButton} onPress={handleBackToIncident}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={COLORS.primaryDark}
                  style={styles.quickNavIcon}
                />
                <Text style={styles.quickNavText}>Incident Details</Text>
              </Pressable>
            ) : null}
          </View>
        </FormSection>

        {linkedTrackingCode ? (
          <FormSection title="Linked Incident">
            <Text style={styles.linkedText}>
              This triage assessment will be attached to report {linkedTrackingCode}.
            </Text>
          </FormSection>
        ) : null}

        <FormSection title="Clinical Indicators">
          <FormSwitch
            label="Unconscious"
            value={form.unconscious}
            onValueChange={(value) => updateField("unconscious", value)}
          />

          <FormSwitch
            label="Not breathing normally"
            value={form.notBreathingNormally}
            onValueChange={(value) => updateField("notBreathingNormally", value)}
          />

          <FormSwitch
            label="Severe bleeding"
            value={form.severeBleeding}
            onValueChange={(value) => updateField("severeBleeding", value)}
          />

          <FormSwitch
            label="Multiple victims involved"
            value={form.multipleVictims}
            onValueChange={(value) => updateField("multipleVictims", value)}
          />

          <FormInput
            label="Pain Score (0-10)"
            placeholder="Enter pain score"
            value={form.painScore}
            onChangeText={(value) => updateField("painScore", value)}
            keyboardType="numeric"
          />
        </FormSection>

        <AppButton
          title={isSubmitting ? "Running Assessment..." : "Run Triage Assessment"}
          onPress={handleAssess}
          disabled={isSubmitting}
        />

        {result ? (
          <FormSection title="Advisory Result">
            <StatusBadge
              label={result.urgency}
              type={getUrgencyType(result.urgency)}
            />

            <Text style={styles.resultLine}>Score: {result.score}</Text>
            <Text style={styles.resultLine}>Recommendation:</Text>
            <Text style={styles.resultText}>{result.advisory}</Text>

            <Text style={[styles.resultLine, styles.reasonsTitle]}>Reasons:</Text>
            {result.reasons.length > 0 ? (
              result.reasons.map((reason) => (
                <Text key={reason} style={styles.reasonItem}>
                  • {reason}
                </Text>
              ))
            ) : (
              <Text style={styles.reasonItem}>• No critical indicators selected</Text>
            )}
          </FormSection>
        ) : null}
      </ScrollView>

      <StaffNavBar activeRoute="/staff/triage" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 110,
    backgroundColor: COLORS.background,
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
  linkedText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },
  resultLine: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  resultText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  reasonsTitle: {
    marginTop: 4,
  },
  reasonItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
});