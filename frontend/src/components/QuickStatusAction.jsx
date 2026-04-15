import { Pressable, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function QuickStatusAction({
  label,
  active = false,
  onPress,
}) {
  const { colors, radius, spacing } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          backgroundColor: active ? colors.infoBg : colors.surfaceMuted,
          borderColor: active ? colors.primary : colors.border,
          marginRight: spacing.sm,
          marginBottom: spacing.sm,
          minHeight: 44,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? colors.primaryDark : colors.textMuted,
          },
        ]}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
});