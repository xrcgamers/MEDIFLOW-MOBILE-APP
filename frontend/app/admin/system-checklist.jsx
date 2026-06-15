import { ScrollView, Text, StyleSheet, View } from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import StatusBadge from "../../src/components/StatusBadge";
import { useAppTheme } from "../../src/context/ThemeContext";

const CHECKS = [
  "Public emergency report submits with camera photo",
  "Coordinates are captured automatically",
  "Reporter can track report using tracking code",
  "Emergency Nurse can review incoming incidents",
  "Emergency Nurse can accept incident",
  "Patient placeholders are created after acceptance",
  "Triage Nurse can view accepted patients",
  "Triage Nurse can open patient details",
  "Resource requests route to correct section",
  "Theatre dashboard loads theatre requests",
  "Imaging dashboard loads imaging requests",
  "Blood Bank dashboard loads blood requests",
  "Bed Manager dashboard loads bed requests",
  "Admin can view system alerts",
  "Admin can resolve alerts",
  "Admin can manage resource inventory",
];

export default function SystemChecklistScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <BackNavButton label="Back to Admin Dashboard" fallbackRoute="/admin" />

      <PageHeader
        eyebrow="Demo Readiness"
        title="System Checklist"
        subtitle="Use this page to verify the major MediFlow workflows before presentation."
        icon="checkmark-done-outline"
      />

      <FormSection title="Core Workflow Checks">
        {CHECKS.map((item, index) => (
          <View
            key={item}
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
            <StatusBadge label={`STEP ${index + 1}`} type="info" />
            <Text style={[typography.body, { color: colors.text, marginTop: 8 }]}>
              {item}
            </Text>
          </View>
        ))}
      </FormSection>
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
    marginBottom: 10,
  },
});