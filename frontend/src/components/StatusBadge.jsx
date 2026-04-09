import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function StatusBadge({ label, type = "neutral" }) {
  const badgeStyle = [
    styles.badge,
    type === "success" && styles.success,
    type === "warning" && styles.warning,
    type === "danger" && styles.danger,
    type === "info" && styles.info,
    type === "neutral" && styles.neutral,
  ];

  const textStyle = [
    styles.text,
    type === "success" && styles.successText,
    type === "warning" && styles.warningText,
    type === "danger" && styles.dangerText,
    type === "info" && styles.infoText,
    type === "neutral" && styles.neutralText,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xs,
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
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