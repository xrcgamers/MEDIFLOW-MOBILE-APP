import { useEffect } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getDefaultStaffRoute } from "../utils/getDefaultStaffRoute";

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user, isLoading } = useAuth();

  const isAllowed = user?.role === "ADMIN" || allowedRoles.includes(user?.role);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (!isAllowed) {
      router.replace(getDefaultStaffRoute(user.role));
    }
  }, [isLoading, user?.role, isAllowed]);

  if (isLoading) return <Text>Loading...</Text>;
  if (!user || !isAllowed) return null;

  return children;
}