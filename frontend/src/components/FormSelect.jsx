import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

export default function FormSelect({
  label,
  selectedValue,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  error,
}) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.pickerWrapper, error ? styles.errorBorder : null]}>
        <Picker selectedValue={selectedValue} onValueChange={onValueChange}>
          <Picker.Item label={placeholder} value="" />
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
  },
  errorBorder: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#dc2626",
    marginTop: 6,
    ...TYPOGRAPHY.small,
  },
});