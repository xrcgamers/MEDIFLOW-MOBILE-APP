import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, StyleSheet, Alert, ScrollView } from "react-native";
import { INCIDENT_TYPES } from "../src/constants/reportOptions";
import { validateReportForm } from "../src/validators/reportValidators";
import { submitReportService } from "../src/services/reportService";
import { getCurrentLocationService } from "../src/services/locationService";
import FormInput from "../src/components/FormInput";
import AppButton from "../src/components/AppButton";
import FormSelect from "../src/components/FormSelect";
import FormSection from "../src/components/FormSection";
import PageHeader from "../src/components/PageHeader";
import { COLORS } from "../src/constants/theme";

export default function ReportScreen() {
  const [form, setForm] = useState({
    incidentType: "",
    otherIncidentType: "",
    autoLocationText: "",
    manualLocationText: "",
    latitude: null,
    longitude: null,
    victimCount: "",
    phoneNumber: "",
    notes: "",
    mediaCount: 0,
  });

  const [errors, setErrors] = useState({});
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchLocation = async () => {
    try {
      setIsGettingLocation(true);

      const result = await getCurrentLocationService();

      setForm((prev) => ({
        ...prev,
        autoLocationText: result.locationText,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    } catch (error) {
      Alert.alert(
        "Location Required",
        error.message || "Unable to get your location."
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const resetForm = () => {
    setForm({
      incidentType: "",
      otherIncidentType: "",
      autoLocationText: "",
      manualLocationText: "",
      latitude: null,
      longitude: null,
      victimCount: "",
      phoneNumber: "",
      notes: "",
      mediaCount: 0,
    });
    setErrors({});
  };

  const handleAddMediaPlaceholder = () => {
    setForm((prev) => ({
      ...prev,
      mediaCount: prev.mediaCount + 1,
    }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateReportForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const result = await submitReportService(form);

      router.push({
        pathname: "/report-success",
        params: {
          trackingCode: result.trackingCode,
          status: result.status,
          incidentType: result.resolvedIncidentType,
          location: result.resolvedLocationText,
        },
      });

      resetForm();
    } catch (error) {
      Alert.alert("Error", "Failed to submit report.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHeader
        eyebrow="Public Reporting"
        title="Report Emergency"
        subtitle="Your current location is captured automatically. You may also add a short landmark description."
        icon="warning-outline"
      />

      <FormSection title="Incident Details">
        <FormSelect
          label="Incident Type"
          selectedValue={form.incidentType}
          onValueChange={(value) => updateField("incidentType", value)}
          options={INCIDENT_TYPES}
          placeholder="Select incident type"
          error={errors.incidentType}
        />

        {form.incidentType === "Other" ? (
          <FormInput
            label="Specify Incident Type"
            placeholder="Enter incident type"
            value={form.otherIncidentType}
            onChangeText={(value) => updateField("otherIncidentType", value)}
            error={errors.otherIncidentType}
          />
        ) : null}

        <FormInput
          label="Number of Victims"
          placeholder="e.g. 2"
          value={form.victimCount}
          onChangeText={(value) => updateField("victimCount", value)}
          keyboardType="numeric"
          error={errors.victimCount}
        />

        <FormInput
          label="Notes (Optional)"
          placeholder="Briefly describe what happened"
          value={form.notes}
          onChangeText={(value) => updateField("notes", value)}
          multiline
        />
      </FormSection>

      <FormSection title="Location Details">
        <FormInput
          label="Detected Location"
          placeholder="Fetching your location..."
          value={form.autoLocationText}
          editable={false}
        />

        {isGettingLocation ? (
          <Text style={styles.locationInfo}>Fetching your location...</Text>
        ) : null}

        {form.latitude && form.longitude ? (
          <Text style={styles.locationMeta}>
            Coordinates: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
          </Text>
        ) : null}

        <FormInput
          label="Landmark / Typed Location (Optional)"
          placeholder="e.g. Opposite Wandegeya Market"
          value={form.manualLocationText}
          onChangeText={(value) => updateField("manualLocationText", value)}
          error={errors.location}
        />
      </FormSection>

      <FormSection title="Contact & Media">
        <FormInput
          label="Phone Number (Optional)"
          placeholder="07XXXXXXXX or +2567XXXXXXXX"
          value={form.phoneNumber}
          onChangeText={(value) => updateField("phoneNumber", value)}
          keyboardType="phone-pad"
          error={errors.phoneNumber}
        />

        <Text style={styles.mediaText}>
          Attached Media (Placeholder): {form.mediaCount}
        </Text>

        <AppButton
          title="Add Media Placeholder"
          onPress={handleAddMediaPlaceholder}
          variant="secondary"
        />
      </FormSection>

      <AppButton
        title="Submit Report"
        onPress={handleSubmit}
        disabled={isGettingLocation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.background,
    flexGrow: 1,
  },
  locationMeta: {
    fontSize: 13,
    color: "#374151",
    marginVertical: 10,
  },
  locationInfo: {
    fontSize: 14,
    color: "#0f766e",
    marginBottom: 10,
  },
  mediaText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
  },
});