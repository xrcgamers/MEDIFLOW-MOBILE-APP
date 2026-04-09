import { useLocalSearchParams, router } from "expo-router";
import { ScrollView, Text, StyleSheet } from "react-native";
import FormSection from "../src/components/FormSection";
import AppButton from "../src/components/AppButton";
import StatusBadge from "../src/components/StatusBadge";

export default function ReportSuccessScreen() {
  const params = useLocalSearchParams();

  const trackingCode = params.trackingCode || "MDF-000000";
  const status = params.status || "Received";
  const incidentType = params.incidentType || "Unknown";
  const location = params.location || "Location not available";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report Submitted</Text>
      <Text style={styles.helperText}>
        Your emergency report was received successfully.
      </Text>

      <FormSection title="Submission Summary">
        <Text style={styles.label}>Tracking Code</Text>
        <Text style={styles.value}>{trackingCode}</Text>

        <Text style={styles.label}>Incident Type</Text>
        <Text style={styles.info}>{incidentType}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.info}>{location}</Text>

        <Text style={styles.label}>Current Status</Text>
        <StatusBadge label={status} type="info" />
      </FormSection>

      <FormSection title="What Next?">
        <Text style={styles.info}>
          Keep your tracking code safe. Use it to follow report progress. If the
          situation changes, hospital staff may update the public status.
        </Text>
      </FormSection>

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
        title="Back to Home"
        onPress={() => router.replace("/")}
        variant="secondary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f9fafb",
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
});