export function getDefaultStaffRoute(role) {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "EMERGENCY_NURSE":
      return "/staff/emergency-nurse";

    case "TRIAGE_NURSE":
      return "/staff/triage-nurse";

    case "BLOOD_BANK_STAFF":
      return "/staff/blood-bank";

    case "IMAGING_STAFF":
      return "/staff/imaging";

    case "THEATRE_STAFF":
      return "/staff/theatre";

    case "BED_MANAGER":
      return "/staff/bed-manager";

    default:
      return "/staff";
  }
}