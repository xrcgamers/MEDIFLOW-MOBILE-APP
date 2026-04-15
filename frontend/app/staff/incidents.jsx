import { useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { INCIDENT_STATUS_FILTERS } from "../../src/constants/incidentFilters";
import { INCIDENT_SORT_OPTIONS } from "../../src/constants/incidentSortOptions";
import { INCIDENT_PRIORITY_FILTERS } from "../../src/constants/incidentPriorityFilters";
import IncidentCard from "../../src/components/IncidentCard";
import FormSelect from "../../src/components/FormSelect";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import { getIncidentsService } from "../../src/services/staffIncidentService";
import { API_ROOT_URL } from "../../src/config/api";
import { computeIncidentPriority } from "../../src/utils/priority";
import { useAppTheme } from "../../src/context/ThemeContext";

const AUTO_REFRESH_INTERVAL = 15000;
const NEW_REPORT_BANNER_DURATION = 5000;

function enrichIncident(item) {
  const firstMedia = item.mediaAttachments?.[0];
  const latestTriage = item.triageAssessments?.[0];
  const priority = computeIncidentPriority(item, latestTriage);

  return {
    ...item,
    incidentType: item.resolvedIncidentType || item.incidentType,
    location: item.resolvedLocationText,
    victims: item.victimCount,
    reportedAt: new Date(item.createdAt).toLocaleString(),
    mediaCount: item.mediaCount || 0,
    evidenceImageUrl: firstMedia ? `${API_ROOT_URL}${firstMedia.filePath}` : null,
    triageUrgency: latestTriage?.urgency || null,
    priorityLevel: priority.level,
    priorityScore: priority.score,
  };
}

function sortIncidents(incidents, sortOption) {
  const sorted = [...incidents];

  switch (sortOption) {
    case "Oldest First":
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case "Highest Victims":
      return sorted.sort((a, b) => b.victimCount - a.victimCount);
    case "Lowest Victims":
      return sorted.sort((a, b) => a.victimCount - b.victimCount);
    case "Highest Priority":
      return sorted.sort((a, b) => {
        if ((b.priorityScore || 0) !== (a.priorityScore || 0)) {
          return (b.priorityScore || 0) - (a.priorityScore || 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    case "Lowest Priority":
      return sorted.sort((a, b) => {
        if ((a.priorityScore || 0) !== (b.priorityScore || 0)) {
          return (a.priorityScore || 0) - (b.priorityScore || 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    case "Newest First":
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export default function IncidentsScreen() {
  const { colors, spacing, typography, radius } = useAppTheme();
  const params = useLocalSearchParams();

  const [selectedFilter, setSelectedFilter] = useState(params.status || "All");
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [selectedPriority, setSelectedPriority] = useState(params.priority || "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showNewReportBanner, setShowNewReportBanner] = useState(false);
  const [newReportCount, setNewReportCount] = useState(0);
  const [activeTriageUrgencyFilter, setActiveTriageUrgencyFilter] = useState(
    params.triageUrgency || ""
  );

  const previousCountRef = useRef(0);
  const bannerTimeoutRef = useRef(null);

  const loadIncidents = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading((prev) => (incidents.length === 0 ? true : prev));
      }

      const data = await getIncidentsService();

      if (previousCountRef.current > 0 && data.length > previousCountRef.current) {
        const difference = data.length - previousCountRef.current;
        setNewReportCount(difference);
        setShowNewReportBanner(true);

        if (bannerTimeoutRef.current) {
          clearTimeout(bannerTimeoutRef.current);
        }

        bannerTimeoutRef.current = setTimeout(() => {
          setShowNewReportBanner(false);
          setNewReportCount(0);
        }, NEW_REPORT_BANNER_DURATION);
      }

      previousCountRef.current = data.length;
      setIncidents(data);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to load incidents:", error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIncidents();

    const intervalId = setInterval(() => {
      loadIncidents();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalId);
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = incidents
      .map(enrichIncident)
      .filter((incident) => {
        const matchesFilter =
          selectedFilter === "All" || incident.status === selectedFilter;

        const matchesPriority =
          selectedPriority === "All" || incident.priorityLevel === selectedPriority;

        const matchesTriageUrgency =
          !activeTriageUrgencyFilter ||
          incident.triageUrgency === activeTriageUrgencyFilter;

        const incidentType = (incident.incidentType || "").toLowerCase();
        const location = (incident.location || "").toLowerCase();
        const trackingCode = (incident.trackingCode || "").toLowerCase();

        const matchesSearch =
          !normalizedQuery ||
          trackingCode.includes(normalizedQuery) ||
          incidentType.includes(normalizedQuery) ||
          location.includes(normalizedQuery);

        return (
          matchesFilter &&
          matchesPriority &&
          matchesSearch &&
          matchesTriageUrgency
        );
      });

    return sortIncidents(filtered, selectedSort);
  }, [
    incidents,
    selectedFilter,
    selectedSort,
    selectedPriority,
    searchQuery,
    activeTriageUrgencyFilter,
  ]);

  const handleViewDetails = (incident) => {
    router.push({
      pathname: "/staff/incident-details",
      params: { id: incident.id },
    });
  };

  const handleClearFilters = () => {
    setSelectedFilter("All");
    setSelectedPriority("All");
    setActiveTriageUrgencyFilter("");
    setSearchQuery("");
  };

  const bannerLabel =
    newReportCount === 1
      ? "1 new report received"
      : `${newReportCount} new reports received`;

  const hasActiveRouteFilters =
    selectedFilter !== "All" ||
    selectedPriority !== "All" ||
    !!activeTriageUrgencyFilter ||
    !!searchQuery;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={isLoading ? [] : filteredIncidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IncidentCard incident={item} onViewDetails={handleViewDetails} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadIncidents(true)}
            />
          }
          ListHeaderComponent={
            <>
              <BackNavButton label="Back to Staff Home" fallbackRoute="/staff" />

              <PageHeader
                eyebrow="Incident Review"
                title="Incoming Reports"
                subtitle="Review newly submitted public emergency reports."
                icon="document-text-outline"
              />

              <FormSection title="Quick Navigation">
                <View style={styles.quickNavWrap}>
                  {[
                    { label: "Staff Home", icon: "home-outline", route: "/staff" },
                    { label: "Open Triage", icon: "pulse-outline", route: "/staff/triage" },
                    { label: "Resources", icon: "layers-outline", route: "/staff/resources" },
                    { label: "Settings", icon: "settings-outline", route: "/staff/settings" },
                  ].map((item) => (
                    <Pressable
                      key={item.route}
                      style={[
                        styles.quickNavButton,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => router.push(item.route)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={colors.primaryDark}
                        style={styles.quickNavIcon}
                      />
                      <Text
                        style={[
                          typography.label,
                          { color: colors.primaryDark },
                        ]}
                        maxFontSizeMultiplier={1.7}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </FormSection>

              {activeTriageUrgencyFilter ? (
                <View
                  style={[
                    styles.filterBanner,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name="funnel-outline"
                    size={18}
                    color={colors.primaryDark}
                    style={styles.bannerIcon}
                  />
                  <Text
                    style={[typography.body, { color: colors.text }]}
                    maxFontSizeMultiplier={1.8}
                  >
                    Filtered to triage urgency: {activeTriageUrgencyFilter}
                  </Text>
                </View>
              ) : null}

              {showNewReportBanner ? (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: colors.infoBg,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name="notifications"
                    size={18}
                    color={colors.primaryDark}
                    style={styles.bannerIcon}
                  />
                  <Text
                    style={[typography.body, { color: colors.primaryDark, fontWeight: "700" }]}
                    maxFontSizeMultiplier={1.8}
                  >
                    {bannerLabel}
                  </Text>
                </View>
              ) : null}

              <FormSection title="Find Reports">
                <FormInput
                  label="Search"
                  placeholder="Search by tracking code, type, or location"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <FormSelect
                  label="Status Filter"
                  selectedValue={selectedFilter}
                  onValueChange={setSelectedFilter}
                  options={INCIDENT_STATUS_FILTERS}
                  placeholder="Select status"
                />

                <FormSelect
                  label="Priority Filter"
                  selectedValue={selectedPriority}
                  onValueChange={setSelectedPriority}
                  options={INCIDENT_PRIORITY_FILTERS}
                  placeholder="Select priority"
                />

                <FormSelect
                  label="Sort By"
                  selectedValue={selectedSort}
                  onValueChange={setSelectedSort}
                  options={INCIDENT_SORT_OPTIONS}
                  placeholder="Select sort option"
                />

                {hasActiveRouteFilters ? (
                  <Pressable
                    style={[
                      styles.clearButton,
                      {
                        borderRadius: radius.md,
                        backgroundColor: colors.infoBg,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={handleClearFilters}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={colors.primaryDark}
                      style={styles.clearIcon}
                    />
                    <Text
                      style={[typography.label, { color: colors.primaryDark }]}
                      maxFontSizeMultiplier={1.7}
                    >
                      Clear active filters
                    </Text>
                  </Pressable>
                ) : null}
              </FormSection>

              <View style={styles.headerInfo}>
                <Text
                  style={[styles.refreshHint, { color: colors.textMuted }]}
                  maxFontSizeMultiplier={1.7}
                >
                  Auto-refreshes every 15 seconds
                </Text>
                <Text
                  style={[styles.lastRefreshed, { color: colors.textMuted }]}
                  maxFontSizeMultiplier={1.7}
                >
                  Last refreshed:{" "}
                  {lastRefreshed
                    ? lastRefreshed.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "Not yet loaded"}
                </Text>
              </View>

              {isLoading ? (
                <View style={styles.emptyState}>
                  <Text
                    style={[typography.body, { color: colors.textMuted }]}
                    maxFontSizeMultiplier={1.8}
                  >
                    Loading reports...
                  </Text>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Text
                  style={[typography.body, { color: colors.textMuted }]}
                  maxFontSizeMultiplier={1.8}
                >
                  No reports found for the current search or filter.
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      <StaffNavBar activeRoute="/staff/incidents" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 110,
  },
  listContent: {
    paddingBottom: 20,
  },
  quickNavWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickNavButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    minHeight: 44,
  },
  quickNavIcon: {
    marginRight: 6,
  },
  headerInfo: {
    marginBottom: 10,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  filterBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  bannerIcon: {
    marginRight: 8,
  },
  clearButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  clearIcon: {
    marginRight: 6,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  refreshHint: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  lastRefreshed: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 6,
  },
});