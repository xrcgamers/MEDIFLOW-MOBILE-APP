import { Pressable, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppTheme } from "../context/ThemeContext";

export default function BackNavButton({
  label = "Back",
  fallbackRoute = "/",
}) {
  const { colors, radius, spacing } = useAppTheme();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: radius.md,
          marginBottom: spacing.md,
          minHeight: 44,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.inner}>
        <Ionicons
          name="arrow-back-outline"
          size={18}
          color={colors.primaryDark}
          style={styles.icon}
        />
        <Text
          style={[styles.label, { color: colors.primaryDark }]}
          maxFontSizeMultiplier={1.6}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});