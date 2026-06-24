import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
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
import FormSelect from "../../src/components/FormSelect";
import EmptyStateCard from "../../src/components/EmptyStateCard";
import StatusBadge from "../../src/components/StatusBadge";
import StaffNavBar from "../../src/components/StaffNavBar";
import ThreadPanel from "../../src/components/ThreadPanel";
import AdminReturnButton from "../../src/components/AdminReturnButton";
import { useAuth } from "../../src/context/AuthContext";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useToast } from "../../src/context/ToastContext";
import {
  getPatientByIdService,
  createPatientTriageService,
  createPatientResourceRequestService,
  getResourceCategoriesService,
  updatePatientService,
  excludePatientFromIncidentService,
  updatePatientOutcomeService,
} from "../../src/services/staffIncidentService";
import {
  claimPatientService,
  releasePatientClaimService,
} from "../../src/services/triageNurseService";
import {
  getPatientThreadUiService,
  getResourceRequestThreadUiService,
} from "../../src/services/communicationService";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Moderate", value: "MODERATE" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

const BLOOD_TYPE_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

const GCS_EYE_OPTIONS = [
  { label: "4 - Spontaneous", value: "4" },
  { label: "3 - To voice", value: "3" },
  { label: "2 - To pain", value: "2" },
  { label: "1 - None", value: "1" },
];

const GCS_VERBAL_OPTIONS = [
  { label: "5 - Oriented", value: "5" },
  { label: "4 - Confused", value: "4" },
  { label: "3 - Inappropriate words", value: "3" },
  { label: "2 - Incomprehensible sounds", value: "2" },
  { label: "1 - None", value: "1" },
];

const GCS_MOTOR_OPTIONS = [
  { label: "6 - Obeys commands", value: "6" },
  { label: "5 - Localizes pain", value: "5" },
  { label: "4 - Withdraws from pain", value: "4" },
  { label: "3 - Abnormal flexion", value: "3" },
  { label: "2 - Extension", value: "2" },
  { label: "1 - None", value: "1" },
];

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

function getPatientStatusType(status) {
  switch (status) {
    case "DISCHARGED":
    case "UNDER_TREATMENT":
      return "success";
    case "DECEASED":
    case "INVALID":
    case "EXCLUDED":
      return "danger";
    case "TRIAGED":
      return "info";
    default:
      return "warning";
  }
}

function getIncidentContextLabel(incident) {
  if (!incident) return "No incident context";
  if (incident.subIncidentType) {
    return `${incident.incidentType || "Incident"} • ${incident.subIncidentType}`;
  }
  return incident.incidentType || "Incident context available";
}

export default function PatientDetailsScreen() {
  const { patientId } = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [patient, setPatient] = useState(null);
  const [resourceCategories, setResourceCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isReleasingClaim, setIsReleasingClaim] = useState(false);
  const [isUpdatingOutcome, setIsUpdatingOutcome] = useState(false);

  const [identityForm, setIdentityForm] = useState({
    fullName: "",
    sex: "",
    estimatedAge: "",
  });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isExcludingPatient, setIsExcludingPatient] = useState(false);

  const [triageForm, setTriageForm] = useState({
    unconscious: false,
    notBreathingNormally: false,
    severeBleeding: false,
    multipleVictimsContext: false,
    airwayCompromised: false,
    cannotWalk: false,
    chestPain: false,
    suspectedStroke: false,
    majorBurn: false,
    seizure: false,
    pregnancyEmergency: false,
    painScore: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    systolicBp: "",
    heartRate: "",
    capillaryRefillSeconds: "",
    eyeOpening: "",
    verbalResponse: "",
    motorResponse: "",
    note: "",
  });

  const [isSubmittingTriage, setIsSubmittingTriage] = useState(false);

  const [resourceForm, setResourceForm] = useState({
    resourceCategoryId: "",
    priority: "MODERATE",
    requestReason: "",
    requestedQuantity: "",
    unitOfMeasureSnapshot: "",
    bloodType: "",
    imagingType: "",
    theatreNeed: "",
    bedType: "",
  });
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);

  const loadPatient = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const [patientData, categories] = await Promise.all([
        getPatientByIdService(patientId),
        getResourceCategoriesService(),
      ]);

      setPatient(patientData);
      setResourceCategories(categories || []);

      setIdentityForm({
        fullName: patientData?.fullName || "",
        sex: patientData?.sex || "",
        estimatedAge:
          patientData?.estimatedAge === null ||
          patientData?.estimatedAge === undefined
            ? ""
            : String(patientData.estimatedAge),
      });
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

  const resourceCategoryOptions = useMemo(
    () =>
      (resourceCategories || []).map((item) => ({
        label: item.name,
        value: item.id,
      })),
    [resourceCategories]
  );

  const selectedCategory = useMemo(
    () => resourceCategories.find((item) => item.id === resourceForm.resourceCategoryId),
    [resourceCategories, resourceForm.resourceCategoryId]
  );

  const selectedCategoryName = selectedCategory?.name || "";
  const assignedToCurrentUser = patient?.assignedTriageNurseId === user?.id;
  const unassigned = !patient?.assignedTriageNurseId;
  const canEdit = user?.role === "ADMIN" || assignedToCurrentUser;

  const handleClaimPatient = async () => {
    try {
      setIsClaiming(true);
      await claimPatientService(patientId);
      showToast({
        title: "Patient Claimed",
        message: "This patient is now assigned to you.",
        type: "success",
      });
      await loadPatient(true);
    } catch (error) {
      showToast({
        title: "Claim Failed",
        message: error.message || "Unable to claim patient.",
        type: "error",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleReleaseClaim = async () => {
    try {
      setIsReleasingClaim(true);
      await releasePatientClaimService(patientId);
      showToast({
        title: "Claim Released",
        message: "Patient returned to the unassigned queue.",
        type: "success",
      });
      await loadPatient(true);
    } catch (error) {
      showToast({
        title: "Release Failed",
        message: error.message || "Unable to release patient claim.",
        type: "error",
      });
    } finally {
      setIsReleasingClaim(false);
    }
  };

  const handleToggleBoolean = (key) => {
    if (!canEdit) return;
    setTriageForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveIdentity = async () => {
    if (!canEdit) return;

    try {
      setIsSavingIdentity(true);
      await updatePatientService(patientId, {
        fullName: identityForm.fullName.trim() || null,
        sex: identityForm.sex.trim() || null,
        estimatedAge:
          identityForm.estimatedAge === "" ? null : Number(identityForm.estimatedAge),
      });

      showToast({
        title: "Patient Updated",
        message: "Patient identity details saved.",
        type: "success",
      });

      await loadPatient(true);
    } catch (error) {
      showToast({
        title: "Update Failed",
        message: error.message || "Unable to update patient.",
        type: "error",
      });
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleExcludePatient = async () => {
    if (!canEdit) return;

    try {
      setIsExcludingPatient(true);

      await excludePatientFromIncidentService(patientId, {
        note: "Removed by triage nurse during patient verification.",
      });

      showToast({
        title: "Patient Removed",
        message: "Patient placeholder removed from active triage queue.",
        type: "success",
      });

      router.replace("/staff/triage-nurse");
    } catch (error) {
      showToast({
        title: "Remove Failed",
        message: error.message || "Unable to remove patient.",
        type: "error",
      });
    } finally {
      setIsExcludingPatient(false);
    }
  };

  const handleOutcome = async (status) => {
    if (!canEdit) return;

    try {
      setIsUpdatingOutcome(true);

      await updatePatientOutcomeService(patientId, {
        status,
        note: `Patient marked as ${status}.`,
      });

      showToast({
        title: "Patient Status Updated",
        message:
          status === "DECEASED" || status === "DISCHARGED" || status === "INVALID"
            ? "Reusable resources were released automatically where applicable."
            : "Patient status updated.",
        type: "success",
      });

      await loadPatient(true);
    } catch (error) {
      showToast({
        title: "Outcome Update Failed",
        message: error.message || "Unable to update patient outcome.",
        type: "error",
      });
    } finally {
      setIsUpdatingOutcome(false);
    }
  };

  const resetTriageForm = () => {
    setTriageForm({
      unconscious: false,
      notBreathingNormally: false,
      severeBleeding: false,
      multipleVictimsContext: false,
      airwayCompromised: false,
      cannotWalk: false,
      chestPain: false,
      suspectedStroke: false,
      majorBurn: false,
      seizure: false,
      pregnancyEmergency: false,
      painScore: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      systolicBp: "",
      heartRate: "",
      capillaryRefillSeconds: "",
      eyeOpening: "",
      verbalResponse: "",
      motorResponse: "",
      note: "",
    });
  };

  const handleSubmitTriage = async () => {
    if (!canEdit) return;

    try {
      setIsSubmittingTriage(true);

      await createPatientTriageService(patientId, {
        unconscious: triageForm.unconscious,
        notBreathingNormally: triageForm.notBreathingNormally,
        severeBleeding: triageForm.severeBleeding,
        multipleVictimsContext: triageForm.multipleVictimsContext,
        airwayCompromised: triageForm.airwayCompromised,
        cannotWalk: triageForm.cannotWalk,
        chestPain: triageForm.chestPain,
        suspectedStroke: triageForm.suspectedStroke,
        majorBurn: triageForm.majorBurn,
        seizure: triageForm.seizure,
        pregnancyEmergency: triageForm.pregnancyEmergency,
        painScore: triageForm.painScore === "" ? null : Number(triageForm.painScore),
        respiratoryRate:
          triageForm.respiratoryRate === ""
            ? null
            : Number(triageForm.respiratoryRate),
        oxygenSaturation:
          triageForm.oxygenSaturation === ""
            ? null
            : Number(triageForm.oxygenSaturation),
        systolicBp:
          triageForm.systolicBp === "" ? null : Number(triageForm.systolicBp),
        heartRate:
          triageForm.heartRate === "" ? null : Number(triageForm.heartRate),
        capillaryRefillSeconds:
          triageForm.capillaryRefillSeconds === ""
            ? null
            : Number(triageForm.capillaryRefillSeconds),
        eyeOpening:
          triageForm.eyeOpening === "" ? null : Number(triageForm.eyeOpening),
        verbalResponse:
          triageForm.verbalResponse === "" ? null : Number(triageForm.verbalResponse),
        motorResponse:
          triageForm.motorResponse === "" ? null : Number(triageForm.motorResponse),
        note: triageForm.note.trim(),
      });

      showToast({
        title: "Triage Saved",
        message: "Rule-based triage assessment saved successfully.",
        type: "success",
      });

      resetTriageForm();
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

  const buildResourceReason = () => {
    const base = resourceForm.requestReason.trim();

    if (selectedCategoryName === "BLOOD") {
      return `${base}\nBlood Type: ${
        resourceForm.bloodType || "Not specified"
      }\nPints Requested: ${resourceForm.requestedQuantity || "Not specified"}`;
    }

    if (selectedCategoryName === "IMAGING") {
      return `${base}\nImaging Type: ${
        resourceForm.imagingType || "Not specified"
      }`;
    }

    if (selectedCategoryName === "THEATRE") {
      return `${base}\nTheatre Need: ${
        resourceForm.theatreNeed || "Not specified"
      }`;
    }

    if (selectedCategoryName === "BED") {
      return `${base}\nBed Type/Ward: ${
        resourceForm.bedType || "Not specified"
      }`;
    }

    return base;
  };

  const handleSubmitResourceRequest = async () => {
    if (!canEdit) return;

    if (!resourceForm.resourceCategoryId || !resourceForm.requestReason.trim()) {
      showToast({
        title: "Missing Resource Data",
        message: "Select a resource category and enter a reason.",
        type: "warning",
      });
      return;
    }

    if (selectedCategoryName === "BLOOD" && !resourceForm.bloodType) {
      showToast({
        title: "Blood Type Required",
        message: "Select the required blood type.",
        type: "warning",
      });
      return;
    }

    if (
      ["BLOOD", "BED"].includes(selectedCategoryName) &&
      (!resourceForm.requestedQuantity || Number(resourceForm.requestedQuantity) < 1)
    ) {
      showToast({
        title: "Quantity Required",
        message:
          selectedCategoryName === "BLOOD"
            ? "Enter the number of pints required."
            : "Enter the number of beds required.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmittingResource(true);

      await createPatientResourceRequestService(patientId, {
        resourceCategoryId: resourceForm.resourceCategoryId,
        priority: resourceForm.priority,
        requestReason: buildResourceReason(),
        requestedQuantity:
          resourceForm.requestedQuantity === ""
            ? 1
            : Number(resourceForm.requestedQuantity),
        unitOfMeasureSnapshot:
          selectedCategoryName === "BLOOD"
            ? "pints"
            : selectedCategoryName === "BED"
            ? "beds"
            : resourceForm.unitOfMeasureSnapshot.trim() || null,
      });

      showToast({
        title: "Resource Requested",
        message: "Resource request created and routed automatically.",
        type: "success",
      });

      setResourceForm({
        resourceCategoryId: "",
        priority: "MODERATE",
        requestReason: "",
        requestedQuantity: "",
        unitOfMeasureSnapshot: "",
        bloodType: "",
        imagingType: "",
        theatreNeed: "",
        bedType: "",
      });

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
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
        >
          <BackNavButton
            label="Back to Triage Queue"
            fallbackRoute="/staff/triage-nurse"
          />
          <PageHeader
            eyebrow="Patient Coordination"
            title="Patient Details"
            subtitle="Loading patient details..."
            icon="person-outline"
          />
        </ScrollView>
        <StaffNavBar activeRoute="/staff/triage-nurse" />
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
        >
          <BackNavButton
            label="Back to Triage Queue"
            fallbackRoute="/staff/triage-nurse"
          />
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
        <StaffNavBar activeRoute="/staff/triage-nurse" />
      </>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPatient(true)}
          />
        }
      >
        <BackNavButton
          label="Back to Triage Queue"
          fallbackRoute="/staff/triage-nurse"
        />

        <PageHeader
          eyebrow="Patient Coordination"
          title={patient.fullName || patient.patientCode}
          subtitle={`Linked to incident ${patient.incident?.trackingCode || ""}`}
          icon="person-outline"
        />

        <AdminReturnButton />

        <FormSection title="Patient Assignment">
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
              Assigned Triage Nurse:{" "}
              {patient.assignedTriageNurse?.name || "Unassigned"}
            </Text>

            {assignedToCurrentUser ? (
              <StatusBadge label="ASSIGNED TO YOU" type="success" />
            ) : unassigned ? (
              <StatusBadge label="UNASSIGNED" type="warning" />
            ) : (
              <StatusBadge label="ASSIGNED TO ANOTHER NURSE" type="danger" />
            )}

            {unassigned ? (
              <AppButton
                title={isClaiming ? "Claiming..." : "Claim Patient"}
                onPress={handleClaimPatient}
                loading={isClaiming}
                disabled={isClaiming}
              />
            ) : assignedToCurrentUser ? (
              <AppButton
                title={isReleasingClaim ? "Releasing..." : "Release Claim"}
                onPress={handleReleaseClaim}
                loading={isReleasingClaim}
                disabled={isReleasingClaim}
                variant="secondary"
              />
            ) : null}

            {!canEdit ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.textMuted, marginTop: 8 },
                ]}
              >
                This patient is assigned to another triage nurse. You can view
                details but cannot edit.
              </Text>
            ) : null}
          </View>
        </FormSection>

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
              Patient Code: {patient.patientCode}
            </Text>

            <StatusBadge
              label={patient.status}
              type={getPatientStatusType(patient.status)}
            />

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

            <View style={styles.badgeRow}>
              {latestTriage ? (
                <StatusBadge
                  label={`TRIAGE ${latestTriage.urgencyLevel}`}
                  type={getPriorityType(latestTriage.urgencyLevel)}
                />
              ) : (
                <StatusBadge label="UNTRIAGED" type="warning" />
              )}
            </View>
          </View>
        </FormSection>

        <FormSection title="Patient Outcome">
          <View style={styles.actionGrid}>
            <AppButton
              title="Mark Under Treatment"
              onPress={() => handleOutcome("UNDER_TREATMENT")}
              disabled={isUpdatingOutcome || !canEdit}
            />
            <AppButton
              title="Mark Discharged"
              onPress={() => handleOutcome("DISCHARGED")}
              disabled={isUpdatingOutcome || !canEdit}
              variant="secondary"
            />
            <AppButton
              title="Mark Deceased"
              onPress={() => handleOutcome("DECEASED")}
              disabled={isUpdatingOutcome || !canEdit}
              variant="secondary"
            />
            <AppButton
              title="Mark Invalid"
              onPress={() => handleOutcome("INVALID")}
              disabled={isUpdatingOutcome || !canEdit}
              variant="secondary"
            />
          </View>

          <Text style={[typography.body, { color: colors.textMuted }]}>
            Discharged, deceased, and invalid outcomes automatically release
            reusable resources such as beds, theatre, and imaging allocations.
            Blood allocations are not automatically restored.
          </Text>
        </FormSection>

        <FormSection title="Patient Identity">
          <FormInput
            label="Patient Real Name"
            value={identityForm.fullName}
            onChangeText={(value) =>
              setIdentityForm((prev) => ({ ...prev, fullName: value }))
            }
            placeholder="Enter patient name if known"
            editable={canEdit}
          />

          <FormInput
            label="Sex"
            value={identityForm.sex}
            onChangeText={(value) =>
              setIdentityForm((prev) => ({ ...prev, sex: value }))
            }
            placeholder="Male / Female / Unknown"
            editable={canEdit}
          />

          <FormInput
            label="Estimated Age"
            value={identityForm.estimatedAge}
            onChangeText={(value) =>
              setIdentityForm((prev) => ({ ...prev, estimatedAge: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 35"
            editable={canEdit}
          />

          <AppButton
            title={isSavingIdentity ? "Saving..." : "Save Patient Identity"}
            onPress={handleSaveIdentity}
            loading={isSavingIdentity}
            disabled={isSavingIdentity || !canEdit}
          />

          <AppButton
            title={
              isExcludingPatient
                ? "Removing..."
                : "Remove Invalid Patient Placeholder"
            }
            onPress={handleExcludePatient}
            loading={isExcludingPatient}
            disabled={isExcludingPatient || !canEdit}
            variant="secondary"
          />
        </FormSection>

        <FormSection title="Rule-Based Triage">
          {[
            ["airwayCompromised", "Airway Compromised"],
            ["unconscious", "Unconscious"],
            ["notBreathingNormally", "Not Breathing Normally"],
            ["severeBleeding", "Severe Bleeding"],
            ["cannotWalk", "Cannot Walk"],
            ["chestPain", "Chest Pain"],
            ["suspectedStroke", "Suspected Stroke"],
            ["majorBurn", "Major Burn"],
            ["seizure", "Seizure"],
            ["pregnancyEmergency", "Pregnancy Emergency"],
            ["multipleVictimsContext", "Multiple Casualty Context"],
          ].map(([key, label]) => (
            <Pressable
              key={key}
              style={[
                styles.toggleRow,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() => handleToggleBoolean(key)}
            >
              <Text style={[typography.body, { color: colors.text }]}>
                {label}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                {triageForm[key] ? "Yes" : "No"}
              </Text>
            </Pressable>
          ))}

          <FormInput
            label="Respiratory Rate"
            value={triageForm.respiratoryRate}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, respiratoryRate: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 28"
            editable={canEdit}
          />

          <FormInput
            label="Oxygen Saturation (%)"
            value={triageForm.oxygenSaturation}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, oxygenSaturation: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 92"
            editable={canEdit}
          />

          <FormInput
            label="Systolic Blood Pressure"
            value={triageForm.systolicBp}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, systolicBp: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 90"
            editable={canEdit}
          />

          <FormInput
            label="Heart Rate"
            value={triageForm.heartRate}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, heartRate: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 120"
            editable={canEdit}
          />

          <FormInput
            label="Capillary Refill Seconds"
            value={triageForm.capillaryRefillSeconds}
            onChangeText={(value) =>
              setTriageForm((prev) => ({
                ...prev,
                capillaryRefillSeconds: value,
              }))
            }
            keyboardType="numeric"
            placeholder="e.g. 4"
            editable={canEdit}
          />

          <FormSelect
            label="GCS Eye Opening"
            selectedValue={triageForm.eyeOpening}
            onValueChange={(value) =>
              setTriageForm((prev) => ({ ...prev, eyeOpening: value }))
            }
            options={GCS_EYE_OPTIONS}
            placeholder="Select eye response"
            enabled={canEdit}
          />

          <FormSelect
            label="GCS Verbal Response"
            selectedValue={triageForm.verbalResponse}
            onValueChange={(value) =>
              setTriageForm((prev) => ({ ...prev, verbalResponse: value }))
            }
            options={GCS_VERBAL_OPTIONS}
            placeholder="Select verbal response"
            enabled={canEdit}
          />

          <FormSelect
            label="GCS Motor Response"
            selectedValue={triageForm.motorResponse}
            onValueChange={(value) =>
              setTriageForm((prev) => ({ ...prev, motorResponse: value }))
            }
            options={GCS_MOTOR_OPTIONS}
            placeholder="Select motor response"
            enabled={canEdit}
          />

          <FormInput
            label="Pain Score (0-10)"
            value={triageForm.painScore}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, painScore: value }))
            }
            keyboardType="numeric"
            placeholder="e.g. 7"
            editable={canEdit}
          />

          <FormInput
            label="Triage Note"
            value={triageForm.note}
            onChangeText={(value) =>
              setTriageForm((prev) => ({ ...prev, note: value }))
            }
            placeholder="Optional triage note"
            multiline
            editable={canEdit}
          />

          <AppButton
            title={isSubmittingTriage ? "Saving Triage..." : "Save Triage"}
            onPress={handleSubmitTriage}
            loading={isSubmittingTriage}
            disabled={isSubmittingTriage || !canEdit}
          />

          {latestTriage ? (
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
                Latest Score: {latestTriage.triageScore}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                Advisory: {latestTriage.advisory}
              </Text>
              {latestTriage.reasons?.length ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  Reasons: {latestTriage.reasons.join("; ")}
                </Text>
              ) : null}
            </View>
          ) : null}
        </FormSection>

        <FormSection title="Create Resource Request">
          <FormSelect
            label="Resource Category"
            selectedValue={resourceForm.resourceCategoryId}
            onValueChange={(value) =>
              setResourceForm((prev) => ({
                ...prev,
                resourceCategoryId: value,
                requestedQuantity: "",
                bloodType: "",
                imagingType: "",
                theatreNeed: "",
                bedType: "",
              }))
            }
            options={resourceCategoryOptions}
            placeholder="Select resource category"
            enabled={canEdit}
          />

          <FormSelect
            label="Priority"
            selectedValue={resourceForm.priority}
            onValueChange={(value) =>
              setResourceForm((prev) => ({ ...prev, priority: value }))
            }
            options={PRIORITY_OPTIONS}
            placeholder="Select priority"
            enabled={canEdit}
          />

          {selectedCategoryName === "BLOOD" ? (
            <>
              <FormSelect
                label="Blood Type"
                selectedValue={resourceForm.bloodType}
                onValueChange={(value) =>
                  setResourceForm((prev) => ({ ...prev, bloodType: value }))
                }
                options={BLOOD_TYPE_OPTIONS}
                placeholder="Select blood type"
                enabled={canEdit}
              />

              <FormInput
                label="Pints Required"
                value={resourceForm.requestedQuantity}
                onChangeText={(value) =>
                  setResourceForm((prev) => ({
                    ...prev,
                    requestedQuantity: value,
                  }))
                }
                keyboardType="numeric"
                placeholder="e.g. 2"
                editable={canEdit}
              />
            </>
          ) : null}

          {selectedCategoryName === "BED" ? (
            <>
              <FormInput
                label="Bed Type / Ward"
                value={resourceForm.bedType}
                onChangeText={(value) =>
                  setResourceForm((prev) => ({ ...prev, bedType: value }))
                }
                placeholder="e.g. Emergency ward, ICU"
                editable={canEdit}
              />

              <FormInput
                label="Beds Required"
                value={resourceForm.requestedQuantity}
                onChangeText={(value) =>
                  setResourceForm((prev) => ({
                    ...prev,
                    requestedQuantity: value,
                  }))
                }
                keyboardType="numeric"
                placeholder="e.g. 1"
                editable={canEdit}
              />
            </>
          ) : null}

          {selectedCategoryName === "IMAGING" ? (
            <FormInput
              label="Imaging Type"
              value={resourceForm.imagingType}
              onChangeText={(value) =>
                setResourceForm((prev) => ({ ...prev, imagingType: value }))
              }
              placeholder="e.g. X-ray, CT scan"
              editable={canEdit}
            />
          ) : null}

          {selectedCategoryName === "THEATRE" ? (
            <FormInput
              label="Theatre / Procedure Need"
              value={resourceForm.theatreNeed}
              onChangeText={(value) =>
                setResourceForm((prev) => ({ ...prev, theatreNeed: value }))
              }
              placeholder="e.g. Emergency surgery"
              editable={canEdit}
            />
          ) : null}

          <FormInput
            label="Request Reason"
            value={resourceForm.requestReason}
            onChangeText={(value) =>
              setResourceForm((prev) => ({ ...prev, requestReason: value }))
            }
            placeholder="Explain why this resource is needed"
            multiline
            editable={canEdit}
          />

          <AppButton
            title={
              isSubmittingResource ? "Creating Request..." : "Create Resource Request"
            }
            onPress={handleSubmitResourceRequest}
            loading={isSubmittingResource}
            disabled={isSubmittingResource || !canEdit}
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
                <Text style={[typography.body, { color: colors.text }]}>
                  Requested: {request.requestedQuantity ?? 1}{" "}
                  {request.unitOfMeasureSnapshot || ""}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  Fulfilled: {request.fulfilledQuantity ?? 0}{" "}
                  {request.unitOfMeasureSnapshot || ""}
                </Text>

                {request.allocations?.length ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[typography.label, { color: colors.text }]}>
                      Allocations
                    </Text>
                    {request.allocations.map((allocation) => (
                      <Text
                        key={allocation.id}
                        style={[typography.body, { color: colors.textMuted }]}
                      >
                        {allocation.resourceItem?.label} •{" "}
                        {allocation.reservedQuantity ?? 1} •{" "}
                        {allocation.allocationStatus}
                      </Text>
                    ))}
                  </View>
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

        <FormSection title="Patient Timeline History">
          {patient.timelineEvents?.length ? (
            patient.timelineEvents.map((event) => (
              <View
                key={event.id}
                style={[
                  styles.timelineCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: colors.primary,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={[typography.label, { color: colors.text }]}>
                  {event.eventLabel}
                </Text>
                <Text style={[typography.body, { color: colors.textMuted }]}>
                  {event.eventStatus || "UPDATE"} •{" "}
                  {new Date(event.createdAt).toLocaleString()}
                </Text>
                {event.note ? (
                  <Text style={[typography.body, { color: colors.text }]}>
                    {event.note}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <EmptyStateCard
              title="No Timeline Events"
              message="No patient history has been recorded yet."
              icon="time-outline"
            />
          )}
        </FormSection>
      </ScrollView>

      <StaffNavBar activeRoute="/staff/triage-nurse" />
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
    gap: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
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
  timelineCard: {
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  actionGrid: {
    gap: 10,
  },
});