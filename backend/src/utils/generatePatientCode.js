function generatePatientCode(trackingCode, patientNumber) {
  const padded = String(patientNumber).padStart(2, "0");
  return `PAT-${trackingCode}-${padded}`;
}

module.exports = {
  generatePatientCode,
};