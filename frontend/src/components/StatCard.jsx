import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

function getStatIcon(label) {
  if (label.includes("Reports")) return "document-text-outline";
  if (label.includes("Critical")) return "alert-circle-outline";
  if (label.includes("Beds")) return "bed-outline";
  if (label.includes("Theatres")) return "medkit-outline";
  return "stats-chart-outline";
}

export default function StatCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={getStatIcon(item.label)}
            size={18}
            color={COLORS.primaryDark}
          />
        </View>
        <StatusBadge label={item.status.toUpperCase()} type={item.status} />
      </View>

      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>
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
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  value: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
  },
});