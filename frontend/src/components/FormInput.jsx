import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordField = secureTextEntry && !multiline;
  const shouldHideText = isPasswordField && !isPasswordVisible;

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: error ? colors.dangerText : colors.border,
            borderRadius: radius.md,
            minHeight: multiline ? 110 : 48,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={editable}
          multiline={multiline}
          secureTextEntry={shouldHideText}
          keyboardType={keyboardType}
          style={[
            styles.input,
            {
              color: colors.text,
              minHeight: multiline ? 110 : 48,
              textAlignVertical: multiline ? "top" : "center",
              paddingRight: isPasswordField ? 44 : 14,
            },
          ]}
          accessibilityLabel={label || placeholder || "Input field"}
          accessibilityHint={error ? error : undefined}
          maxFontSizeMultiplier={1.8}
        />

        {isPasswordField ? (
          <Pressable
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.dangerText }]} maxFontSizeMultiplier={1.6}>
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
  inputWrap: {
    borderWidth: 1,
    position: "relative",
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    width: "100%",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
});