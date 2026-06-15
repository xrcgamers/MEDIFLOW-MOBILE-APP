import { View } from "react-native";
import { router } from "expo-router";
import AppButton from "./AppButton";
import { useAuth } from "../context/AuthContext";

export default function AdminReturnButton() {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <AppButton
        title="Back to Admin Dashboard"
        onPress={() => router.push("/admin")}
        variant="secondary"
      />
    </View>
  );
}