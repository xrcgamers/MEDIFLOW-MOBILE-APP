import { View, Pressable, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

const OPTIONS = ["light", "dark", "system"];

export default function ThemeModeToggle() {
  const { themeMode, setMode, colors, radius, spacing, shadow } = useAppTheme();

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
      accessibilityLabel="Theme mode selector"
    >
      {OPTIONS.map((option) => {
        const active = themeMode === option;

        return (
          <Pressable
            key={option}
            onPress={() => setMode(option)}
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
            accessibilityLabel={`${option} theme`}
          >
            <Text
              style={[
                styles.text,
                { color: active ? colors.text : colors.textMuted },
              ]}
              maxFontSizeMultiplier={1.6}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
});