import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

export default function ThemeModeToggle({ compact = false }) {
  const { mode, setMode, colors, radius, spacing, typography } = useAppTheme();

  const options = [
    { label: "Light", value: "light", icon: "sunny-outline" },
    { label: "Dark", value: "dark", icon: "moon-outline" },
    { label: "System", value: "system", icon: "phone-portrait-outline" },
  ];

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        {options.map((option) => {
          const active = mode === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => setMode(option.value)}
              style={[
                styles.compactButton,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: 18,
                },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={active ? "#ffffff" : colors.text}
              />
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = mode === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            style={[
              styles.button,
              {
                backgroundColor: active ? colors.primary : colors.surfaceMuted,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={active ? "#ffffff" : colors.text}
              style={styles.icon}
            />
            <Text
              style={[
                typography.label,
                { color: active ? "#ffffff" : colors.text },
              ]}
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    borderWidth: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  compactWrap: {
    flexDirection: "row",
    gap: 8,
  },
  compactButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});