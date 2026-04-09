export function validateUgandanPhone(phone) {
  if (!phone || !phone.trim()) {
    return "";
  }

  const cleaned = phone.replace(/\s+/g, "").trim();

  const patterns = [/^07\d{8}$/, /^2567\d{8}$/, /^\+2567\d{8}$/];

  const isValid = patterns.some((pattern) => pattern.test(cleaned));

  return isValid ? "" : "Enter a valid Ugandan phone number.";
}

export function validateReportForm({
  incidentType,
  otherIncidentType,
  autoLocationText,
  manualLocationText,
  victimCount,
  phoneNumber,
}) {
  const errors = {};

  if (!incidentType) {
    errors.incidentType = "Please select an incident type.";
  }

  if (incidentType === "Other" && !otherIncidentType.trim()) {
    errors.otherIncidentType = "Please specify the incident type.";
  }

  if (!autoLocationText.trim() && !manualLocationText.trim()) {
    errors.location = "Use your location or type a location.";
  }

  if (!victimCount.trim()) {
    errors.victimCount = "Number of victims is required.";
  } else if (isNaN(Number(victimCount)) || Number(victimCount) < 1) {
    errors.victimCount = "Victim count must be 1 or more.";
  }

  const phoneError = validateUgandanPhone(phoneNumber);
  if (phoneError) {
    errors.phoneNumber = phoneError;
  }

  return errors;
}

export function validateTrackForm({ trackingCode, phoneNumber }) {
  const errors = {};

  if (!trackingCode.trim()) {
    errors.trackingCode = "Tracking code is required.";
  }

  const phoneError = validateUgandanPhone(phoneNumber);
  if (phoneError) {
    errors.phoneNumber = phoneError;
  }

  return errors;
}