import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "./AppButton";
import { useAppTheme } from "../context/ThemeContext";

export default function HomeActionCard({
  title,
  description,
  buttonTitle,
  onPress,
  variant = "primary",
  icon = "sparkles-outline",
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
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        shadow,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.infoBg }]}>
        <Ionicons name={icon} size={22} color={colors.primaryDark} />
      </View>

      <Text
        style={[styles.title, { color: colors.text }]}
        maxFontSizeMultiplier={1.5}
      >
        {title}
      </Text>

      <Text
        style={[styles.description, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.7}
      >
        {description}
      </Text>

      <AppButton
        title={buttonTitle}
        onPress={onPress}
        variant={variant}
        accessibilityLabel={buttonTitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
});