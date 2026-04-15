import { View, Text, StyleSheet, Image } from "react-native";
import AppButton from "./AppButton";
import StatusBadge from "./StatusBadge";
import { getPriorityType } from "../utils/priority";
import { useAppTheme } from "../context/ThemeContext";

function getStatusType(status) {
  switch (status) {
    case "Accepted":
    case "Closed":
      return "success";
    case "Under Review":
    case "Duplicate":
    case "Response In Progress":
      return "warning";
    case "Received":
      return "info";
    case "Rejected":
      return "danger";
    default:
      return "neutral";
  }
}

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

export default function IncidentCard({ incident, onViewDetails }) {
  const { colors, radius, spacing, shadow } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        shadow,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Incident ${incident.incidentType}, status ${incident.status}`}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.title, { color: colors.text }]}
          maxFontSizeMultiplier={1.5}
        >
          {incident.incidentType}
        </Text>
        <StatusBadge
          label={incident.status}
          type={getStatusType(incident.status)}
        />
      </View>

      <View style={styles.badgeRow}>
        {incident.priorityLevel ? (
          <StatusBadge
            label={`Priority: ${incident.priorityLevel}`}
            type={getPriorityType(incident.priorityLevel)}
          />
        ) : null}

        {incident.triageUrgency ? (
          <StatusBadge
            label={`Triage: ${incident.triageUrgency}`}
            type={getUrgencyType(incident.triageUrgency)}
          />
        ) : null}
      </View>

      {incident.evidenceImageUrl ? (
        <Image
          source={{ uri: incident.evidenceImageUrl }}
          style={[styles.thumbnail, { borderRadius: radius.md }]}
          accessibilityLabel="Incident evidence image"
        />
      ) : (
        <View
          style={[
            styles.noImageBox,
            {
              borderRadius: radius.md,
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.noImageText, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            No evidence photo
          </Text>
        </View>
      )}

      <Text style={[styles.meta, { color: colors.textMuted }]} maxFontSizeMultiplier={1.6}>
        Tracking Code: {incident.trackingCode}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted }]} maxFontSizeMultiplier={1.6}>
        Location: {incident.location}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted }]} maxFontSizeMultiplier={1.6}>
        Victims: {incident.victims}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted }]} maxFontSizeMultiplier={1.6}>
        Reported At: {incident.reportedAt}
      </Text>
      <Text style={[styles.meta, { color: colors.textMuted }]} maxFontSizeMultiplier={1.6}>
        Evidence: {incident.mediaCount > 0 ? `${incident.mediaCount} file(s)` : "None"}
      </Text>

      <AppButton
        title="View Details"
        onPress={() => onViewDetails(incident)}
        variant="secondary"
        accessibilityLabel={`View details for ${incident.incidentType}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  thumbnail: {
    width: "100%",
    height: 160,
    marginBottom: 10,
  },
  noImageBox: {
    height: 70,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 2,
  },
});