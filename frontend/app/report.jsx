import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, StyleSheet, Alert, ScrollView, View, Image } from "react-native";
import { INCIDENT_TYPES } from "../src/constants/reportOptions";
import { validateReportForm } from "../src/validators/reportValidators";
import { submitReportService } from "../src/services/reportService";
import { getCurrentLocationService } from "../src/services/locationService";
import { captureReportPhotoService } from "../src/services/mediaService";
import FormInput from "../src/components/FormInput";
import AppButton from "../src/components/AppButton";
import FormSelect from "../src/components/FormSelect";
import FormSection from "../src/components/FormSection";
import PageHeader from "../src/components/PageHeader";
import BackNavButton from "../src/components/BackNavButton";
import ThemeModeToggle from "../src/components/ThemeModeToggle";
import { useAppTheme } from "../src/context/ThemeContext";

export default function ReportScreen() {
  const { colors, radius, spacing, typography } = useAppTheme();

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
    capturedImage: null,
  });

  const [errors, setErrors] = useState({});
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      capturedImage: null,
    });
    setErrors({});
  };

  const handleCapturePhoto = async () => {
    try {
      setIsCapturingPhoto(true);
      const capturedImage = await captureReportPhotoService();

      if (!capturedImage) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        capturedImage,
      }));
    } catch (error) {
      Alert.alert("Camera Error", error.message || "Failed to capture photo.");
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({
      ...prev,
      capturedImage: null,
    }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateReportForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

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
      Alert.alert("Error", error.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <BackNavButton label="Back to Home" fallbackRoute="/" />

      <PageHeader
        eyebrow="Public Reporting"
        title="Report Emergency"
        subtitle="Your current location is captured automatically. You may also add a short landmark description."
        icon="warning-outline"
      />

      <FormSection title="Appearance">
        <ThemeModeToggle />
        <Text
          style={[styles.helperText, typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}
          maxFontSizeMultiplier={1.8}
        >
          Choose your preferred appearance before continuing.
        </Text>
      </FormSection>

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
          <Text
            style={[styles.locationInfo, typography.body, { color: colors.primaryDark }]}
            maxFontSizeMultiplier={1.8}
          >
            Fetching your location...
          </Text>
        ) : null}

        {form.latitude && form.longitude ? (
          <Text
            style={[styles.locationMeta, typography.body, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.8}
          >
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

      <FormSection title="Contact & Evidence">
        <FormInput
          label="Phone Number (Optional)"
          placeholder="07XXXXXXXX or +2567XXXXXXXX"
          value={form.phoneNumber}
          onChangeText={(value) => updateField("phoneNumber", value)}
          keyboardType="phone-pad"
          error={errors.phoneNumber}
        />

        <AppButton
          title={isCapturingPhoto ? "Opening Camera..." : "Take Photo"}
          onPress={handleCapturePhoto}
          variant="secondary"
          disabled={isCapturingPhoto}
        />

        {form.capturedImage ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: form.capturedImage.uri }}
              style={[styles.previewImage, { borderRadius: radius.lg }]}
              accessibilityLabel="Captured incident photo"
            />
            <Text
              style={[styles.previewText, typography.body, { color: colors.textMuted }]}
              maxFontSizeMultiplier={1.8}
            >
              Captured incident photo
            </Text>
            <AppButton
              title="Remove Photo"
              onPress={handleRemovePhoto}
              variant="secondary"
            />
          </View>
        ) : (
          <Text
            style={[styles.mediaHint, typography.body, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.8}
          >
            Capture a real-time photo from the camera if needed.
          </Text>
        )}
      </FormSection>

      <AppButton
        title={isSubmitting ? "Submitting..." : "Submit Report"}
        onPress={handleSubmit}
        disabled={isGettingLocation || isSubmitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  helperText: {
    lineHeight: 22,
  },
  locationMeta: {
    marginVertical: 10,
  },
  locationInfo: {
    marginBottom: 10,
    fontWeight: "600",
  },
  mediaHint: {
    marginTop: 10,
  },
  previewWrap: {
    marginTop: 14,
  },
  previewImage: {
    width: "100%",
    height: 220,
    marginBottom: 10,
  },
  previewText: {
    marginBottom: 4,
    fontWeight: "600",
  },
});