import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, StyleSheet, View, Alert } from "react-native";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import FormSwitch from "../../src/components/FormSwitch";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import { getTriageAssessment } from "../../src/services/triageService";
import { COLORS } from "../../src/constants/theme";

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

  return (
    <>
      <View style={styles.container}>
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
      </View>

      <StaffNavBar activeRoute="/staff/triage" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 110,
    backgroundColor: COLORS.background,
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