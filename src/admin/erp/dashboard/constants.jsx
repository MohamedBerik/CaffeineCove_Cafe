export const PRIORITY_MAP = { high: 3, medium: 2, low: 1 };
export const RANGE = { DAY: "day", WEEK: "week", MONTH: "month" };
export const insightIconMap = {
  revenue: "💰",
  appointments: "📅",
  invoices: "🧾",
  patients: "👥",
};
export const getDashboardKey = (branch, range, compare) => [
  "dashboard",
  branch,
  range,
  compare,
];
