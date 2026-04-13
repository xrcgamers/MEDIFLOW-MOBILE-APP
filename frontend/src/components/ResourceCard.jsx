import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

function getResourceType(status) {
  switch (status) {
    case "Available":
    case "Ready":
    case "Adequate":
    case "On Duty":
      return "success";
    case "Low":
    case "Limited":
    case "Busy":
      return "warning";
    case "Unavailable":
    case "Critical":
    case "Off Duty":
      return "danger";
    default:
      return "neutral";
  }
}

function getResourceIcon(category, status) {
  if (category === "beds") return "bed-outline";
  if (category === "theatre") return "medkit-outline";
  if (category === "blood") return "water-outline";
  if (category === "staff") return "people-outline";
  if (status === "Critical") return "alert-circle-outline";
  return "layers-outline";
}

function getCardAccentStyle(type) {
  switch (type) {
    case "success":
      return styles.successAccent;
    case "warning":
      return styles.warningAccent;
    case "danger":
      return styles.dangerAccent;
    case "info":
      return styles.infoAccent;
    default:
      return styles.neutralAccent;
  }
}

export default function ResourceCard({ item }) {
  const type = getResourceType(item.status);

  return (
    <View style={[styles.card, getCardAccentStyle(type)]}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={getResourceIcon(item.category, item.status)}
            size={20}
            color={COLORS.primaryDark}
          />
        </View>

        <StatusBadge label={item.status} type={type} />
      </View>

      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>
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
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  successAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.successText,
  },
  warningAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.warningText,
  },
  dangerAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.dangerText,
  },
  infoAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.infoText,
  },
  neutralAccent: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.neutralText,
  },
});