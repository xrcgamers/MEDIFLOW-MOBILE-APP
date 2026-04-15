import { View, Pressable, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

const OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "extra_large" },
];

export default function TextSizeToggle() {
  const { textScaleMode, setTextScale, colors, radius, spacing, shadow } =
    useAppTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.xs,
        },
        shadow,
      ]}
      accessible
      accessibilityRole="radiogroup"
      accessibilityLabel="Text size selector"
    >
      {OPTIONS.map((option) => {
        const active = textScaleMode === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => setTextScale(option.value)}
            style={[
              styles.option,
              {
                borderRadius: radius.md,
                backgroundColor: active ? colors.surface : "transparent",
                minHeight: 44,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
          >
            <Text
              style={[
                styles.text,
                { color: active ? colors.text : colors.textMuted },
              ]}
              maxFontSizeMultiplier={1.8}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
  },
  option: {
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
});