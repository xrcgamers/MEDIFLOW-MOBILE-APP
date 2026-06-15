import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Text, StyleSheet, ScrollView } from "react-native";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import FormSwitch from "../../src/components/FormSwitch";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import { getTriageAssessment } from "../../src/services/triageService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { validateTriageForm } from "../../src/validators/staffValidators";

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
  const { colors, typography } = useAppTheme();
  const { showToast } = useToast();
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
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    if (isSubmitting) return;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      general: undefined,
    }));
  };

  const handleAssess = async () => {
    if (isSubmitting) return;

    const validationErrors = validateTriageForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast({
        title: "Check Triage Input",
        message:
          validationErrors.general ||
          validationErrors.painScore ||
          "Please review the form.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const assessment = await getTriageAssessment(form, linkedReportId);
      setResult(assessment);

      showToast({
        title: "Triage Saved",
        message: linkedTrackingCode
          ? `Assessment saved for report ${linkedTrackingCode}.`
          : "Assessment completed successfully.",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Assessment Failed",
        message: error.message || "Unable to run triage assessment.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBackToIncident = () => {
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
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      >
        <BackNavButton
          label={linkedReportId ? "Back to Incident" : "Back to Reports"}
          fallbackRoute="/staff/incidents"
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

        {linkedTrackingCode ? (
          <FormSection title="Linked Incident">
            <Text
              style={[typography.body, { color: colors.text }]}
              maxFontSizeMultiplier={1.8}
            >
              This triage assessment will be attached to report {linkedTrackingCode}.
            </Text>
          </FormSection>
        ) : null}

        <FormSection title="Clinical Indicators">
          {errors.general ? (
            <Text
              style={[styles.errorText, { color: colors.dangerText }]}
              maxFontSizeMultiplier={1.7}
            >
              {errors.general}
            </Text>
          ) : null}

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
            error={errors.painScore}
          />
        </FormSection>

        <AppButton
          title={isSubmitting ? "Running Assessment..." : "Run Triage Assessment"}
          onPress={handleAssess}
          disabled={isSubmitting}
          loading={isSubmitting}
        />

        {linkedReportId ? (
          <AppButton
            title="Back to Incident Details"
            onPress={handleGoBackToIncident}
            variant="secondary"
            disabled={isSubmitting}
          />
        ) : null}

        {result ? (
          <FormSection title="Advisory Result">
            <StatusBadge
              label={result.urgency}
              type={getUrgencyType(result.urgency)}
            />

            <Text
              style={[
                typography.body,
                { color: colors.text, fontWeight: "700", marginTop: 8, marginBottom: 8 },
              ]}
              maxFontSizeMultiplier={1.8}
            >
              Score: {result.score}
            </Text>

            <Text
              style={[
                typography.body,
                { color: colors.text, fontWeight: "700", marginBottom: 8 },
              ]}
              maxFontSizeMultiplier={1.8}
            >
              Recommendation:
            </Text>

            <Text
              style={[
                typography.body,
                { color: colors.textMuted, marginBottom: 12 },
              ]}
              maxFontSizeMultiplier={1.9}
            >
              {result.advisory}
            </Text>

            <Text
              style={[
                typography.body,
                { color: colors.text, fontWeight: "700", marginBottom: 8 },
              ]}
              maxFontSizeMultiplier={1.8}
            >
              Reasons:
            </Text>

            {result.reasons.length > 0 ? (
              result.reasons.map((reason) => (
                <Text
                  key={reason}
                  style={[
                    typography.body,
                    { color: colors.textMuted, marginBottom: 6 },
                  ]}
                  maxFontSizeMultiplier={1.9}
                >
                  • {reason}
                </Text>
              ))
            ) : (
              <Text
                style={[typography.body, { color: colors.textMuted }]}
                maxFontSizeMultiplier={1.9}
              >
                • No critical indicators selected
              </Text>
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
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
});