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
import { getIncidentsService } from "../../src/services/staffIncidentService";
import { API_ROOT_URL } from "../../src/config/api";
import { COLORS, RADIUS } from "../../src/constants/theme";
import { computeIncidentPriority } from "../../src/utils/priority";

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
      return sorted.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

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
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
  }
}

export default function IncidentsScreen() {
  const params = useLocalSearchParams();

  const [selectedFilter, setSelectedFilter] = useState(params.status || "All");
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [selectedPriority, setSelectedPriority] = useState(
    params.priority || "All"
  );
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
          selectedPriority === "All" ||
          incident.priorityLevel === selectedPriority;

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
      <View style={styles.container}>
        <PageHeader
          eyebrow="Incident Review"
          title="Incoming Reports"
          subtitle="Review newly submitted public emergency reports."
          icon="document-text-outline"
        />

        {activeTriageUrgencyFilter ? (
          <View style={styles.filterBanner}>
            <Ionicons
              name="funnel-outline"
              size={18}
              color={COLORS.primaryDark}
              style={styles.bannerIcon}
            />
            <Text style={styles.filterBannerText}>
              Filtered to triage urgency: {activeTriageUrgencyFilter}
            </Text>
          </View>
        ) : null}

        {showNewReportBanner ? (
          <View style={styles.banner}>
            <Ionicons
              name="notifications"
              size={18}
              color={COLORS.primaryDark}
              style={styles.bannerIcon}
            />
            <Text style={styles.bannerText}>{bannerLabel}</Text>
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
            <Pressable style={styles.clearButton} onPress={handleClearFilters}>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={COLORS.primaryDark}
                style={styles.clearIcon}
              />
              <Text style={styles.clearText}>Clear active filters</Text>
            </Pressable>
          ) : null}
        </FormSection>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading reports...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredIncidents}
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
              <View style={styles.headerInfo}>
                <Text style={styles.refreshHint}>
                  Auto-refreshes every 15 seconds
                </Text>
                <Text style={styles.lastRefreshed}>
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
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No reports found for the current search or filter.
                </Text>
              </View>
            }
          />
        )}
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
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerInfo: {
    marginBottom: 10,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.infoBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  filterBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  filterBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  clearButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.infoBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearIcon: {
    marginRight: 6,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  refreshHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },
  lastRefreshed: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 6,
  },
});