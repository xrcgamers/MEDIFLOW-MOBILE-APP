import { Text } from "react-native";
import { router } from "expo-router";
import FormSection from "./FormSection";
import AppButton from "./AppButton";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";

export default function StaffAccountSection() {
  const { user, logout } = useAuth();
  const { colors, typography } = useAppTheme();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <FormSection title="Account Details">
      <Text style={[typography.body, { color: colors.text }]}>
        Name: {user?.name || "Staff User"}
      </Text>

      <Text style={[typography.body, { color: colors.text }]}>
        Account Type: {user?.role || "N/A"}
      </Text>

      <Text style={[typography.body, { color: colors.text }]}>
        Email: {user?.email || "N/A"}
      </Text>

      <AppButton title="Logout" onPress={handleLogout} variant="secondary" />
    </FormSection>
  );
}