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
import AppButton from "../../src/components/AppButton";
import FormInput from "../../src/components/FormInput";
import FormSelect from "../../src/components/FormSelect";
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
  releaseResourceAllocationService,
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

export default function ImagingScreen() {
  const { isLoading: isAuthLoading } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  const loadData = async (refresh = false) => {
    if (isAuthLoading) return;

    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const [requestData, itemData] = await Promise.all([
        getResourceRequestsService({ assignedSectionRole: "IMAGING_STAFF" }),
        getResourceItemsService({ categoryName: "IMAGING" }),
      ]);

      setRequests(requestData || []);
      setItems(itemData || []);
    } catch (error) {
      showToast({
        title: "Imaging Load Failed",
        message: error.message || "Unable to load imaging dashboard.",
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

  const options = useMemo(
    () =>
      items
        .filter((item) => item.status === "AVAILABLE")
        .map((item) => ({
          label: item.subType || item.label,
          value: item.id,
        })),
    [items]
  );

  const summary = useMemo(
    () => ({
      pending: requests.filter((item) =>
        [
          "REQUESTED",
          "APPROVED",
          "RESERVED",
          "IN_PROGRESS",
          "PARTIALLY_ALLOCATED",
        ].includes(item.requestStatus)
      ).length,
      delayed: requests.filter((item) => item.requestStatus === "DELAYED").length,
      available: items.filter((item) => item.status === "AVAILABLE").length,
      reserved: items.filter((item) => item.status === "RESERVED").length,
    }),
    [requests, items]
  );

  const updateRequest = async (requestId, payload, successTitle, successMessage) => {
    try {
      setIsUpdatingId(requestId);
      await updateResourceRequestService(requestId, payload);

      showToast({
        title: successTitle,
        message: successMessage,
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Update Failed",
        message: error.message || "Unable to update request.",
        type: "error",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleAllocate = async (request) => {
    const resourceItemId = selectedItems[request.id];

    if (!resourceItemId) {
      showToast({
        title: "Select Imaging Unit",
        message: "Choose an imaging unit first.",
        type: "warning",
      });
      return;
    }

    try {
      setIsUpdatingId(request.id);

      await allocateResourceToRequestService(request.id, {
        resourceItemId,
        reservedQuantity: 1,
      });

      showToast({
        title: "Unit Reserved",
        message: "Imaging unit reserved successfully.",
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Reservation Failed",
        message: error.message || "Unable to reserve imaging unit.",
        type: "error",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleComplete = async (request) => {
    const activeAllocations =
      request.allocations?.filter((item) => item.allocationStatus === "ACTIVE") || [];

    try {
      setIsUpdatingId(request.id);

      for (const allocation of activeAllocations) {
        await releaseResourceAllocationService(allocation.id, {
          releaseReason: "Imaging complete",
          restoreStock: true,
        });
      }

      await updateResourceRequestService(request.id, {
        requestStatus: "COMPLETED",
      });

      showToast({
        title: "Completed",
        message: "Imaging request completed.",
        type: "success",
      });

      await loadData(true);
    } catch (error) {
      showToast({
        title: "Completion Failed",
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

    await updateRequest(
      request.id,
      { requestStatus: "REJECTED", rejectionReason },
      "Request Rejected",
      "Imaging request rejected successfully."
    );
  };

  return (
    <RoleGuard allowedRoles={["IMAGING_STAFF"]}>
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
            eyebrow="Imaging"
            title="Imaging Dashboard"
            subtitle="Manage imaging requests and named imaging units."
            icon="scan-outline"
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
                <SummaryCard label="Delayed" value={summary.delayed} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
                <SummaryCard label="Available Units" value={summary.available} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
                <SummaryCard label="Reserved Units" value={summary.reserved} colors={colors} typography={typography} radius={radius} spacing={spacing} shadow={shadow} />
              </View>
            )}
          </FormSection>

          <FormSection title="Imaging Requests">
            {requests.length ? (
              requests.map((request) => {
                const activeAllocations =
                  request.allocations?.filter(
                    (item) => item.allocationStatus === "ACTIVE"
                  ) || [];

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
                      Reason: {request.requestReason}
                    </Text>

                    <Text style={[typography.body, { color: colors.text }]}>
                      Priority: {request.priority || "Not set"}
                    </Text>

                    {request.primaryResourceItem ? (
                      <Text style={[typography.body, { color: colors.text }]}>
                        Assigned Unit:{" "}
                        {request.primaryResourceItem.subType ||
                          request.primaryResourceItem.label}
                      </Text>
                    ) : null}

                    {!isClosed && !activeAllocations.length ? (
                      <>
                        <FormSelect
                          label="Select Imaging Unit"
                          selectedValue={selectedItems[request.id] || ""}
                          onValueChange={(value) =>
                            setSelectedItems((prev) => ({
                              ...prev,
                              [request.id]: value,
                            }))
                          }
                          options={options}
                          placeholder="Choose imaging unit"
                        />

                        <AppButton
                          title={
                            isUpdatingId === request.id
                              ? "Reserving..."
                              : "Reserve Unit"
                          }
                          onPress={() => handleAllocate(request)}
                          disabled={isUpdatingId === request.id}
                        />
                      </>
                    ) : null}

                    {["APPROVED", "RESERVED", "PARTIALLY_ALLOCATED"].includes(
                      request.requestStatus
                    ) && activeAllocations.length ? (
                      <AppButton
                        title={
                          isUpdatingId === request.id
                            ? "Starting..."
                            : "Start Processing"
                        }
                        onPress={() =>
                          updateRequest(
                            request.id,
                            { requestStatus: "IN_PROGRESS" },
                            "Processing Started",
                            "Imaging request is now in progress."
                          )
                        }
                        disabled={isUpdatingId === request.id}
                      />
                    ) : null}

                    {request.requestStatus === "IN_PROGRESS" ? (
                      <AppButton
                        title={
                          isUpdatingId === request.id
                            ? "Completing..."
                            : "Complete & Release"
                        }
                        onPress={() => handleComplete(request)}
                        disabled={isUpdatingId === request.id}
                      />
                    ) : null}

                    {!isClosed ? (
                      <>
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
                title="No Imaging Requests"
                message="No imaging-related requests are waiting right now."
                icon="scan-outline"
              />
            )}
          </FormSection>

          <FormSection title="Imaging Units">
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
                    Label: {item.label}
                  </Text>

                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    Location: {item.location || "Imaging"}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyStateCard
                title="No Imaging Units"
                message="No imaging units are available."
                icon="scan-outline"
              />
            )}
          </FormSection>
        </ScrollView>

        <StaffNavBar activeRoute="/staff/imaging" />
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
      <Text style={[typography.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>
        {value}
      </Text>
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