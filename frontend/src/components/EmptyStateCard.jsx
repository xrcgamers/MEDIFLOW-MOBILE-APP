import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "./AppButton";
import { useAppTheme } from "../context/ThemeContext";

export default function EmptyStateCard({
  title = "Nothing here yet",
  message = "No data is currently available.",
  icon = "folder-open-outline",
  actionLabel,
  onAction,
}) {
  const { colors, radius, spacing, shadow } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        shadow,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.infoBg }]}>
        <Ionicons name={icon} size={28} color={colors.primaryDark} />
      </View>

      <Text
        style={[styles.title, { color: colors.text }]}
        maxFontSizeMultiplier={1.6}
      >
        {title}
      </Text>

      <Text
        style={[styles.message, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.8}
      >
        {message}
      </Text>

      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          accessibilityLabel={actionLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 14,
  },
});