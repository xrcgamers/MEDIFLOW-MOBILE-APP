import { View, Text, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";
import { useAppTheme } from "../context/ThemeContext";

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
  const { colors, radius, spacing } = useAppTheme();

  const label =
    item.actionType === "TRIAGE_ASSESSMENT"
      ? "Triage Assessment"
      : "Status Update";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label} by ${item.actorName || "authenticated staff user"} at ${new Date(item.createdAt).toLocaleString()}`}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.title, { color: colors.text }]}
          maxFontSizeMultiplier={1.6}
        >
          {label}
        </Text>
        {item.status ? (
          <StatusBadge
            label={item.status}
            type={getLogType(item.actionType, item.status)}
          />
        ) : null}
      </View>

      <Text
        style={[styles.meta, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        By: {item.actorName || "Authenticated Staff User"}
      </Text>

      <Text
        style={[styles.meta, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        At: {new Date(item.createdAt).toLocaleString()}
      </Text>

      {item.note ? (
        <Text
          style={[styles.note, { color: colors.text }]}
          maxFontSizeMultiplier={1.8}
        >
          {item.note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
});