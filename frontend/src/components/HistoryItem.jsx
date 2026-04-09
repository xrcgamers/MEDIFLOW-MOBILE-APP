import { View, Text, StyleSheet } from "react-native";

export default function HistoryItem({ item }) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    marginTop: 5,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  time: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
});