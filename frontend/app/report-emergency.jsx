import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, StyleSheet, View, Image } from "react-native";
import BackNavButton from "../src/components/BackNavButton";
import PageHeader from "../src/components/PageHeader";
import FormSection from "../src/components/FormSection";
import FormInput from "../src/components/FormInput";
import FormSelect from "../src/components/FormSelect";
import AppButton from "../src/components/AppButton";
import { useAppTheme } from "../src/context/ThemeContext";
import { useToast } from "../src/context/ToastContext";
import { createEmergencyReportService } from "../src/services/reportService";
import { getCurrentDeviceCoordinatesService } from "../src/services/locationService";
import { takeIncidentPhotoService } from "../src/services/mediaService";

const INCIDENT_TYPE_OPTIONS = [
  { label: "Road Traffic Accident", value: "ROAD_TRAFFIC_ACCIDENT" },
  { label: "Fall", value: "FALL" },
  { label: "Violence / Assault", value: "VIOLENCE_ASSAULT" },
  { label: "Burn", value: "BURN" },
  { label: "Poisoning / Overdose", value: "POISONING_OVERDOSE" },
  { label: "Medical Emergency", value: "MEDICAL_EMERGENCY" },
  { label: "Obstetric / Gynecological Emergency", value: "OBSTETRIC_GYNAE_EMERGENCY" },
  { label: "Pediatric Emergency", value: "PEDIATRIC_EMERGENCY" },
  { label: "Workplace / Industrial Accident", value: "WORKPLACE_INDUSTRIAL_ACCIDENT" },
  { label: "Sports / Recreation Injury", value: "SPORTS_RECREATION_INJURY" },
  { label: "Animal / Insect Incident", value: "ANIMAL_INSECT_INCIDENT" },
  { label: "Environmental / Disaster Event", value: "ENVIRONMENTAL_DISASTER_EVENT" },
  { label: "Drowning / Water Incident", value: "DROWNING_WATER_INCIDENT" },
  { label: "Collapse / Unresponsive Person", value: "COLLAPSE_UNRESPONSIVE" },
  { label: "Other", value: "OTHER" },
];

const INCIDENT_SUBTYPE_MAP = {
  ROAD_TRAFFIC_ACCIDENT: [
    "Motorcycle crash",
    "Car collision",
    "Pedestrian knocked by vehicle",
    "Vehicle rollover",
    "Mass casualty road crash",
  ],
  FALL: ["Fall from same level", "Fall from stairs", "Fall from height"],
  VIOLENCE_ASSAULT: ["Physical assault", "Stab wound", "Gunshot wound"],
  BURN: ["Flame burn", "Scald burn", "Electrical burn", "Chemical burn"],
  POISONING_OVERDOSE: ["Medicine overdose", "Food poisoning", "Chemical poisoning"],
  MEDICAL_EMERGENCY: [
    "Chest pain",
    "Difficulty breathing",
    "Seizure",
    "Stroke symptoms",
    "Cardiac arrest",
    "Unconscious person",
  ],
  OBSTETRIC_GYNAE_EMERGENCY: ["Labor pain", "Heavy pregnancy bleeding", "Postpartum bleeding"],
  PEDIATRIC_EMERGENCY: ["Child difficulty breathing", "Child seizure", "Child trauma"],
  WORKPLACE_INDUSTRIAL_ACCIDENT: ["Machine injury", "Crush injury", "Chemical exposure"],
  SPORTS_RECREATION_INJURY: ["Fracture during sport", "Head injury during sport", "Sprain"],
  ANIMAL_INSECT_INCIDENT: ["Dog bite", "Snake bite", "Insect sting"],
  ENVIRONMENTAL_DISASTER_EVENT: ["Building collapse", "Fire outbreak", "Explosion"],
  DROWNING_WATER_INCIDENT: ["Near drowning", "Boat accident", "Flood water incident"],
  COLLAPSE_UNRESPONSIVE: ["Collapsed in public", "Collapsed at home", "Found unresponsive"],
  OTHER: [],
};

export default function ReportEmergencyScreen() {
  const { colors, typography, radius, spacing, shadow } = useAppTheme();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    incidentType: "",
    subIncidentType: "",
    otherIncidentType: "",
    autoLocationText: "",
    manualLocationText: "",
    latitude: "",
    longitude: "",
    estimatedVictimCount: "1",
    phoneNumber: "",
    notes: "",
  });

  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingCoordinates, setIsGettingCoordinates] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [hasTriedCoordinates, setHasTriedCoordinates] = useState(false);

  const subtypeOptions = useMemo(() => {
    const items = INCIDENT_SUBTYPE_MAP[form.incidentType] || [];
    return items.map((item) => ({
      label: item,
      value: item,
    }));
  }, [form.incidentType]);

  useEffect(() => {
    let isMounted = true;

    const captureCoordinates = async () => {
      try {
        setIsGettingCoordinates(true);
        setHasTriedCoordinates(false);

        const coords = await getCurrentDeviceCoordinatesService();

        if (!isMounted) return;

        setForm((prev) => ({
          ...prev,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));

        setHasTriedCoordinates(true);
      } catch (error) {
        if (!isMounted) return;

        setHasTriedCoordinates(true);
        showToast({
          title: "Coordinates Not Captured",
          message: error.message || "Unable to get current coordinates automatically.",
          type: "warning",
        });
      } finally {
        if (isMounted) {
          setIsGettingCoordinates(false);
        }
      }
    };

    captureCoordinates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTakePhoto = async () => {
    try {
      setIsTakingPhoto(true);

      const captured = await takeIncidentPhotoService();

      if (!captured) return;

      setPhoto(captured);

      showToast({
        title: "Photo Attached",
        message: "Incident photo captured successfully.",
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Camera Failed",
        message: error.message || "Unable to take photo.",
        type: "error",
      });
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.incidentType) {
      showToast({
        title: "Missing Incident Type",
        message: "Select the incident type.",
        type: "warning",
      });
      return;
    }

    if (form.incidentType === "OTHER" && !form.otherIncidentType.trim()) {
      showToast({
        title: "Missing Other Type",
        message: "Enter the other incident type.",
        type: "warning",
      });
      return;
    }

    if (!form.manualLocationText.trim() && (!form.latitude || !form.longitude)) {
      showToast({
        title: "Missing Location",
        message: "Coordinates are missing. Wait a moment or enter a manual location.",
        type: "warning",
      });
      return;
    }

    if (!form.phoneNumber.trim()) {
      showToast({
        title: "Missing Phone Number",
        message: "Enter a phone number for follow-up.",
        type: "warning",
      });
      return;
    }

    if (!photo?.uri) {
      showToast({
        title: "Photo Required",
        message: "Take a picture with the phone camera before submitting.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append("incidentType", form.incidentType);
      payload.append("subIncidentType", form.subIncidentType || "");
      payload.append("otherIncidentType", form.otherIncidentType || "");
      payload.append("autoLocationText", form.autoLocationText || "");
      payload.append("manualLocationText", form.manualLocationText || "");
      payload.append("latitude", form.latitude || "");
      payload.append("longitude", form.longitude || "");
      payload.append("estimatedVictimCount", form.estimatedVictimCount || "1");
      payload.append("phoneNumber", form.phoneNumber.trim());
      payload.append("notes", form.notes || "");
      payload.append("photo", {
        uri: photo.uri,
        name: photo.fileName || "incident-camera-photo.jpg",
        type: photo.mimeType || "image/jpeg",
      });

      const data = await createEmergencyReportService(form, photo);

      showToast({
        title: "Report Submitted",
        message: `Tracking code: ${data.trackingCode}`,
        type: "success",
      });

      setForm({
        incidentType: "",
        subIncidentType: "",
        otherIncidentType: "",
        autoLocationText: "",
        manualLocationText: "",
        latitude: "",
        longitude: "",
        estimatedVictimCount: "1",
        phoneNumber: "",
        notes: "",
      });
      setPhoto(null);
      setHasTriedCoordinates(false);
    } catch (error) {
      showToast({
        title: "Submission Failed",
        message: error.message || "Unable to submit emergency report.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      <BackNavButton label="Back to Home" fallbackRoute="/" />

      <PageHeader
        eyebrow="Public Reporting"
        title="Report Emergency"
        subtitle="Provide the emergency details so the hospital can review and respond."
        icon="warning-outline"
      />

      <FormSection title="Incident Details">
        <FormSelect
          label="Incident Type"
          selectedValue={form.incidentType}
          onValueChange={(value) =>
            setForm((prev) => ({
              ...prev,
              incidentType: value,
              subIncidentType: "",
            }))
          }
          options={INCIDENT_TYPE_OPTIONS}
          placeholder="Select incident type"
        />

        {form.incidentType && form.incidentType !== "OTHER" ? (
          <FormSelect
            label="Incident Subtype"
            selectedValue={form.subIncidentType}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                subIncidentType: value,
              }))
            }
            options={subtypeOptions}
            placeholder="Select incident subtype"
          />
        ) : null}

        {form.incidentType === "OTHER" ? (
          <FormInput
            label="Other Incident Type"
            value={form.otherIncidentType}
            onChangeText={(value) =>
              setForm((prev) => ({
                ...prev,
                otherIncidentType: value,
              }))
            }
            placeholder="Describe the incident type"
          />
        ) : null}

        <FormInput
          label="Estimated Number of Patients"
          value={form.estimatedVictimCount}
          onChangeText={(value) =>
            setForm((prev) => ({
              ...prev,
              estimatedVictimCount: value,
            }))
          }
          keyboardType="numeric"
          placeholder="e.g. 1"
        />

        <FormInput
          label="Phone Number"
          value={form.phoneNumber}
          onChangeText={(value) =>
            setForm((prev) => ({
              ...prev,
              phoneNumber: value,
            }))
          }
          keyboardType="phone-pad"
          placeholder="Enter contact phone number"
        />

        <FormInput
          label="Notes"
          value={form.notes}
          onChangeText={(value) =>
            setForm((prev) => ({
              ...prev,
              notes: value,
            }))
          }
          placeholder="Add any important details"
          multiline
        />
      </FormSection>

      <FormSection title="Coordinates">
        <View
          style={[
            styles.coordsBox,
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
            Latitude: {form.latitude || (isGettingCoordinates ? "Capturing..." : "Not captured")}
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Longitude: {form.longitude || (isGettingCoordinates ? "Capturing..." : "Not captured")}
          </Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {isGettingCoordinates
              ? "Getting your current coordinates automatically..."
              : hasTriedCoordinates && form.latitude && form.longitude
              ? "Coordinates captured automatically."
              : "If coordinates fail, enter a manual location below."}
          </Text>
        </View>

        <FormInput
          label="Manual Location Description"
          value={form.manualLocationText}
          onChangeText={(value) =>
            setForm((prev) => ({
              ...prev,
              manualLocationText: value,
            }))
          }
          placeholder="Optional location description"
          multiline
        />
      </FormSection>

      <FormSection title="Camera Photo">
        <AppButton
          title={isTakingPhoto ? "Opening Camera..." : photo?.uri ? "Retake Photo" : "Take Photo"}
          onPress={handleTakePhoto}
          loading={isTakingPhoto}
          disabled={isTakingPhoto}
        />

        {photo?.uri ? (
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
              shadow,
            ]}
          >
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
            <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>
              Camera photo attached.
            </Text>
          </View>
        ) : (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            A camera photo is required before submission.
          </Text>
        )}
      </FormSection>

      <FormSection title="Submit">
        <AppButton
          title={isSubmitting ? "Submitting..." : "Submit Emergency Report"}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || isGettingCoordinates || isTakingPhoto}
        />
      </FormSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  coordsBox: {
    borderWidth: 1,
    marginBottom: 12,
  },
  previewCard: {
    borderWidth: 1,
    marginTop: 12,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
});