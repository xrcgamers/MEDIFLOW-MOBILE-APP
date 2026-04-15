import { useState } from "react";
import { Text, StyleSheet, Alert, View } from "react-native";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import FormSection from "../../src/components/FormSection";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { validateLoginForm } from "../../src/validators/authValidators";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, typography, spacing } = useAppTheme();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async () => {
    const validationErrors = validateLoginForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(form);
      Alert.alert("Login Successful", `Welcome, ${result.user.name}`);
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackNavButton label="Back to Home" fallbackRoute="/" />

      <PageHeader
        eyebrow="Staff Access"
        title="Staff Login"
        subtitle="Authorized hospital staff only."
        icon="shield-checkmark-outline"
      />

      <FormSection title="Appearance">
        <ThemeModeToggle />
      </FormSection>

      <FormSection title="Login Details">
        <FormInput
          label="Staff ID or Email"
          placeholder="Enter staff ID or email"
          value={form.identifier}
          onChangeText={(value) => updateField("identifier", value)}
          error={errors.identifier}
        />

        <FormInput
          label="Password"
          placeholder="Enter password"
          value={form.password}
          onChangeText={(value) => updateField("password", value)}
          error={errors.password}
          secureTextEntry
        />
      </FormSection>

      <FormSection title="Demo Access">
        <Text
          style={[styles.demoText, typography.body, { color: colors.text, marginBottom: spacing.xs }]}
          maxFontSizeMultiplier={1.8}
        >
          Email: staff001@mediflow.ug
        </Text>
        <Text
          style={[styles.demoText, typography.body, { color: colors.text, marginBottom: spacing.xs }]}
          maxFontSizeMultiplier={1.8}
        >
          Staff ID: STAFF001
        </Text>
        <Text
          style={[styles.demoText, typography.body, { color: colors.text }]}
          maxFontSizeMultiplier={1.8}
        >
          Password: Mediflow123
        </Text>
      </FormSection>

      <AppButton
        title={isSubmitting ? "Logging In..." : "Login"}
        onPress={handleLogin}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  demoText: {
    fontWeight: "600",
  },
});