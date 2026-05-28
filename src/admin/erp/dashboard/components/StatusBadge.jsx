import { useTranslation } from "react-i18next";

const statusMap = {
  paid: { label: "Paid", class: "success" },
  completed: { label: "Completed", class: "success" },
  unpaid: { label: "Unpaid", class: "danger" },
  cancelled: { label: "Cancelled", class: "danger" },
  no_show: { label: "No Show", class: "danger" },
  partially_paid: { label: "Partially Paid", class: "warning" },
  scheduled: { label: "Scheduled", class: "warning" },
  in_progress: { label: "In Progress", class: "info" },
  pending: { label: "Pending", class: "secondary" },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const value = String(status || "").toLowerCase();
  const info = statusMap[value] || {
    label: status || "Unknown",
    class: "secondary",
  };
  return (
    <span className={`status-badge status-${info.class}`}>
      <span className="status-dot"></span>
      {t(info.label)}
    </span>
  );
}
