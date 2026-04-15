import { View, Text, TextInput, StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  editable = true,
  secureTextEntry = false,
  keyboardType = "default",
}) {
  const { colors, radius, spacing } = useAppTheme();

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

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={editable}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surfaceMuted,
            borderColor: error ? colors.dangerText : colors.border,
            borderRadius: radius.md,
            minHeight: multiline ? 110 : 48,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
        accessibilityLabel={label || placeholder || "Input field"}
        accessibilityHint={error ? error : undefined}
        maxFontSizeMultiplier={1.8}
      />

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
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
});