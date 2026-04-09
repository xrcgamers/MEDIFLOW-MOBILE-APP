import { View, Text, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";

export default function ProfileCard({ user }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.meta}>Role: {user.role}</Text>
      <Text style={styles.meta}>Identifier: {user.identifier}</Text>
      <StatusBadge label="ACTIVE SESSION" type="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
});