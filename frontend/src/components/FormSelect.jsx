import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

export default function FormSelect({
  label,
  selectedValue,
  onValueChange,
  options = [],
  placeholder = "Select option",
  error,
}) {
  const { colors, radius, spacing, shadow } = useAppTheme();
  const [open, setOpen] = useState(false);

  const displayValue =
    selectedValue && selectedValue.length > 0 ? selectedValue : placeholder;

  const handleSelect = (value) => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text
          style={[styles.label, { color: colors.text }]}
          maxFontSizeMultiplier={1.6}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: error ? colors.dangerText : colors.border,
            borderRadius: radius.md,
            minHeight: 48,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label || "Select field"}
        accessibilityState={{ expanded: open }}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color:
                selectedValue && selectedValue.length > 0
                  ? colors.text
                  : colors.textMuted,
            },
          ]}
          maxFontSizeMultiplier={1.6}
        >
          {displayValue}
        </Text>

        <Ionicons
          name={open ? "chevron-up-outline" : "chevron-down-outline"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
            shadow,
          ]}
        >
          {options.map((option) => {
            const optionLabel =
              typeof option === "string" ? option : option.label || option.value;
            const optionValue =
              typeof option === "string" ? option : option.value;

            const active = selectedValue === optionValue;

            return (
              <Pressable
                key={optionValue}
                onPress={() => handleSelect(optionValue)}
                style={[
                  styles.option,
                  {
                    backgroundColor: active ? colors.infoBg : "transparent",
                    minHeight: 44,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={optionLabel}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: active ? colors.primaryDark : colors.text,
                    },
                  ]}
                  maxFontSizeMultiplier={1.6}
                >
                  {optionLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <Text
          style={[styles.error, { color: colors.dangerText }]}
          maxFontSizeMultiplier={1.6}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  trigger: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  menu: {
    marginTop: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
});