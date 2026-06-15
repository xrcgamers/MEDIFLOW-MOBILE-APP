import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, StyleSheet, View, RefreshControl } from "react-native";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormInput from "../../src/components/FormInput";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import {
  getResourceRequestsService,
  getResourceItemsService,
} from "../../src/services/resourceInventoryService";
import StaffAccountSection from "../../src/components/StaffAccountSection";

function getStatusType(status) {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "LOW":
    case "RESERVED":
      return "warning";
    case "CRITICAL":
    case "INACTIVE":
      return "danger";
    default:
      return "info";
  }
}

function getRequestType(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "APPROVED":
    case "PARTIALLY_ALLOCATED":
    case "RESERVED":
    case "IN_PROGRESS":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "info";
  }
}

export default function ResourcesScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (refresh = false) => {
    if (isAuthLoading) return;

    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const [requestData, itemData] = await Promise.all([
        getResourceRequestsService(),
        getResourceItemsService(),
      ]);

      setRequests(requestData || []);
      setItems(itemData || []);
    } catch (error) {
      showToast({
        title: "Resources Load Failed",
        message: error.message || "Unable to load resources dashboard.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    loadData();
  }, [isAuthLoading]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter((item) =>
      [
        item.patient?.patientCode,
        item.resourceCategory?.name,
        item.requestReason,
        item.requestStatus,
        item.assignedSectionRole,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [requests, search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [
        item.category?.name,
        item.label,
        item.subType,
        item.status,
        item.location,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
      >
        <PageHeader
          eyebrow="Resources"
          title="Resource Overview"
          subtitle="See all requests and inventory across sections."
          icon="layers-outline"
        />

        <FormSection title="Appearance">
          <ThemeModeToggle />
        </FormSection>

        <StaffAccountSection />

        <FormSection title="Search">
          <FormInput
            label="Search Requests and Inventory"
            value={search}
            onChangeText={setSearch}
            placeholder="Search by patient, category, reason, subtype, location..."
          />
        </FormSection>

        <FormSection title="Resource Requests">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>Loading...</Text>
          ) : filteredRequests.length ? (
            filteredRequests.map((item) => (
              <View
                key={item.id}
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
                <View style={styles.headerRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.patient?.patientCode || "Unknown Patient"}
                  </Text>
                  <StatusBadge label={item.requestStatus} type={getRequestType(item.requestStatus)} />
                </View>

                <Text style={[typography.body, { color: colors.text }]}>
                  Category: {item.resourceCategory?.name || "Unknown"}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Section: {item.assignedSectionRole || "Unknown"}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Reason: {item.requestReason}
                </Text>
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Resource Requests"
              message="No resource requests match the current search."
              icon="layers-outline"
            />
          )}
        </FormSection>

        <FormSection title="Inventory">
          {isLoading ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>Loading...</Text>
          ) : filteredItems.length ? (
            filteredItems.map((item) => (
              <View
                key={item.id}
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
                <View style={styles.headerRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.subType || item.label}
                  </Text>
                  <StatusBadge label={item.status} type={getStatusType(item.status)} />
                </View>

                <Text style={[typography.body, { color: colors.text }]}>
                  Category: {item.category?.name || "Unknown"}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Location: {item.location || "N/A"}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Available: {item.availableQuantity ?? "N/A"} {item.unitOfMeasure || ""}
                </Text>
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Inventory Items"
              message="No inventory items match the current search."
              icon="cube-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/resources" />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 110, flexGrow: 1 },
  card: { borderWidth: 1, marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
});