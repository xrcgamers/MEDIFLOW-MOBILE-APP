import { View, Text, StyleSheet, Image } from "react-native";
import AppButton from "./AppButton";
import StatusBadge from "./StatusBadge";
import { COLORS, RADIUS, SPACING, SHADOW } from "../constants/theme";

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
      <View style={styles.topRow}>
        <Text style={styles.title}>{incident.incidentType}</Text>
        <StatusBadge label={incident.status} type={getStatusType(incident.status)} />
      </View>

      {incident.evidenceImageUrl ? (
        <Image source={{ uri: incident.evidenceImageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.noImageBox}>
          <Text style={styles.noImageText}>No evidence photo</Text>
        </View>
      )}

      <Text style={styles.meta}>Tracking Code: {incident.trackingCode}</Text>
      <Text style={styles.meta}>Location: {incident.location}</Text>
      <Text style={styles.meta}>Victims: {incident.victims}</Text>
      <Text style={styles.meta}>Reported At: {incident.reportedAt}</Text>
      <Text style={styles.meta}>
        Evidence: {incident.mediaCount > 0 ? `${incident.mediaCount} file(s)` : "None"}
      </Text>

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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.card,
  },
  topRow: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: COLORS.text,
  },
  thumbnail: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  noImageBox: {
    height: 70,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  noImageText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  meta: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    marginTop: 2,
  },
});