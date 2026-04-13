import { View, Text, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

function getLogType(type, status) {
  if (type === "TRIAGE_ASSESSMENT") {
    if (status === "Critical") return "danger";
    if (status === "High") return "warning";
    if (status === "Moderate") return "info";
    return "neutral";
  }

  if (status === "Rejected") return "danger";
  if (status === "Accepted") return "success";
  if (status === "Duplicate") return "warning";
  if (status === "Under Review" || status === "Response In Progress") return "warning";
  if (status === "Received") return "info";

  return "neutral";
}

export default function StaffLogItem({ item }) {
  const label =
    item.actionType === "TRIAGE_ASSESSMENT"
      ? "Triage Assessment"
      : "Status Update";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{label}</Text>
        {item.status ? (
          <StatusBadge
            label={item.status}
            type={getLogType(item.actionType, item.status)}
          />
        ) : null}
      </View>

      <Text style={styles.meta}>
        By: {item.actorName || "Authenticated Staff User"}
      </Text>

      <Text style={styles.meta}>
        At: {new Date(item.createdAt).toLocaleString()}
      </Text>

      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  topRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 6,
    lineHeight: 21,
  },
});