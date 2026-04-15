import { ScrollView, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HomeActionCard from "../src/components/HomeActionCard";
import ThemeModeToggle from "../src/components/ThemeModeToggle";
import FormSection from "../src/components/FormSection";
import { useAppTheme } from "../src/context/ThemeContext";

export default function HomeScreen() {
  const { colors, spacing, typography, radius, isDark } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { padding: spacing.xl, backgroundColor: colors.background },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ["#0f172a", "#111827", "#1e293b"]
            : ["#dbeafe", "#eef2ff", "#f8fafc"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.hero,
          {
            borderRadius: 24,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[styles.eyebrow, { color: colors.primary }]}
          maxFontSizeMultiplier={1.4}
        >
          Mulago A&E Support
        </Text>

        <Text
          style={[styles.title, typography.title, { color: colors.text }]}
          maxFontSizeMultiplier={1.3}
        >
          MediFlow
        </Text>

        <Text
          style={[styles.subtitle, typography.body, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.8}
        >
          AI and Mobile Enabled Accident & Emergency Management System
        </Text>
      </LinearGradient>

      <FormSection title="Appearance">
        <ThemeModeToggle />
        <Text
          style={[styles.helperText, typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}
          maxFontSizeMultiplier={1.8}
        >
          Choose the appearance mode you prefer.
        </Text>
      </FormSection>

      <View style={styles.cards}>
        <HomeActionCard
          title="Report Emergency"
          description="Submit a new emergency report. Your device location is captured automatically when reporting begins."
          buttonTitle="Report Emergency"
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
          buttonTitle="Login"
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
    flexGrow: 1,
  },
  hero: {
    borderWidth: 1,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {},
  helperText: {
    lineHeight: 22,
  },
  cards: {
    marginTop: 4,
  },
});