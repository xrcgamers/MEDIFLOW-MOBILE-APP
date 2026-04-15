import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import StaffNavBar from "../../src/components/StaffNavBar";
import BackNavButton from "../../src/components/BackNavButton";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import TextSizeToggle from "../../src/components/TextSizeToggle";
import AccessibilitySwitchRow from "../../src/components/AccessibilitySwitchRow";
import { useAppTheme } from "../../src/context/ThemeContext";

export default function StaffSettingsScreen() {
  const {
    colors,
    resolvedMode,
    themeMode,
    reduceMotionEnabled,
    reduceMotionOverride,
    setReduceMotion,
    systemReduceMotionEnabled,
    textScaleMode,
    textScaleMultiplier,
    highContrastEnabled,
    setHighContrast,
    radius,
    spacing,
    shadow,
  } = useAppTheme();

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background, padding: spacing.lg, paddingBottom: 120 },
        ]}
      >
        <BackNavButton label="Back to Staff Home" fallbackRoute="/staff" />

        <PageHeader
          eyebrow="Preferences"
          title="Appearance & Accessibility"
          subtitle="Customize how the app looks and behaves for your comfort."
          icon="settings-outline"
        />

        <FormSection title="Appearance">
          <Text
            style={[styles.label, { color: colors.text }]}
            maxFontSizeMultiplier={1.6}
          >
            Theme Preference
          </Text>

          <ThemeModeToggle />

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
              },
              shadow,
            ]}
          >
            <Text
              style={[styles.infoTitle, { color: colors.text }]}
              maxFontSizeMultiplier={1.6}
            >
              Current Preference
            </Text>
            <Text
              style={[styles.infoText, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Selected mode: {themeMode}
            </Text>
            <Text
              style={[styles.infoText, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Active theme: {resolvedMode}
            </Text>
          </View>
        </FormSection>

        <FormSection title="Accessibility">
          <Text
            style={[styles.label, { color: colors.text }]}
            maxFontSizeMultiplier={1.6}
          >
            Text Size
          </Text>

          <TextSizeToggle />

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
                marginBottom: spacing.sm,
              },
              shadow,
            ]}
          >
            <Text
              style={[styles.infoTitle, { color: colors.text }]}
              maxFontSizeMultiplier={1.6}
            >
              Text Scaling
            </Text>
            <Text
              style={[styles.infoText, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Selected size: {textScaleMode}
            </Text>
            <Text
              style={[styles.infoText, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.6}
            >
              Scale multiplier: {textScaleMultiplier.toFixed(2)}x
            </Text>
          </View>

          <AccessibilitySwitchRow
            label="High Contrast"
            description="Strengthens borders and text contrast for clearer visibility."
            value={highContrastEnabled}
            onValueChange={setHighContrast}
          />

          <AccessibilitySwitchRow
            label="Reduce Motion"
            description="Minimizes animated effects inside the app."
            value={reduceMotionOverride}
            onValueChange={setReduceMotion}
          />

          <View
            style={[
              styles.accessibilityCard,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                marginTop: spacing.sm,
              },
              shadow,
            ]}
          >
            <View style={styles.row}>
              <Ionicons
                name="eye-outline"
                size={18}
                color={colors.primaryDark}
                style={styles.icon}
              />
              <Text
                style={[styles.accessibilityText, { color: colors.text }]}
                maxFontSizeMultiplier={1.8}
              >
                Improved contrast is applied through the selected settings.
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons
                name="resize-outline"
                size={18}
                color={colors.primaryDark}
                style={styles.icon}
              />
              <Text
                style={[styles.accessibilityText, { color: colors.text }]}
                maxFontSizeMultiplier={1.8}
              >
                Larger text mode affects app typography directly.
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons
                name="hand-left-outline"
                size={18}
                color={colors.primaryDark}
                style={styles.icon}
              />
              <Text
                style={[styles.accessibilityText, { color: colors.text }]}
                maxFontSizeMultiplier={1.8}
              >
                Buttons use larger touch targets for easier interaction.
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons
                name="git-compare-outline"
                size={18}
                color={colors.primaryDark}
                style={styles.icon}
              />
              <Text
                style={[styles.accessibilityText, { color: colors.text }]}
                maxFontSizeMultiplier={1.8}
              >
                Device reduce motion: {systemReduceMotionEnabled ? "Enabled" : "Disabled"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons
                name="options-outline"
                size={18}
                color={colors.primaryDark}
                style={styles.icon}
              />
              <Text
                style={[styles.accessibilityText, { color: colors.text }]}
                maxFontSizeMultiplier={1.8}
              >
                Effective reduce motion: {reduceMotionEnabled ? "Enabled" : "Disabled"}
              </Text>
            </View>
          </View>
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/settings" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  infoCard: {
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  accessibilityCard: {
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  accessibilityText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});