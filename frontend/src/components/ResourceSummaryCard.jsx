import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function ResourceSummaryCard({
  label,
  value,
  type = "neutral",
  trend = "",
}) {
  const { colors, radius, spacing } = useAppTheme();

  const backgroundStyle =
    type === "success"
      ? { backgroundColor: colors.successBg, color: colors.successText }
      : type === "warning"
      ? { backgroundColor: colors.warningBg, color: colors.warningText }
      : type === "danger"
      ? { backgroundColor: colors.dangerBg, color: colors.dangerText }
      : type === "info"
      ? { backgroundColor: colors.infoBg, color: colors.infoText }
      : { backgroundColor: colors.neutralBg, color: colors.neutralText };

  return (
    <View
      style={[
        styles.card,
        {
          minWidth: 150,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: radius.md,
          marginRight: spacing.sm,
          marginBottom: spacing.sm,
          backgroundColor: backgroundStyle.backgroundColor,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}, value ${value}${trend ? `, ${trend}` : ""}`}
    >
      <Text
        style={[styles.label, { color: backgroundStyle.color }]}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
      <Text
        style={[styles.value, { color: backgroundStyle.color }]}
        maxFontSizeMultiplier={1.4}
      >
        {value}
      </Text>
      {trend ? (
        <Text
          style={[styles.trend, { color: backgroundStyle.color }]}
          maxFontSizeMultiplier={1.5}
        >
          {trend}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
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
});