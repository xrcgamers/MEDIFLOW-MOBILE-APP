import { ScrollView, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HomeActionCard from "../src/components/HomeActionCard";
import { COLORS, SPACING, TYPOGRAPHY } from "../src/constants/theme";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient
        colors={["#dbeafe", "#eef2ff", "#f8fafc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.eyebrow}>Mulago A&E Support</Text>
        <Text style={styles.title}>MediFlow</Text>
        <Text style={styles.subtitle}>
          AI and Mobile Enabled Accident & Emergency Management System
        </Text>
      </LinearGradient>

      <View style={styles.cards}>
        <HomeActionCard
          title="Report Emergency"
          description="Submit a new emergency report. Your device location is captured automatically when reporting begins."
          buttonTitle="Start Report"
          onPress={() => router.push("/report")}
          icon="warning-outline"
        />

        <HomeActionCard
          title="Track Existing Report"
          description="Check the progress of a submitted emergency report using a tracking code. Phone number is optional."
          buttonTitle="Track Report"
          onPress={() => router.push("/track")}
          variant="secondary"
          icon="locate-outline"
        />

        <HomeActionCard
          title="Staff Access"
          description="Authorized hospital staff can log in to review incidents, perform triage, and monitor operational resources."
          buttonTitle="Staff Login"
          onPress={() => router.push("/auth/login")}
          variant="secondary"
          icon="shield-checkmark-outline"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  hero: {
    borderRadius: 24,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  cards: {
    marginTop: 4,
  },
});