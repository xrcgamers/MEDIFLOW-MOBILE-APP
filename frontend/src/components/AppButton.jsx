import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel,
}) {
  const { colors, radius, shadow } = useAppTheme();

  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.primary : colors.surfaceMuted,
          borderColor: isPrimary ? colors.primary : colors.border,
          borderRadius: radius.lg,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
          minHeight: 48,
        },
        shadow,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#ffffff" : colors.primaryDark} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: isPrimary ? "#ffffff" : colors.primaryDark,
            },
          ]}
          maxFontSizeMultiplier={1.6}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});