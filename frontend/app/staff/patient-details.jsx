import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Pressable,
  RefreshControl,
} from "react-native";
import PageHeader from "../../src/components/PageHeader";
import BackNavButton from "../../src/components/BackNavButton";
import FormSection from "../../src/components/FormSection";
import AppButton from "../../src/components/AppButton";
import FormInput from "../../src/components/FormInput";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThreadPanel from "../../src/components/ThreadPanel";
import {
  getPatientByIdService,
  createPatientTriageService,
  createPatientResourceRequestService,
  getResourceCategoriesService,
} from "../../src/services/staffIncidentService";
import {
  getPatientThreadUiService,
  getResourceRequestThreadUiService,
} from "../../src/services/communicationService";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import AdminReturnButton from "../../src/components/AdminReturnButton";

function getPriorityType(level) {
  switch (level) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MODERATE":
      return "info";
    default:
      return "neutral";
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
    case "REQUESTED":
    case "DELAYED":
    default:
      return "info";
  }
}

function getCategoryBadgeType(categoryName) {
  switch (categoryName) {
    case "BLOOD":
      return "danger";
    case "IMAGING":
      return "info";
    case "THEATRE":
      return "warning";
    case "BED":
      return "success";
    default:
      return "neutral";
  }
}

function buildSectionProgress(resourceRequests = []) {
  const categories = ["BLOOD", "IMAGING", "THEATRE", "BED"];

  return categories
    .map((category) => {
      const matches = resourceRequests.filter(
        (item) => item.resourceCategory?.name === category
      );

      if (!matches.length) return null;

      const completed = matches.some((item) => item.requestStatus === "COMPLETED");
      const inProgress = matches.some((item) =>
        ["APPROVED", "PARTIALLY_ALLOCATED", "RESERVED", "IN_PROGRESS"].includes(
          item.requestStatus
        )
      );
      const rejected = matches.every((item) =>
        ["REJECTED", "CANCELLED"].includes(item.requestStatus)
      );

      let label = `${category} REQUESTED`;
      let type = getCategoryBadgeType(category);

      if (completed) {
        label = `${category} COMPLETE`;
        type = "success";
      } else if (inProgress) {
        label = `${category} IN PROGRESS`;
        type = "warning";
      } else if (rejected) {
        label = `${category} REJECTED`;
        type = "danger";
      }

      return { category, label, type };
    })
    .filter(Boolean);
}

function getIncidentContextLabel(incident) {
  if (!incident) return "No incident context";
  if (incident.subIncidentType) {
    return `${incident.incidentType || "Incident"} • ${incident.subIncidentType}`;
  }
  return incident.incidentType || "Incident context available";
}

function SearchableCategoryPicker({
  label,
  searchValue,
  onChangeSearch,
  options,
  onSelect,
  selectedLabel,
  colors,
  typography,
  radius,
}) {
  const filtered = useMemo(() => {
    const q = (searchValue || "").trim().toLowerCase();
    if (!q) return options.slice(0, 12);

    return options
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [options, searchValue]);

  return (
    <View style={{ marginBottom: 12 }}>
      <FormInput
        label={label}
        value={searchValue}
        onChangeText={onChangeSearch}
        placeholder="Search resource category"
      />

      {!!filtered.length && (
        <View
          style={[
            styles.suggestionBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          {filtered.map((item, index) => (
            <Pressable
              key={item.value}
              onPress={() => onSelect(item)}
              style={[
                styles.suggestionItem,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index === filtered.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={[typography.body, { color: colors.text }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!!selectedLabel && (
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 6 }]}>
          Selected Category: {selectedLabel}
        </Text>
      )}
    </View>
  );
}

export default function PatientDetailsScreen() {
  const { patientId } = useLocalSearchParams();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [patient, setPatient] = useState(null);
  const [resourceCategories, setResourceCategories] = useState([]);
  const [resourceCategorySearch, setResourceCategorySearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [triageForm, setTriageForm] = useState({
    unconscious: false,
    notBreathingNormally: false,
    severeBleeding: false,
    multipleVictimsContext: false,
    painScore: "",
    note: "",
  });
  const [isSubmittingTriage, setIsSubmittingTriage] = useState(false);

  const [resourceForm, setResourceForm] = useState({
    resourceCategoryId: "",
    priority: "",
    requestReason: "",
    requestedQuantity: "",
    approvedQuantity: "",
    unitOfMeasureSnapshot: "",
  });
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);

  const loadPatient = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [patientData, categories] = await Promise.all([
        getPatientByIdService(patientId),
        getResourceCategoriesService(),
      ]);

      setPatient(patientData);
      setResourceCategories(categories || []);
    } catch (error) {
      showToast({
        title: "Patient Load Failed",
        message: error.message || "Unable to load patient details.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (patientId) loadPatient();
  }, [patientId]);

  const latestTriage = useMemo(() => patient?.triages?.[0] || null, [patient]);

  const sectionProgress = useMemo(
    () => buildSectionProgress(patient?.resourceRequests || []),
    [patient]
  );

  const resourceCategoryOptions = useMemo(
    () =>
      (resourceCategories || []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [resourceCategories]
  );

  const selectedCategoryLabel = useMemo(() => {
    return (
      resourceCategoryOptions.find(
        (item) => item.value === resourceForm.resourceCategoryId
      )?.label || ""
    );
  }, [resourceCategoryOptions, resourceForm.resourceCategoryId]);

  const selectedCategory = useMemo(
    () => resourceCategories.find((item) => item.id === resourceForm.resourceCategoryId),
    [resourceCategories, resourceForm.resourceCategoryId]
  );

  const isPooledCategory = ["BLOOD", "BED"].includes(selectedCategory?.name);

  const handleToggleBoolean = (key) => {
    setTriageForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmitTriage = async () => {
    try {
      setIsSubmittingTriage(true);

      await createPatientTriageService(patientId, {
        unconscious: triageForm.unconscious,
        notBreathingNormally: triageForm.notBreathingNormally,
        severeBleeding: triageForm.severeBleeding,
        multipleVictimsContext: triageForm.multipleVictimsContext,
        painScore: triageForm.painScore === "" ? null : Number(triageForm.painScore),
        note: triageForm.note.trim(),
      });

      showToast({
        title: "Triage Saved",
        message: "Patient triage saved successfully.",
        type: "success",
      });

      setTriageForm({
        unconscious: false,
        notBreathingNormally: false,
        severeBleeding: false,
        multipleVictimsContext: false,
        painScore: "",
        note: "",
      });

      await loadPatient(true);
    } catch (error) {
      showToast({
        title: "Triage Failed",
        message: error.message || "Unable to save triage.",
        type: "error",
      });
    } finally {
      setIsSubmittingTriage(false);
    }
  };

  const handleSubmitResourceRequest = async () => {
    if (!resourceForm.resourceCategoryId || !resourceForm.requestReason.trim()) {
      showToast({
        title: "Missing Resource Data",
        message: "Select a resource category and enter a reason.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmittingResource(true);

      await createPatientResourceRequestService(patientId, {
        resourceCategoryId: resourceForm.resourceCategoryId,
        priority: resourceForm.priority || null,
        requestReason: resourceForm.requestReason.trim(),
        requestedQuantity:
          resourceForm.requestedQuantity === ""
            ? null
            : Number(resourceForm.requestedQuantity),
        approvedQuantity:
          resourceForm.approvedQuantity === ""
            ? null
            : Number(resourceForm.approvedQuantity),
        unitOfMeasureSnapshot: resourceForm.unitOfMeasureSnapshot.trim() || null,
      });

      showToast({
        title: "Resource Requested",
        message: "Resource request created and routed automatically.",
        type: "success",
      });

      setResourceForm({
        resourceCategoryId: "",
        priority: "",
        requestReason: "",
        requestedQuantity: "",
        approvedQuantity: "",
        unitOfMeasureSnapshot: "",
      });
      setResourceCategorySearch("");

      await loadPatient(true);
    } catch (error) {
      showToast({
        title: "Request Failed",
        message: error.message || "Unable to create resource request.",
        type: "error",
      });
    } finally {
      setIsSubmittingResource(false);
    }
  };

  if (isLoading && !patient) {
    return (
      <>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        >
          <BackNavButton label="Back to Incident" fallbackRoute="/staff/incidents" />
          <PageHeader
            eyebrow="Patient Coordination"
            title="Patient Details"
            subtitle="Loading patient details..."
            icon="person-outline"
          />
          
          <AdminReturnButton />

        </ScrollView>
        <StaffNavBar activeRoute="/staff/incidents" />
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        >
          <BackNavButton label="Back to Incident" fallbackRoute="/staff/incidents" />
          <PageHeader
            eyebrow="Patient Coordination"
            title="Patient Details"
            subtitle="Patient details are unavailable."
            icon="person-outline"
          />
          <EmptyStateCard
            title="Patient Not Found"
            message="This patient record could not be loaded."
            icon="person-outline"
            actionLabel="Retry"
            onAction={() => loadPatient(true)}
          />
        </ScrollView>
        <StaffNavBar activeRoute="/staff/incidents" />
      </>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadPatient(true)} />}
      >
        <BackNavButton
          label="Back to Incident"
          fallbackRoute={`/staff/incident-details?id=${patient.incidentId}`}
        />

        <PageHeader
          eyebrow="Patient Coordination"
          title={patient.patientCode}
          subtitle={`Linked to incident ${patient.incident?.trackingCode || ""}`}
          icon="person-outline"
        />

        <FormSection title="Patient Summary">
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
            <Text style={[typography.body, { color: colors.text }]}>
              Status: {patient.status}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Placeholder: {patient.isPlaceholder ? "Yes" : "No"}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Name: {patient.fullName || "Unknown"}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Sex: {patient.sex || "Unknown"}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Estimated Age: {patient.estimatedAge ?? "Unknown"}
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              Incident Context: {getIncidentContextLabel(patient.incident)}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Triage scoring uses both patient symptoms and incident context.
            </Text>

            <View style={styles.badgeRow}>
              {latestTriage ? (
                <StatusBadge
                  label={`TRIAGE ${latestTriage.urgencyLevel}`}
                  type={getPriorityType(latestTriage.urgencyLevel)}
                />
              ) : null}

              {sectionProgress.map((item) => (
                <StatusBadge key={item.category} label={item.label} type={item.type} />
              ))}
            </View>

            {latestTriage?.reasons?.length ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Latest Triage Factors:
                </Text>
                {latestTriage.reasons.slice(0, 5).map((reason, index) => (
                  <Text key={`${reason}-${index}`} style={[typography.body, { color: colors.text }]}>
                    • {reason}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        </FormSection>

        <FormSection title="Run Triage">
          <Text style={[typography.body, { color: colors.textMuted, marginBottom: 10 }]}>
            Clinical signs remain primary. Incident type and subtype are added as context.
          </Text>

          <Pressable
            style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => handleToggleBoolean("unconscious")}
          >
            <Text style={[typography.body, { color: colors.text }]}>Unconscious</Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {triageForm.unconscious ? "Yes" : "No"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => handleToggleBoolean("notBreathingNormally")}
          >
            <Text style={[typography.body, { color: colors.text }]}>
              Not Breathing Normally
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {triageForm.notBreathingNormally ? "Yes" : "No"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => handleToggleBoolean("severeBleeding")}
          >
            <Text style={[typography.body, { color: colors.text }]}>Severe Bleeding</Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {triageForm.severeBleeding ? "Yes" : "No"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => handleToggleBoolean("multipleVictimsContext")}
          >
            <Text style={[typography.body, { color: colors.text }]}>
              Multiple Casualty Context
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {triageForm.multipleVictimsContext ? "Yes" : "No"}
            </Text>
          </Pressable>

          <FormInput
            label="Pain Score (0-10)"
            value={triageForm.painScore}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, painScore: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 7"
          />

          <FormInput
            label="Triage Note"
            value={triageForm.note}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, note: value }))
            }
            placeholder="Optional triage note"
            multiline
          />

          <AppButton
            title={isSubmittingTriage ? "Saving Triage..." : "Save Triage"}
            onPress={handleSubmitTriage}
            loading={isSubmittingTriage}
            disabled={isSubmittingTriage}
          />
        </FormSection>

        <FormSection title="Create Resource Request">
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
            <Text style={[typography.body, { color: colors.text }]}>
              Incident Context: {getIncidentContextLabel(patient.incident)}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              This context is also available to AI priority and resource coordination.
            </Text>
          </View>

          <SearchableCategoryPicker
            label="Search Resource Category"
            searchValue={resourceCategorySearch}
            onChangeSearch={(value) => {
              setResourceCategorySearch(value);

              const exact = resourceCategoryOptions.find(
                (item) => item.label.toLowerCase() === value.trim().toLowerCase()
              );

              if (exact) {
                setResourceForm((prev) => ({
                  ...prev,
                  resourceCategoryId: exact.value,
                }));
              }
            }}
            options={resourceCategoryOptions}
            onSelect={(item) => {
              setResourceCategorySearch(item.label);
              setResourceForm((prev) => ({
                ...prev,
                resourceCategoryId: item.value,
              }));
            }}
            selectedLabel={selectedCategoryLabel}
            colors={colors}
            typography={typography}
            radius={radius}
          />

          <FormInput
            label="Priority"
            value={resourceForm.priority}
            onChangeText={(value) =>
              setResourceForm((prev) => ({
                ...prev,
                priority: value,
              }))
            }
            placeholder="LOW, MODERATE, HIGH, or CRITICAL"
          />

          <FormInput
            label="Request Reason"
            value={resourceForm.requestReason}
            onChangeText={(value) =>
              setResourceForm((prev) => ({
                ...prev,
                requestReason: value,
              }))
            }
            placeholder="Explain why this resource is needed"
            multiline
          />

          {isPooledCategory ? (
            <>
              <FormInput
                label="Requested Quantity"
                value={resourceForm.requestedQuantity}
                onChangeText={(value) =>
                  setResourceForm((prev) => ({
                    ...prev,
                    requestedQuantity: value,
                  }))
                }
                keyboardType="numeric"
                placeholder="e.g. 3"
              />
              <FormInput
                label="Approved Quantity"
                value={resourceForm.approvedQuantity}
                onChangeText={(value) =>
                  setResourceForm((prev) => ({
                    ...prev,
                    approvedQuantity: value,
                  }))
                }
                keyboardType="numeric"
                placeholder="e.g. 2"
              />
              <FormInput
                label="Unit of Measure"
                value={resourceForm.unitOfMeasureSnapshot}
                onChangeText={(value) =>
                  setResourceForm((prev) => ({
                    ...prev,
                    unitOfMeasureSnapshot: value,
                  }))
                }
                placeholder="e.g. pints, beds"
              />
            </>
          ) : (
            <FormInput
              label="Unit Note"
              value={resourceForm.unitOfMeasureSnapshot}
              onChangeText={(value) =>
                setResourceForm((prev) => ({
                  ...prev,
                  unitOfMeasureSnapshot: value,
                }))
              }
              placeholder="Optional note for named resource"
            />
          )}

          <Text style={[typography.body, { color: colors.textMuted, marginBottom: 10 }]}>
            The handling section is assigned automatically from the selected resource
            category.
          </Text>

          <AppButton
            title={isSubmittingResource ? "Creating Request..." : "Create Resource Request"}
            onPress={handleSubmitResourceRequest}
            loading={isSubmittingResource}
            disabled={isSubmittingResource}
          />
        </FormSection>

        <ThreadPanel
          title="Patient Communication"
          loadKey={patient?.id}
          loadThread={() => getPatientThreadUiService(patient.id)}
        />

        <FormSection title="Resource Requests">
          {patient.resourceRequests?.length ? (
            patient.resourceRequests.map((request) => (
              <View
                key={request.id}
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                  shadow,
                ]}
              >
                <View style={styles.badgeRow}>
                  <StatusBadge
                    label={request.resourceCategory?.name || "RESOURCE"}
                    type={getCategoryBadgeType(request.resourceCategory?.name)}
                  />
                  <StatusBadge
                    label={request.requestStatus}
                    type={getRequestType(request.requestStatus)}
                  />
                </View>

                <Text style={[typography.body, { color: colors.text }]}>
                  Assigned Section: {request.assignedSectionRole}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Priority: {request.priority || "Not set"}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Reason: {request.requestReason}
                </Text>

                {request.requestedQuantity !== null &&
                request.requestedQuantity !== undefined ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Requested: {request.requestedQuantity}{" "}
                    {request.unitOfMeasureSnapshot || ""}
                  </Text>
                ) : null}

                {request.approvedQuantity !== null &&
                request.approvedQuantity !== undefined ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Approved: {request.approvedQuantity}{" "}
                    {request.unitOfMeasureSnapshot || ""}
                  </Text>
                ) : null}

                <Text style={[typography.body, { color: colors.text }]}>
                  Fulfilled: {request.fulfilledQuantity ?? 0}{" "}
                  {request.unitOfMeasureSnapshot || ""}
                </Text>

                {request.primaryResourceItem ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Named Resource:{" "}
                    {request.primaryResourceItem.subType ||
                      request.primaryResourceItem.label}
                  </Text>
                ) : null}

                {request.allocations?.length ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[typography.body, { color: colors.textMuted }]}>
                      Stock Entries Used:
                    </Text>
                    {request.allocations.map((allocation) => (
                      <Text
                        key={allocation.id}
                        style={[typography.body, { color: colors.text }]}
                      >
                        • {allocation.resourceItem?.subType || allocation.resourceItem?.label} —{" "}
                        {allocation.reservedQuantity ?? 1}{" "}
                        {allocation.unitOfMeasureSnapshot ||
                          request.unitOfMeasureSnapshot ||
                          ""}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {request.rejectionReason ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    Rejection Reason: {request.rejectionReason}
                  </Text>
                ) : null}

                <ThreadPanel
                  title="Resource Request Thread"
                  loadKey={request.id}
                  loadThread={() => getResourceRequestThreadUiService(request.id)}
                />
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Resource Requests"
              message="No resources have been requested for this patient yet."
              icon="layers-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/incidents" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 110,
    flexGrow: 1,
  },
  summaryCard: {
    borderWidth: 1,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  toggleRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestCard: {
    borderWidth: 1,
    marginBottom: 10,
  },
  suggestionBox: {
    borderWidth: 1,
    marginTop: 4,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});