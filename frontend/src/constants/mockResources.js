export const MOCK_RESOURCES = {
  beds: [
    { id: "bed-1", label: "Emergency Beds Available", value: 4, status: "Available" },
    { id: "bed-2", label: "ICU Beds Available", value: 1, status: "Limited" },
  ],
  theatre: [
    { id: "theatre-1", label: "Theatre 1", value: "Ready", status: "Ready" },
    { id: "theatre-2", label: "Theatre 2", value: "Occupied", status: "Busy" },
  ],
  blood: [
    { id: "blood-1", label: "O Negative", value: "Low Stock", status: "Low" },
    { id: "blood-2", label: "A Positive", value: "Available", status: "Available" },
  ],
  staff: [
    { id: "staff-1", label: "Triage Nurses On Duty", value: 3, status: "Active" },
    { id: "staff-2", label: "Emergency Doctors On Duty", value: 2, status: "Active" },
  ],
};