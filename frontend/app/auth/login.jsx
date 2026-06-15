import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import AppButton from "../../src/components/AppButton";
import BackNavButton from "../../src/components/BackNavButton";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { getDefaultStaffRoute } from "../../src/utils/getDefaultStaffRoute";

export default function LoginScreen() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { colors } = useAppTheme();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!form.identifier.trim() || !form.password) {
      showToast({
        title: "Missing Login Details",
        message: "Enter your email/staff ID and password.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const loggedInUser = await login({
        identifier: form.identifier.trim(),
        password: form.password,
      });

      const destination =
        loggedInUser?.role === "ADMIN"
          ? "/admin"
          : getDefaultStaffRoute(loggedInUser?.role);

      router.replace(destination);
    } catch (error) {
      showToast({
        title: "Login Failed",
        message: error.message || "Unable to login.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <BackNavButton label="Back to Home" fallbackRoute="/" />

      <PageHeader
        eyebrow="Staff Access"
        title="Login"
        subtitle="Sign in to access your MediFlow dashboard."
        icon="lock-closed-outline"
      />

      <FormSection title="Account Login">
        <FormInput
          label="Email or Staff ID"
          value={form.identifier}
          onChangeText={(value) =>
            setForm((prev) => ({
              ...prev,
              identifier: value,
            }))
          }
          placeholder="Enter email or staff ID"
          autoCapitalize="none"
        />

        <FormInput
          label="Password"
          value={form.password}
          onChangeText={(value) =>
            setForm((prev) => ({
              ...prev,
              password: value,
            }))
          }
          placeholder="Enter password"
          secureTextEntry
        />

        <AppButton
          title={isSubmitting ? "Signing In..." : "Login"}
          onPress={handleLogin}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </FormSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
});