import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" ? styles.secondaryText : styles.primaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    ...SHADOW.card,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressedButton: {
    transform: [{ scale: 0.985 }],
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  primaryText: {
    color: "#ffffff",
  },
  secondaryText: {
    color: COLORS.secondary,
  },
});