import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  RefreshControl,
} from "react-native";
import PageHeader from "../../src/components/PageHeader";
import FormSection from "../../src/components/FormSection";
import FormSelect from "../../src/components/FormSelect";
import AppButton from "../../src/components/AppButton";
import FormInput from "../../src/components/FormInput";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThemeModeToggle from "../../src/components/ThemeModeToggle";
import StaffAccountSection from "../../src/components/StaffAccountSection";
import RoleGuard from "../../src/components/RoleGuard";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import {
  getResourceRequestsService,
  updateResourceRequestService,
  getResourceItemsService,
  allocateResourceToRequestService,
} from "../../src/services/resourceInventoryService";
import ThreadPanel from "../../src/components/ThreadPanel";
import { getResourceRequestThreadUiService } from "../../src/services/communicationService";

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

export default function BedManagerScreen() {
  const { isLoading: isAuthLoading } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [allocationQty, setAllocationQty] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  const loadData = async (refresh = false) => {
    if (isAuthLoading) return;

    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const [requestData, itemData] = await Promise.all([
        getResourceRequestsService({ assignedSectionRole: "BED_MANAGER" }),
        getResourceItemsService({ categoryName: "BED" }),
      ]);

      setRequests(requestData || []);
      setItems(itemData || []);
    } catch (error) {
      showToast({
        title: "Bed Manager Load Failed",
        message: error.message || "Unable to load bed manager dashboard.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) loadData();
  }, [isAuthLoading]);

  const availableItems = useMemo(
    () => items.filter((item) => ["AVAILABLE", "LOW"].includes(item.status)),
    [items]
  );

  const summary = useMemo(
    () => ({
      pending: requests.filter((item) =>
        ["REQUESTED", "APPROVED", "PARTIALLY_ALLOCATED", "RESERVED", "IN_PROGRESS"].includes(
          item.requestStatus
        )
      ).length,
      completed: requests.filter((item) => item.requestStatus === "COMPLETED").length,
      lowPools: items.filter((item) => item.status === "LOW").length,
      criticalPools: items.filter((item) => item.status === "CRITICAL").length,
    }),
    [requests, items]
  );

  const handleAllocate = async (request) => {
    const resourceItemId = selectedItems[request.id];
    const reservedQuantity = Number(allocationQty[request.id] || 0);

    if (!resourceItemId) {
      showToast({
        title: "Select Bed Pool",
        message: "Choose a bed pool first.",
        type: "warning",
      });
      return;
    }

    if (!reservedQuantity || reservedQuantity <= 0) {
      showToast({
        title: "Quantity Required",
        message: "Enter an allocation quantity greater than zero.",
        type: "warning",
      });
      return;
    }

    try {
      setIsUpdatingId(request.id);

      await allocateResourceToRequestService(request.id, {
        resourceItemId,
        reservedQuantity,
      });

      showToast({
        title: "Bed Reserved",
        message: "Bed allocation saved successfully.",
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Allocation Failed",
        message: error.message || "Unable to allocate bed stock.",
        type: "error",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleComplete = async (request) => {
    try {
      setIsUpdatingId(request.id);

      await updateResourceRequestService(request.id, {
        requestStatus: "COMPLETED",
      });

      showToast({
        title: "Request Completed",
        message: "Bed request marked as completed.",
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Complete Failed",
        message: error.message || "Unable to complete request.",
        type: "error",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleReject = async (request) => {
    const rejectionReason = rejectionReasons[request.id]?.trim();

    if (!rejectionReason) {
      showToast({
        title: "Reason Required",
        message: "Enter a rejection reason first.",
        type: "warning",
      });
      return;
    }

    try {
      setIsUpdatingId(request.id);

      await updateResourceRequestService(request.id, {
        requestStatus: "REJECTED",
        rejectionReason,
      });

      showToast({
        title: "Request Rejected",
        message: "Bed request rejected successfully.",
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Rejection Failed",
        message: error.message || "Unable to reject request.",
        type: "error",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={["BED_MANAGER"]}>
      <>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
            />
          }
        >
          <PageHeader
            eyebrow="Bed Management"
            title="Bed Manager Dashboard"
            subtitle="Allocate beds from specific ward pools."
            icon="bed-outline"
          />

          <StaffAccountSection />

          <FormSection title="Appearance">
            <ThemeModeToggle />
          </FormSection>

          <FormSection title="Overview">
            {isLoading ? (
              <Text style={[typography.body, { color: colors.textMuted }]}>
                Loading...
              </Text>
            ) : (
              <View style={styles.summaryWrap}>
                <SummaryCard label="Pending" value={summary.pending} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
                <SummaryCard label="Completed" value={summary.completed} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
                <SummaryCard label="Low Pools" value={summary.lowPools} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
                <SummaryCard label="Critical Pools" value={summary.criticalPools} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              </View>
            )}
          </FormSection>

          <FormSection title="Bed Requests">
            {requests.length ? (
              requests.map((request) => {
                const options = availableItems.map((item) => ({
                  label: `${item.subType || item.label} (${item.availableQuantity ?? 0} ${
                    item.unitOfMeasure || ""
                  })`,
                  value: item.id,
                }));

                const isClosed = ["COMPLETED", "REJECTED", "CANCELLED"].includes(
                  request.requestStatus
                );

                return (
                  <View
                    key={request.id}
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
                        {request.patient?.patientCode || "Unknown Patient"}
                      </Text>
                      <StatusBadge
                        label={request.requestStatus}
                        type={getRequestType(request.requestStatus)}
                      />
                    </View>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Requested: {request.requestedQuantity ?? 0}{" "}
                      {request.unitOfMeasureSnapshot || ""}
                    </Text>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Fulfilled: {request.fulfilledQuantity ?? 0}{" "}
                      {request.unitOfMeasureSnapshot || ""}
                    </Text>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Reason: {request.requestReason}
                    </Text>

                    {request.allocations?.length ? (
                      <View style={styles.allocationBox}>
                        <Text style={[typography.label, { color: colors.text }]}>
                          Allocations
                        </Text>
                        {request.allocations.map((allocation) => (
                          <Text
                            key={allocation.id}
                            style={[typography.body, { color: colors.textMuted }]}
                          >
                            • {allocation.resourceItem?.subType || allocation.resourceItem?.label} —{" "}
                            {allocation.reservedQuantity}
                          </Text>
                        ))}
                      </View>
                    ) : null}

                    {!isClosed ? (
                      <>
                        <FormSelect
                          label="Select Bed Pool"
                          selectedValue={selectedItems[request.id] || ""}
                          onValueChange={(value) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [request.id]: value,
                            }))
                          }
                          options={options}
                          placeholder="Choose bed pool"
                        />

                        <FormInput
                          label="Allocation Quantity"
                          value={allocationQty[request.id] || ""}
                          onChangeText={(value) =>
                            setAllocationQty((prev) => ({
                              ...prev,
                              [request.id]: value,
                            }))
                          }
                          keyboardType="numeric"
                          placeholder="e.g. 1"
                        />

                        <AppButton
                          title={
                            isUpdatingId === request.id
                              ? "Allocating..."
                              : "Allocate / Reserve Bed"
                          }
                          onPress={() => handleAllocate(request)}
                          disabled={isUpdatingId === request.id}
                        />

                        {["RESERVED", "PARTIALLY_ALLOCATED", "IN_PROGRESS"].includes(
                          request.requestStatus
                        ) ? (
                          <AppButton
                            title={
                              isUpdatingId === request.id
                                ? "Completing..."
                                : "Mark Completed"
                            }
                            onPress={() => handleComplete(request)}
                            disabled={isUpdatingId === request.id}
                            variant="secondary"
                          />
                        ) : null}

                        <FormInput
                          label="Rejection Reason"
                          value={rejectionReasons[request.id] || ""}
                          onChangeText={(value) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [request.id]: value,
                            }))
                          }
                          placeholder="Enter reason if unable to process"
                          multiline
                        />

                        <AppButton
                          title={
                            isUpdatingId === request.id
                              ? "Rejecting..."
                              : "Reject Request"
                          }
                          onPress={() => handleReject(request)}
                          disabled={isUpdatingId === request.id}
                          variant="secondary"
                        />
                      </>
                    ) : null}
                    <ThreadPanel
                      title="Resource Request Communication"
                      loadKey={request.id}
                      loadThread={() => getResourceRequestThreadUiService(request.id)}
                    />
                  </View>
                );
              })
            ) : (
              <EmptyStateCard
                title="No Bed Requests"
                message="No bed-related requests are waiting right now."
                icon="bed-outline"
              />
            )}
          </FormSection>

          <FormSection title="Bed Pools">
            {items.length ? (
              items.map((item) => (
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
                    <StatusBadge
                      label={item.status}
                      type={getStatusType(item.status)}
                    />
                  </View>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Available: {item.availableQuantity ?? 0} {item.unitOfMeasure || ""}
                  </Text>

                  <Text style={[typography.body, { color: colors.text }]}>
                    Current: {item.currentQuantity ?? 0} {item.unitOfMeasure || ""}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyStateCard
                title="No Bed Pools"
                message="No bed pools are available."
                icon="bed-outline"
              />
            )}
          </FormSection>
        </ScrollView>

        <StaffNavBar activeRoute="/staff/bed-manager" />
      </>
    </RoleGuard>
  );
}

function SummaryCard({ label, value, colors, typography, radius, spacing, shadow }) {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        shadow,
      ]}
    >
      <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 110,
    flexGrow: 1,
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    borderWidth: 1,
    minWidth: 150,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  allocationBox: {
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});