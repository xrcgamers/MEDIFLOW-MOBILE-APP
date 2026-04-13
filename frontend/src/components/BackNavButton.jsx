import { Pressable, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function BackNavButton({
  label = "Back",
  fallbackRoute = "/",
}) {
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute);
  };

  return (
    <Pressable style={styles.button} onPress={handlePress}>
      <View style={styles.inner}>
        <Ionicons
          name="arrow-back-outline"
          size={18}
          color={COLORS.primaryDark}
          style={styles.icon}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
});