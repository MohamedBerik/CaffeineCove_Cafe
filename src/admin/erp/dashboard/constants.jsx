// dashboard/constants.js
export const PRIORITY_MAP = { high: 3, medium: 2, low: 1 };

export const getAnomalyColor = (priority) => {
  switch (priority) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    default:
      return "#eab308";
  }
};

export const RANGE = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
};

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
