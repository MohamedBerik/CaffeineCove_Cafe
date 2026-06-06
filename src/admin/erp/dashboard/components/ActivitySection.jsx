import { memo } from "react";
import { useTranslation } from "react-i18next";
import EmptyState from "./EmptyState";

const formatLog = (log, t) => {
  const type = log.subject_type;
  const action = log.action;
  if (type === "Appointment") {
    if (action === "created") return t("New appointment created");
    if (action === "updated") return t("Appointment updated");
    if (action === "deleted") return t("Appointment deleted");
  }
  if (type === "Invoice") {
    if (action === "created") return t("New invoice created");
    if (action === "paid") return t("Invoice paid");
  }
  if (type === "Payment") return t("New payment recorded");
  if (type === "Customer") return t("Customer updated");
  return `${type} ${action}`;
};

const ActivitySection = ({
  activityLogs,
  formatDateTime,
  i18n,
  categoryFilter,
  setCategoryFilter,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-header">
        <h2>{t("Recent Activity")}</h2>
        <div className="flex items-center gap-3">
          <p>{t("Latest updates from your clinic")}</p>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">{t("All Activities")}</option>
            <option value="admin">{t("Admin Actions")}</option>
            <option value="billing">{t("Billing")}</option>
            <option value="user">{t("User Actions")}</option>
            <option value="system">{t("System")}</option>
          </select>
        </div>
      </div>
      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-history"></i>
            <h5 className="card-title">{t("Activity Logs")}</h5>
          </div>
        </div>
        <div className="card-body-custom">
          {activityLogs.length === 0 ? (
            <EmptyState text={t("No activity yet.")} />
          ) : (
            <ul className="activity-list">
              {activityLogs.map((log) => (
                <li key={log.id} className="activity-item">
                  <div className="activity-text">
                    {log.subject_type} {log.action}
                  </div>
                  <small className="activity-time">
                    {formatDateTime(log.created_at, i18n.language)}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(ActivitySection);
