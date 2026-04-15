import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

export default function PriorityBanner({
  level,
  score,
  reason,
}) {
  const { colors, radius, spacing } = useAppTheme();

  const theme =
    level === "Critical"
      ? { bg: colors.dangerBg, text: colors.dangerText }
      : level === "High"
      ? { bg: colors.warningBg, text: colors.warningText }
      : level === "Moderate"
      ? { bg: colors.infoBg, text: colors.infoText }
      : { bg: colors.neutralBg, text: colors.neutralText };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Priority ${level}, score ${score}`}
    >
      <View style={styles.topRow}>
        <Ionicons
          name="flash-outline"
          size={20}
          color={theme.text}
          style={styles.icon}
        />
        <Text
          style={[styles.title, { color: theme.text }]}
          maxFontSizeMultiplier={1.5}
        >
          Priority: {level}
        </Text>
      </View>

      <Text
        style={[styles.score, { color: theme.text }]}
        maxFontSizeMultiplier={1.6}
      >
        Score: {score}
      </Text>

      <Text
        style={[styles.reason, { color: theme.text }]}
        maxFontSizeMultiplier={1.8}
      >
        {reason}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
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
});