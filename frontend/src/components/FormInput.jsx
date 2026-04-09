import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType = "default",
  editable = true,
}) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        style={[
          styles.input,
          multiline ? styles.textArea : null,
          !editable ? styles.readOnlyInput : null,
          error ? styles.errorInput : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={editable}
      />

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
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    backgroundColor: COLORS.surfaceMuted,
    color: COLORS.textMuted,
  },
  errorInput: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#dc2626",
    marginTop: 6,
    ...TYPOGRAPHY.small,
  },
});