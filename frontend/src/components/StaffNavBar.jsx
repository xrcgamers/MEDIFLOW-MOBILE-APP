import { View, Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getDefaultStaffRoute } from "../utils/getDefaultStaffRoute";

function buildItems(role) {
  if (role === "EMERGENCY_NURSE") {
    return [
      {
        label: "Home",
        route: "/staff/emergency-nurse",
        icon: "shield-checkmark-outline",
      },
      {
        label: "Queue",
        route: "/staff/incidents",
        icon: "list-outline",
      },
    ];
  }

  if (role === "TRIAGE_NURSE") {
    return [
      {
        label: "Home",
        route: "/staff/triage-nurse",
        icon: "pulse-outline",
      },
      {
        label: "Resources",
        route: "/staff/resources",
        icon: "layers-outline",
      },
    ];
  }

  if (role === "BLOOD_BANK_STAFF") {
    return [
      {
        label: "Home",
        route: "/staff/blood-bank",
        icon: "water-outline",
      },
    ];
  }

  if (role === "IMAGING_STAFF") {
    return [
      {
        label: "Home",
        route: "/staff/imaging",
        icon: "scan-outline",
      },
    ];
  }

  if (role === "THEATRE_STAFF") {
    return [
      {
        label: "Home",
        route: "/staff/theatre",
        icon: "medkit-outline",
      },
    ];
  }

  if (role === "BED_MANAGER") {
    return [
      {
        label: "Home",
        route: "/staff/bed-manager",
        icon: "bed-outline",
      },
    ];
  }

  if (role === "ADMIN") {
  return [
    {
      label: "Admin",
      route: "/admin",
      icon: "grid-outline",
    },
    {
      label: "Emergency",
      route: "/staff/emergency-nurse",
      icon: "shield-checkmark-outline",
    },
    {
      label: "Triage",
      route: "/staff/triage-nurse",
      icon: "pulse-outline",
    },
    {
      label: "Queue",
      route: "/staff/incidents",
      icon: "list-outline",
    },
  ];
}

  return [
    {
      label: "Home",
      route: "/staff",
      icon: "home-outline",
    },
  ];
}

export default function StaffNavBar({ activeRoute }) {
  const { user } = useAuth();
  const { colors, typography } = useAppTheme();

  const defaultHome = getDefaultStaffRoute(user?.role);
  const items = buildItems(user?.role);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {items.map((item) => {
        const resolvedRoute = item.label === "Home" ? defaultHome : item.route;
        const isActive = activeRoute === resolvedRoute || activeRoute === item.route;

        return (
          <Pressable
            key={`${item.label}-${resolvedRoute}`}
            style={styles.item}
            onPress={() => router.push(resolvedRoute)}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={isActive ? colors.primary : colors.textMuted}
            />

            <Text
              style={[
                typography.label,
                {
                  color: isActive ? colors.primary : colors.textMuted,
                  marginTop: 4,
                },
              ]}
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
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingBottom: 14,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
});