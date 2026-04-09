import { View, Text, StyleSheet, Switch } from "react-native";

export default function FormSwitch({ label, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
});