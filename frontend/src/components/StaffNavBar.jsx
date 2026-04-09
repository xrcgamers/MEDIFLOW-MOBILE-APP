import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";

const NAV_ITEMS = [
  { label: "Home", route: "/staff", icon: "home-outline", activeIcon: "home" },
  {
    label: "Reports",
    route: "/staff/incidents",
    icon: "document-text-outline",
    activeIcon: "document-text",
  },
  {
    label: "Triage",
    route: "/staff/triage",
    icon: "pulse-outline",
    activeIcon: "pulse",
  },
  {
    label: "Resources",
    route: "/staff/resources",
    icon: "layers-outline",
    activeIcon: "layers",
  },
];

export default function StaffNavBar({ activeRoute }) {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <BlurView intensity={55} tint="light" style={styles.blurContainer}>
        <View style={styles.inner}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.route;

            return (
              <Pressable
                key={item.route}
                style={[styles.item, isActive && styles.activeItem]}
                onPress={() => router.push(item.route)}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={18}
                  color={isActive ? COLORS.primaryDark : COLORS.textMuted}
                  style={styles.icon}
                />
                <Text style={[styles.label, isActive && styles.activeLabel]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    zIndex: 50,
  },
  blurContainer: {
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    ...SHADOW.card,
  },
  inner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  activeItem: {
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  activeLabel: {
    color: COLORS.primaryDark,
  },
});