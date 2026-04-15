import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

export default function ProfileCard({ user }) {
  const { colors, radius, spacing, shadow } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadow,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Profile card for ${user?.name || "staff user"}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.infoBg }]}>
        <Ionicons
          name="person-circle-outline"
          size={42}
          color={colors.primaryDark}
        />
      </View>

      <Text
        style={[styles.name, { color: colors.text }]}
        maxFontSizeMultiplier={1.5}
      >
        {user?.name || "Staff User"}
      </Text>

      <Text
        style={[styles.role, { color: colors.primaryDark }]}
        maxFontSizeMultiplier={1.5}
      >
        {user?.role || "Staff"}
      </Text>

      <Text
        style={[styles.meta, { color: colors.textMuted }]}
        maxFontSizeMultiplier={1.6}
      >
        {user?.email || user?.identifier || "No identifier"}
      </Text>

      {user?.staffId ? (
        <Text
          style={[styles.meta, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.6}
        >
          Staff ID: {user.staffId}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    marginBottom: 2,
  },
});