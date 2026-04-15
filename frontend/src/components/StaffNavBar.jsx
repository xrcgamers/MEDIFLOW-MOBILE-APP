import { View, Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { label: "Home", icon: "home-outline", route: "/staff" },
  { label: "Reports", icon: "list-outline", route: "/staff/incidents" },
  { label: "Triage", icon: "pulse-outline", route: "/staff/triage" },
  { label: "Resources", icon: "layers-outline", route: "/staff/resources" },
  { label: "Settings", icon: "settings-outline", route: "/staff/settings" },
];

export default function StaffNavBar({ activeRoute }) {
  const { colors, radius, shadow, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255,255,255,0.92)",
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
        shadow,
      ]}
      accessible
      accessibilityRole="tablist"
      accessibilityLabel="Staff navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = activeRoute === item.route;

        return (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={active ? colors.primaryDark : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.primaryDark : colors.textMuted,
                },
              ]}
              maxFontSizeMultiplier={1.4}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  item: {
    minWidth: 60,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
});