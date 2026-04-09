import { View, Text, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";

function getStatusType(status) {
  switch (status) {
    case "Available":
    case "Ready":
    case "Active":
      return "success";
    case "Limited":
    case "Busy":
    case "Low":
      return "warning";
    case "Unavailable":
    case "Critical":
      return "danger";
    default:
      return "neutral";
  }
}

export default function ResourceCard({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>
      <StatusBadge label={item.status} type={getStatusType(item.status)} />
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
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 6,
  },
});