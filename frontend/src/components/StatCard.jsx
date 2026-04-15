import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";
import { useAppTheme } from "../context/ThemeContext";

function getStatIcon(label) {
  if (label.includes("Reports")) return "document-text-outline";
  if (label.includes("Critical")) return "alert-circle-outline";
  if (label.includes("High Urgency")) return "pulse-outline";
  if (label.includes("Beds")) return "bed-outline";
  if (label.includes("Theatres")) return "medkit-outline";
  return "stats-chart-outline";
}

export default function StatCard({ item, onPress }) {
  const { colors, radius, spacing, shadow } = useAppTheme();

  const content = (
    <View style={[styles.cardInner, { padding: spacing.md }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.infoBg }]}>
          <Ionicons
            name={getStatIcon(item.label)}
            size={18}
            color={colors.primaryDark}
          />
        </View>
        <StatusBadge label={item.status.toUpperCase()} type={item.status} />
      </View>

      <Text
        style={[styles.label, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        {item.label}
      </Text>
      <Text
        style={[styles.value, { color: colors.text }]}
        maxFontSizeMultiplier={1.4}
      >
        {item.value}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            marginBottom: spacing.sm,
          },
          shadow,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, value ${item.value}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          marginBottom: spacing.sm,
        },
        shadow,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  cardInner: {},
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
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },
  value: {
    fontSize: 30,
    fontWeight: "800",
  },
});