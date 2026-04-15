import { Pressable, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import { useAppTheme } from "../context/ThemeContext";

export default function ResourceAlertCard({ item }) {
  const { colors, radius, spacing, shadow } = useAppTheme();

  const handlePress = () => {
    if (!item.route) return;

    router.push({
      pathname: item.route,
      params: item.params || {},
    });
  };

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        shadow,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, value ${item.value}`}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.infoBg },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={18}
            color={colors.primaryDark}
          />
        </View>
        <StatusBadge label={item.status.toUpperCase()} type={item.status} />
      </View>

      <Text
        style={[styles.title, { color: colors.text }]}
        maxFontSizeMultiplier={1.6}
      >
        {item.title}
      </Text>

      <Text
        style={[styles.value, { color: colors.text }]}
        maxFontSizeMultiplier={1.4}
      >
        {item.value}
      </Text>

      <Text
        style={[styles.hint, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        Tap to open related resource section
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
  },
});