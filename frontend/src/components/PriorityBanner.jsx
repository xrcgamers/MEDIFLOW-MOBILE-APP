import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function PriorityBanner({
  level,
  score,
  reason,
}) {
  const type =
    level === "Critical"
      ? "danger"
      : level === "High"
      ? "warning"
      : level === "Moderate"
      ? "info"
      : "neutral";

  const backgroundStyle =
    type === "danger"
      ? styles.dangerBg
      : type === "warning"
      ? styles.warningBg
      : type === "info"
      ? styles.infoBg
      : styles.neutralBg;

  const textStyle =
    type === "danger"
      ? styles.dangerText
      : type === "warning"
      ? styles.warningText
      : type === "info"
      ? styles.infoText
      : styles.neutralText;

  return (
    <View style={[styles.container, backgroundStyle]}>
      <View style={styles.topRow}>
        <Ionicons
          name="flash-outline"
          size={20}
          color={
            type === "danger"
              ? COLORS.dangerText
              : type === "warning"
              ? COLORS.warningText
              : type === "info"
              ? COLORS.infoText
              : COLORS.neutralText
          }
          style={styles.icon}
        />
        <Text style={[styles.title, textStyle]}>
          Priority: {level}
        </Text>
      </View>

      <Text style={[styles.score, textStyle]}>Score: {score}</Text>
      <Text style={[styles.reason, textStyle]}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  score: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  reason: {
    fontSize: 14,
    lineHeight: 20,
  },
  dangerBg: {
    backgroundColor: COLORS.dangerBg,
  },
  dangerText: {
    color: COLORS.dangerText,
  },
  warningBg: {
    backgroundColor: COLORS.warningBg,
  },
  warningText: {
    color: COLORS.warningText,
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