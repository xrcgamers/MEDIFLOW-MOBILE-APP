import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import AppButton from "./AppButton";
import { useAppTheme } from "../context/ThemeContext";

function getAlertIcon(level) {
  switch (level) {
    case "danger":
      return "warning-outline";
    case "warning":
      return "alert-outline";
    case "info":
      return "notifications-outline";
    default:
      return "information-circle-outline";
  }
}

export default function AlertCard({ item }) {
  const { colors, radius, spacing, shadow } = useAppTheme();

  const handleNavigate = () => {
    if (!item.actionRoute) return;

    if (item.actionParams) {
      router.push({
        pathname: item.actionRoute,
        params: item.actionParams,
      });
      return;
    }

    router.push(item.actionRoute);
  };

  return (
    <View
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
      accessible
      accessibilityRole="summary"
      accessibilityLabel={item.title}
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Ionicons
            name={getAlertIcon(item.level)}
            size={18}
            color={colors.primaryDark}
            style={styles.icon}
          />
          <Text
            style={[styles.title, { color: colors.text }]}
            maxFontSizeMultiplier={1.5}
          >
            {item.title}
          </Text>
        </View>
        <StatusBadge label={item.level.toUpperCase()} type={item.level} />
      </View>

      <Text
        style={[styles.message, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.7}
      >
        {item.message}
      </Text>

      {item.actionLabel && item.actionRoute ? (
        <AppButton
          title={item.actionLabel}
          onPress={handleNavigate}
          variant="secondary"
          accessibilityLabel={item.actionLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 6,
  },
});