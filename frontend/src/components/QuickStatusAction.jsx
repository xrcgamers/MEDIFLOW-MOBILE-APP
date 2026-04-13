import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function QuickStatusAction({
  label,
  active = false,
  onPress,
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.activeChip]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  activeChip: {
    backgroundColor: COLORS.infoBg,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  activeLabel: {
    color: COLORS.primaryDark,
  },
});