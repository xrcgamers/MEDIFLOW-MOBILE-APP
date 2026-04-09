export const MOCK_ALERTS = [
  {
    id: "alert-1",
    title: "Critical Case Waiting",
    message: "One critical trauma case is awaiting immediate triage review.",
    level: "danger",
    actionLabel: "Open Triage",
    actionRoute: "/staff/triage",
  },
  {
    id: "alert-2",
    title: "Low Blood Stock",
    message: "O Negative blood stock is running low.",
    level: "warning",
    actionLabel: "View Resources",
    actionRoute: "/staff/resources",
  },
  {
    id: "alert-3",
    title: "New Report Received",
    message: "A new public emergency report requires staff review.",
    level: "info",
    actionLabel: "View Reports",
    actionRoute: "/staff/incidents",
  },
];