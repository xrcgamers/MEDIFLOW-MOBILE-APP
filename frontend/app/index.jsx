import { ScrollView, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HomeActionCard from "../src/components/HomeActionCard";
import ThemeModeToggle from "../src/components/ThemeModeToggle";
import FormSection from "../src/components/FormSection";
import PageHeader from "../src/components/PageHeader";
import { useAppTheme } from "../src/context/ThemeContext";

export default function HomeScreen() {
  const { colors, spacing, typography, radius, isDark, shadow } = useAppTheme();

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
            borderRadius: radius.xl || 24,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            borderColor: colors.border,
          },
          shadow,
        ]}
      >
        <Text
          style={[styles.eyebrow, { color: colors.primary }]}
          maxFontSizeMultiplier={1.4}
        >
          Mulago A&amp;E Support
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
          AI and mobile enabled accident and emergency management system for
          reporting, triage, coordination, and resource handling.
        </Text>
      </LinearGradient>

      <PageHeader
        eyebrow="Public Access"
        title="Emergency Access"
        subtitle="Choose what you want to do."
        icon="home-outline"
      />

      <FormSection title="Appearance">
        <ThemeModeToggle />
        <Text
          style={[
            styles.helperText,
            typography.body,
            { color: colors.textMuted, marginTop: spacing.sm },
          ]}
          maxFontSizeMultiplier={1.8}
        >
          Choose the appearance mode you prefer.
        </Text>
      </FormSection>

      <View style={styles.cards}>
        <HomeActionCard
          title="Report Emergency"
          description="Submit a new emergency report. Incident type, location, notes, and media can be captured for faster hospital review."
          buttonTitle="Report Emergency"
          onPress={() => router.push("/report-emergency")}
          icon="warning-outline"
        />

        <HomeActionCard
          title="Track Existing Report"
          description="Track an emergency report using its tracking code and see the latest public progress."
          buttonTitle="Track Report"
          onPress={() => router.push("/track-report")}
          variant="secondary"
          icon="locate-outline"
        />

        <HomeActionCard
          title="Staff Access"
          description="Hospital staff can sign in to manage incidents, triage patients, communicate across sections, and handle resources."
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