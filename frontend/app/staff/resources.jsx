import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  View,
} from "react-native";
import BackNavButton from "../../src/components/BackNavButton";
import FormSection from "../../src/components/FormSection";
import ResourceCard from "../../src/components/ResourceCard";
import ResourceSummaryCard from "../../src/components/ResourceSummaryCard";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import { getResourcesService } from "../../src/services/resourceService";
import { useLocalSearchParams } from "expo-router";
import { useAppTheme } from "../../src/context/ThemeContext";

function SectionHighlightBanner({ label }) {
  const { colors, radius } = useAppTheme();

  return (
    <View
      style={[
        styles.highlightBanner,
        {
          backgroundColor: colors.infoBg,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
      ]}
    >
      <Text style={[styles.highlightText, { color: colors.primaryDark }]} maxFontSizeMultiplier={1.6}>
        Focused section: {label}
      </Text>
    </View>
  );
}

function getSummaryData(resources) {
  const bedsAvailableItem = resources.beds.find(
    (item) => item.label === "Emergency Beds Available"
  );

  const bedsAvailable = Number(bedsAvailableItem?.value || 0);

  const theatresReady = resources.theatre.filter(
    (item) => item.status === "Ready"
  ).length;

  const lowBloodCount = resources.blood.filter(
    (item) => item.status === "Low" || item.status === "Critical"
  ).length;

  const staffOnDutyCount = resources.staff.filter(
    (item) =>
      item.status === "On Duty" ||
      item.status === "Available" ||
      item.status === "Ready"
  ).length;

  return [
    {
      id: "beds-summary",
      label: "Beds Available",
      value: String(bedsAvailable),
      type: bedsAvailable >= 5 ? "success" : bedsAvailable > 0 ? "warning" : "danger",
      trend:
        bedsAvailable >= 5
          ? "Stable"
          : bedsAvailable > 0
          ? "Low Capacity"
          : "Critical Attention",
    },
    {
      id: "theatres-summary",
      label: "Theatres Ready",
      value: String(theatresReady),
      type: theatresReady >= 2 ? "info" : theatresReady === 1 ? "warning" : "danger",
      trend:
        theatresReady >= 2
          ? "Operational"
          : theatresReady === 1
          ? "Constrained"
          : "Critical Attention",
    },
    {
      id: "blood-summary",
      label: "Low Blood Items",
      value: String(lowBloodCount),
      type: lowBloodCount > 1 ? "danger" : lowBloodCount === 1 ? "warning" : "success",
      trend:
        lowBloodCount > 1
          ? "Critical Attention"
          : lowBloodCount === 1
          ? "Constrained"
          : "Stable",
    },
    {
      id: "staff-summary",
      label: "Staff On Duty",
      value: String(staffOnDutyCount),
      type: staffOnDutyCount >= 3 ? "success" : staffOnDutyCount > 0 ? "warning" : "danger",
      trend:
        staffOnDutyCount >= 3
          ? "Stable"
          : staffOnDutyCount > 0
          ? "Limited Coverage"
          : "Critical Attention",
    },
  ];
}

export default function ResourcesScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const activeSection = params.section || "";

  const [resources, setResources] = useState({
    beds: [],
    theatre: [],
    blood: [],
    staff: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadResources = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getResourcesService();
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources:", error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const sectionLabels = useMemo(
    () => ({
      beds: "Bed Availability",
      theatre: "Theatre Readiness",
      blood: "Blood Status",
      staff: "Staff Coverage",
    }),
    []
  );

  const activeSectionLabel = sectionLabels[activeSection] || "";
  const summaryData = useMemo(() => getSummaryData(resources), [resources]);

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadResources(true)}
          />
        }
      >
        <BackNavButton label="Back to Staff Home" fallbackRoute="/staff" />

        <PageHeader
          eyebrow="Operational Readiness"
          title="Resources Board"
          subtitle="View current operational resource indicators."
          icon="layers-outline"
        />

        {activeSectionLabel ? (
          <SectionHighlightBanner label={activeSectionLabel} />
        ) : null}

        {isLoading ? (
          <Text style={[styles.loadingText, { color: colors.textMuted }]} maxFontSizeMultiplier={1.6}>
            Loading resources...
          </Text>
        ) : (
          <>
            <FormSection title="Resource Summary">
              <View style={styles.summaryWrap}>
                {summaryData.map((item) => (
                  <ResourceSummaryCard
                    key={item.id}
                    label={item.label}
                    value={item.value}
                    type={item.type}
                    trend={item.trend}
                  />
                ))}
              </View>
            </FormSection>

            <FormSection title="Bed Availability">
              {resources.beds.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  onActionComplete={loadResources}
                />
              ))}
            </FormSection>

            <FormSection title="Theatre Readiness">
              {resources.theatre.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  onActionComplete={loadResources}
                />
              ))}
            </FormSection>

            <FormSection title="Blood Status">
              {resources.blood.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  onActionComplete={loadResources}
                />
              ))}
            </FormSection>

            <FormSection title="Staff Coverage">
              {resources.staff.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  onActionComplete={loadResources}
                />
              ))}
            </FormSection>
          </>
        )}
      </ScrollView>

      <StaffNavBar activeRoute="/staff/resources" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 120,
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 14,
    marginBottom: 20,
  },
  highlightBanner: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: "700",
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});