import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function SummaryPill({
  label,
  value,
  type = "neutral",
}) {
  const { colors, radius, spacing } = useAppTheme();

  const theme =
    type === "success"
      ? { bg: colors.successBg, text: colors.successText }
      : type === "warning"
      ? { bg: colors.warningBg, text: colors.warningText }
      : type === "danger"
      ? { bg: colors.dangerBg, text: colors.dangerText }
      : type === "info"
      ? { bg: colors.infoBg, text: colors.infoText }
      : { bg: colors.neutralBg, text: colors.neutralText };

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: theme.bg,
          borderRadius: radius.md,
          marginRight: spacing.sm,
          marginBottom: spacing.sm,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text
        style={[styles.label, { color: theme.text }]}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
      <Text
        style={[styles.value, { color: theme.text }]}
        maxFontSizeMultiplier={1.5}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 130,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
});