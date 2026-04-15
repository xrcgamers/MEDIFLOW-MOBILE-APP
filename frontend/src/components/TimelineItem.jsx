import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function TimelineItem({ item, isLast = false }) {
  const { colors, spacing } = useAppTheme();

  return (
    <View
      style={[styles.row, { marginBottom: isLast ? 0 : spacing.md }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${item.label} at ${item.time}`}
    >
      <View style={styles.leftColumn}>
        <View
          style={[styles.dot, { backgroundColor: colors.primaryDark }]}
        />
        {!isLast ? (
          <View
            style={[styles.line, { backgroundColor: colors.border }]}
          />
        ) : null}
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.label, { color: colors.text }]}
          maxFontSizeMultiplier={1.6}
        >
          {item.label}
        </Text>
        <Text
          style={[styles.time, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.6}
        >
          {item.time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftColumn: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 34,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
  },
});