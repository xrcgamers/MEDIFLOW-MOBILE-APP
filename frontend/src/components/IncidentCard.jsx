import { View, Text, StyleSheet } from "react-native";
import AppButton from "./AppButton";
import StatusBadge from "./StatusBadge";

function getStatusType(status) {
  switch (status) {
    case "Accepted":
      return "success";
    case "Under Review":
      return "warning";
    case "Received":
      return "info";
    case "Rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export default function IncidentCard({ incident, onViewDetails }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{incident.incidentType}</Text>
      <StatusBadge label={incident.status} type={getStatusType(incident.status)} />

      <Text style={styles.meta}>Tracking Code: {incident.trackingCode}</Text>
      <Text style={styles.meta}>Location: {incident.location}</Text>
      <Text style={styles.meta}>Victims: {incident.victims}</Text>
      <Text style={styles.meta}>Reported At: {incident.reportedAt}</Text>

      <AppButton
        title="View Details"
        onPress={() => onViewDetails(incident)}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  meta: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
});