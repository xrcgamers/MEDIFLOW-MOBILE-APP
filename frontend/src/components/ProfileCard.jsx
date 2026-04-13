import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export default function ProfileCard({ user }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="person-circle-outline" size={42} color={COLORS.primaryDark} />
      </View>

      <Text style={styles.name}>{user?.name || "Staff User"}</Text>
      <Text style={styles.role}>{user?.role || "Staff"}</Text>
      <Text style={styles.meta}>{user?.email || user?.identifier || "No identifier"}</Text>
      {user?.staffId ? <Text style={styles.meta}>Staff ID: {user.staffId}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: "center",
    ...SHADOW.card,
  },
  iconWrap: {
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
});