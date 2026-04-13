import { Pressable, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export default function ResourceAlertCard({ item }) {
  const handlePress = () => {
    if (!item.route) return;

    router.push({
      pathname: item.route,
      params: item.params || {},
    });
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="warning-outline"
            size={18}
            color={COLORS.primaryDark}
          />
        </View>
        <StatusBadge label={item.status.toUpperCase()} type={item.status} />
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.value}>{item.value}</Text>
      <Text style={styles.hint}>Tap to open related resource section</Text>
    </Pressable>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});