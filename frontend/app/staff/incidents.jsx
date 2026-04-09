import { useEffect, useMemo, useState } from "react";
import { Text, StyleSheet, View, FlatList } from "react-native";
import { router } from "expo-router";
import { INCIDENT_STATUS_FILTERS } from "../../src/constants/incidentFilters";
import { INCIDENT_SORT_OPTIONS } from "../../src/constants/incidentSortOptions";
import IncidentCard from "../../src/components/IncidentCard";
import FormSelect from "../../src/components/FormSelect";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import StaffNavBar from "../../src/components/StaffNavBar";
import PageHeader from "../../src/components/PageHeader";
import { getIncidentsService } from "../../src/services/staffIncidentService";
import { COLORS } from "../../src/constants/theme";

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
    case "Newest First":
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
  }
}

export default function IncidentsScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [searchQuery, setSearchQuery] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setIsLoading(true);
        const data = await getIncidentsService();
        setIncidents(data);
      } catch (error) {
        console.error("Failed to load incidents:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadIncidents();
  }, []);

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = incidents.filter((incident) => {
      const matchesFilter =
        selectedFilter === "All" || incident.status === selectedFilter;

      const incidentType = (
        incident.resolvedIncidentType ||
        incident.incidentType ||
        ""
      ).toLowerCase();
      const location = (incident.resolvedLocationText || "").toLowerCase();
      const trackingCode = (incident.trackingCode || "").toLowerCase();

      const matchesSearch =
        !normalizedQuery ||
        trackingCode.includes(normalizedQuery) ||
        incidentType.includes(normalizedQuery) ||
        location.includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });

    return sortIncidents(filtered, selectedSort);
  }, [incidents, selectedFilter, selectedSort, searchQuery]);

  const handleViewDetails = (incident) => {
    router.push({
      pathname: "/staff/incident-details",
      params: { id: incident.id },
    });
  };

  const listData = filteredIncidents.map((item) => ({
    ...item,
    incidentType: item.resolvedIncidentType || item.incidentType,
    location: item.resolvedLocationText,
    victims: item.victimCount,
    reportedAt: new Date(item.createdAt).toLocaleString(),
  }));

  return (
    <>
      <View style={styles.container}>
        <PageHeader
          eyebrow="Incident Review"
          title="Incoming Reports"
          subtitle="Review newly submitted public emergency reports."
          icon="document-text-outline"
        />

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
            label="Sort By"
            selectedValue={selectedSort}
            onValueChange={setSelectedSort}
            options={INCIDENT_SORT_OPTIONS}
            placeholder="Select sort option"
          />
        </FormSection>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading reports...</Text>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <IncidentCard incident={item} onViewDetails={handleViewDetails} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});