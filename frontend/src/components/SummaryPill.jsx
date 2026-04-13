import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function SummaryPill({
  label,
  value,
  type = "neutral",
}) {
  const backgroundStyle =
    type === "success"
      ? styles.success
      : type === "warning"
      ? styles.warning
      : type === "danger"
      ? styles.danger
      : type === "info"
      ? styles.info
      : styles.neutral;

  const textStyle =
    type === "success"
      ? styles.successText
      : type === "warning"
      ? styles.warningText
      : type === "danger"
      ? styles.dangerText
      : type === "info"
      ? styles.infoText
      : styles.neutralText;

  return (
    <View style={[styles.pill, backgroundStyle]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
      <Text style={[styles.value, textStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 130,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "800",
  },
  success: {
    backgroundColor: COLORS.successBg,
  },
  successText: {
    color: COLORS.successText,
  },
  warning: {
    backgroundColor: COLORS.warningBg,
  },
  warningText: {
    color: COLORS.warningText,
  },
  danger: {
    backgroundColor: COLORS.dangerBg,
  },
  dangerText: {
    color: COLORS.dangerText,
  },
  info: {
    backgroundColor: COLORS.infoBg,
  },
  infoText: {
    color: COLORS.infoText,
  },
  neutral: {
    backgroundColor: COLORS.neutralBg,
  },
  neutralText: {
    color: COLORS.neutralText,
  },
});