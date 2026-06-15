export function validateTriageForm(form) {
  const errors = {};

  const painRaw = String(form.painScore ?? "").trim();

  if (painRaw.length > 0) {
    const pain = Number(painRaw);

    if (Number.isNaN(pain)) {
      errors.painScore = "Pain score must be a number.";
    } else if (pain < 0 || pain > 10) {
      errors.painScore = "Pain score must be between 0 and 10.";
    }
  }

  const selectedCriticalIndicators = [
    form.unconscious,
    form.notBreathingNormally,
    form.severeBleeding,
    form.multipleVictims,
  ].filter(Boolean).length;

  if (selectedCriticalIndicators === 0 && painRaw.length === 0) {
    errors.general =
      "Provide at least one triage indicator or a pain score before running assessment.";
  }

  return errors;
}

export function validateIncidentStatusUpdate({ status, note }) {
  const errors = {};

  const trimmedNote = String(note ?? "").trim();

  if (!status || String(status).trim().length === 0) {
    errors.status = "Please select a public status.";
  }

  if (
    ["Rejected", "Duplicate", "Closed"].includes(status) &&
    trimmedNote.length < 10
  ) {
    errors.note =
      "Please enter a more detailed staff note for this status update.";
  }

  if (trimmedNote.length > 500) {
    errors.note = "Staff note must be 500 characters or less.";
  }

  return errors;
}