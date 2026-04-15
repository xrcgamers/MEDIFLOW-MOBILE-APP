import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function StatusBadge({ label, type = "neutral" }) {
  const { colors, radius } = useAppTheme();

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
        styles.badge,
        {
          backgroundColor: theme.bg,
          borderRadius: radius.pill,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status ${label}`}
    >
      <Text
        style={[styles.label, { color: theme.text }]}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
});