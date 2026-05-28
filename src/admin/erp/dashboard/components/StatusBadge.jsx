import React from "react";
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
  draft: { label: "Draft", class: "secondary" },
  overdue: { label: "Overdue", class: "danger" },
  refunded: { label: "Refunded", class: "info" },
  processing: { label: "Processing", class: "warning" },
  failed: { label: "Failed", class: "danger" },
};

const StatusBadge = ({ status }) => {
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
};

export default React.memo(StatusBadge);
