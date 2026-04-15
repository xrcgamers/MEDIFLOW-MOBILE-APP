import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

export default function HistoryItem({ item }) {
  const { colors, radius, spacing } = useAppTheme();

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
      accessibilityLabel={`${item.label} at ${item.time}`}
    >
      <View style={styles.topRow}>
        <Ionicons
          name="time-outline"
          size={18}
          color={colors.primaryDark}
          style={styles.icon}
        />
        <Text
          style={[styles.label, { color: colors.text }]}
          maxFontSizeMultiplier={1.6}
        >
          {item.label}
        </Text>
      </View>

      <Text
        style={[styles.time, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        {item.time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  time: {
    fontSize: 13,
  },
});