import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function ResourceSummaryCard({
  label,
  value,
  type = "neutral",
  trend = "",
}) {
  const backgroundStyle =
    type === "success"
      ? styles.successBg
      : type === "warning"
      ? styles.warningBg
      : type === "danger"
      ? styles.dangerBg
      : type === "info"
      ? styles.infoBg
      : styles.neutralBg;

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
    <View style={[styles.card, backgroundStyle]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
      <Text style={[styles.value, textStyle]}>{value}</Text>
      {trend ? <Text style={[styles.trend, textStyle]}>{trend}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 150,
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  trend: {
    fontSize: 12,
    fontWeight: "700",
  },
  successBg: {
    backgroundColor: COLORS.successBg,
  },
  successText: {
    color: COLORS.successText,
  },
  warningBg: {
    backgroundColor: COLORS.warningBg,
  },
  warningText: {
    color: COLORS.warningText,
  },
  dangerBg: {
    backgroundColor: COLORS.dangerBg,
  },
  dangerText: {
    color: COLORS.dangerText,
  },
  infoBg: {
    backgroundColor: COLORS.infoBg,
  },
  infoText: {
    color: COLORS.infoText,
  },
  neutralBg: {
    backgroundColor: COLORS.neutralBg,
  },
  neutralText: {
    color: COLORS.neutralText,
  },
});