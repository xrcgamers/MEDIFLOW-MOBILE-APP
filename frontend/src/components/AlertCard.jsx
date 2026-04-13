import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import AppButton from "./AppButton";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

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
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Ionicons
            name={getAlertIcon(item.level)}
            size={18}
            color={COLORS.primaryDark}
            style={styles.icon}
          />
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <StatusBadge label={item.level.toUpperCase()} type={item.level} />
      </View>

      <Text style={styles.message}>{item.message}</Text>

      {item.actionLabel && item.actionRoute ? (
        <AppButton
          title={item.actionLabel}
          onPress={handleNavigate}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  topRow: {
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 6,
  },
});