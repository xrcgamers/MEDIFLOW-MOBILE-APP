import { View, Text, StyleSheet } from "react-native";
import AppButton from "./AppButton";
import StatusBadge from "./StatusBadge";
import { useAppTheme } from "../context/ThemeContext";

function getPriorityType(level) {
  switch (level) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Moderate":
      return "info";
    default:
      return "neutral";
  }
}

function getProviderLabel(rawModelOutput) {
  if (rawModelOutput?.engine === "fallback-local-priority-engine") {
    return "Fallback Engine";
  }

  return "OpenAI";
}

export default function AiPriorityCard({
  assessment,
  isAnalyzing,
  onAnalyze,
}) {
  const { colors, radius, spacing, shadow, typography } = useAppTheme();

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
      accessibilityLabel="AI priority analysis"
    >
      <Text
        style={[styles.title, { color: colors.text }]}
        maxFontSizeMultiplier={1.6}
      >
        AI Priority Analysis
      </Text>

      {assessment ? (
        <>
          <View style={styles.badgeRow}>
            <StatusBadge
              label={`${assessment.priorityLevel} (${assessment.confidence}%)`}
              type={getPriorityType(assessment.priorityLevel)}
            />
          </View>

          <Text
            style={[styles.sectionLabel, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Provider
          </Text>
          <Text
            style={[typography.body, { color: colors.text }]}
            maxFontSizeMultiplier={1.8}
          >
            {getProviderLabel(assessment.rawModelOutput)}
          </Text>

          <Text
            style={[styles.sectionLabel, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Key Risk Factors
          </Text>

          {assessment.keyRiskFactors?.map((factor) => (
            <Text
              key={factor}
              style={[typography.body, { color: colors.text }]}
              maxFontSizeMultiplier={1.8}
            >
              • {factor}
            </Text>
          ))}

          <Text
            style={[styles.sectionLabel, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Recommended Next Action
          </Text>

          <Text
            style={[typography.body, { color: colors.text }]}
            maxFontSizeMultiplier={1.8}
          >
            {assessment.recommendedNextAction}
          </Text>

          <Text
            style={[styles.sectionLabel, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Handover Summary
          </Text>

          <Text
            style={[typography.body, { color: colors.text }]}
            maxFontSizeMultiplier={1.8}
          >
            {assessment.handoverSummary}
          </Text>

          <Text
            style={[styles.sectionLabel, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Analysis Basis
          </Text>

          <Text
            style={[typography.body, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.8}
          >
            {assessment.analysisBasis}
          </Text>

          <Text
            style={[styles.sectionLabel, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.5}
          >
            Image Used
          </Text>

          <Text
            style={[typography.body, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.8}
          >
            {assessment.imageUsed ? "Yes" : "No"}
          </Text>
        </>
      ) : (
        <Text
          style={[typography.body, { color: colors.textMuted }]}
          maxFontSizeMultiplier={1.8}
        >
          No AI priority assessment available yet.
        </Text>
      )}

      <AppButton
        title={
          isAnalyzing
            ? "Analyzing..."
            : assessment
            ? "Re-run AI Analysis"
            : "Run AI Analysis"
        }
        onPress={onAnalyze}
        disabled={isAnalyzing}
        loading={isAnalyzing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 12,
    marginBottom: 6,
  },
});