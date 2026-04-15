import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function InfoRow({ label, value }) {
  const { colors, spacing } = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          paddingVertical: spacing.sm,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value || "Not available"}`}
    >
      <Text
        style={[styles.label, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        {label}
      </Text>
      <Text
        style={[styles.value, { color: colors.text }]}
        maxFontSizeMultiplier={1.8}
      >
        {value || "Not available"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 14,
    lineHeight: 21,
  },
});