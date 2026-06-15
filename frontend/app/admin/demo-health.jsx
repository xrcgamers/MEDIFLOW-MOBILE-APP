import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import AppButton from "../../src/components/AppButton";
import StatusBadge from "../../src/components/StatusBadge";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import { getDemoHealthService } from "../../src/services/demoHealthService";

export default function DemoHealthScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadHealth = async () => {
    try {
      setIsLoading(true);
      const data = await getDemoHealthService();
      setHealth(data);
    } catch (error) {
      showToast({
        title: "Health Check Failed",
        message: error.message || "Unable to load demo health.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackNavButton label="Back to Admin Dashboard" fallbackRoute="/admin" />

      <PageHeader
        eyebrow="Demo Readiness"
        title="Demo Health"
        subtitle="Quickly verify backend, database, and main record counts."
        icon="speedometer-outline"
      />

      <FormSection title="System Status">
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
        >
          <StatusBadge label={health?.backend || "CHECKING"} type={health ? "success" : "info"} />
          <Text style={[typography.body, { color: colors.text }]}>
            Database: {health?.database || "Checking..."}
          </Text>
        </View>

        <AppButton
          title={isLoading ? "Checking..." : "Refresh Health"}
          onPress={loadHealth}
          loading={isLoading}
          disabled={isLoading}
        />
      </FormSection>

      <FormSection title="Record Counts">
        {health?.counts ? (
          Object.entries(health.counts).map(([key, value]) => (
            <View
              key={key}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                },
              ]}
            >
              <Text style={[typography.label, { color: colors.text }]}>{key}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
            </View>
          ))
        ) : (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            No health data loaded yet.
          </Text>
        )}
      </FormSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  row: {
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 18,
    fontWeight: "800",
  },
});