import { View, Text, Switch, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function AccessibilitySwitchRow({
  label,
  description,
  value,
  onValueChange,
}) {
  const { colors, spacing } = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          paddingVertical: spacing.sm,
        },
      ]}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
    >
      <View style={styles.textWrap}>
        <Text
          style={[styles.label, { color: colors.text }]}
          maxFontSizeMultiplier={1.8}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.8}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.border,
          true: colors.primary,
        }}
        thumbColor={value ? colors.primaryDark : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
});