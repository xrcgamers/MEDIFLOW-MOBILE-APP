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

export default function BloodBankScreen() {
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
        getResourceRequestsService({ assignedSectionRole: "BLOOD_BANK_STAFF" }),
        getResourceItemsService({ categoryName: "BLOOD" }),
      ]);

      setRequests(requestData || []);
      setItems(itemData || []);
    } catch (error) {
      showToast({
        title: "Blood Bank Load Failed",
        message: error.message || "Unable to load blood bank dashboard.",
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
      lowStock: items.filter((item) => item.status === "LOW").length,
      criticalStock: items.filter((item) => item.status === "CRITICAL").length,
    }),
    [requests, items]
  );

  const handleAllocate = async (request) => {
    const resourceItemId = selectedItems[request.id];
    const reservedQuantity = Number(allocationQty[request.id] || 0);

    if (!resourceItemId) {
      showToast({
        title: "Select Blood Stock",
        message: "Choose a stock entry first.",
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
        title: "Blood Allocated",
        message: "Blood stock allocated successfully.",
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Allocation Failed",
        message: error.message || "Unable to allocate blood stock.",
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
        message: "Blood request marked as completed.",
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
        message: "Blood request rejected successfully.",
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
    <RoleGuard allowedRoles={["BLOOD_BANK_STAFF"]}>
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
            eyebrow="Blood Bank"
            title="Blood Bank Dashboard"
            subtitle="Allocate blood stock from specific stock entries."
            icon="water-outline"
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
                <SummaryCard label="Low Stock" value={summary.lowStock} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
                <SummaryCard label="Critical Stock" value={summary.criticalStock} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              </View>
            )}
          </FormSection>

          <FormSection title="Blood Requests">
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
                          label="Select Blood Stock Entry"
                          selectedValue={selectedItems[request.id] || ""}
                          onValueChange={(value) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [request.id]: value,
                            }))
                          }
                          options={options}
                          placeholder="Choose stock entry"
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
                          placeholder="e.g. 2"
                        />

                        <AppButton
                          title={
                            isUpdatingId === request.id
                              ? "Allocating..."
                              : "Allocate Blood"
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
                  </View>
                );
              })
            ) : (
              <EmptyStateCard
                title="No Blood Requests"
                message="No blood-related requests are waiting right now."
                icon="water-outline"
              />
            )}
          </FormSection>

          <FormSection title="Blood Stock Entries">
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

                  {item.location ? (
                    <Text style={[typography.body, { color: colors.textMuted }]}>
                      Location: {item.location}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <EmptyStateCard
                title="No Blood Stock"
                message="No blood stock entries are available."
                icon="water-outline"
              />
            )}
          </FormSection>
        </ScrollView>

        <StaffNavBar activeRoute="/staff/blood-bank" />
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