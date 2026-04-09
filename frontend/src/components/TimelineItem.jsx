import { View, Text, StyleSheet } from "react-native";

export default function TimelineItem({ item, isLast = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.leftColumn}>
        <View
          style={[
            styles.dot,
            item.completed ? styles.doneDot : styles.pendingDot,
          ]}
        />
        {!isLast ? (
          <View
            style={[
              styles.line,
              item.completed ? styles.doneLine : styles.pendingLine,
            ]}
          />
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  leftColumn: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    zIndex: 2,
  },
  doneDot: {
    backgroundColor: "#16a34a",
  },
  pendingDot: {
    backgroundColor: "#9ca3af",
  },
  line: {
    width: 2,
    minHeight: 48,
    marginTop: 2,
  },
  doneLine: {
    backgroundColor: "#86efac",
  },
  pendingLine: {
    backgroundColor: "#d1d5db",
  },
  content: {
    flex: 1,
    paddingBottom: 18,
    paddingLeft: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: "#6b7280",
  },
});