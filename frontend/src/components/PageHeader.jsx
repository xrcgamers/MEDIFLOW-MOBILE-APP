import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon = "sparkles-outline",
}) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={styles.wrap} accessible accessibilityRole="header">
      <View style={styles.topRow}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.primaryDark}
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={[styles.eyebrow, { color: colors.primary }]}
          maxFontSizeMultiplier={1.6}
        >
          {eyebrow}
        </Text>
      </View>

      <Text
        style={[styles.title, typography.title, { color: colors.text }]}
        maxFontSizeMultiplier={1.5}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[styles.subtitle, typography.body, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.8}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {},
});