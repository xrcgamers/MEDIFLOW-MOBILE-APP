import { View, Text, StyleSheet } from "react-native";

export default function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not provided"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4b5563",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
  },
});