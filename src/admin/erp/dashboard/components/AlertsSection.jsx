import { memo } from "react";
import { useTranslation } from "react-i18next";

const AlertsSection = ({
  alerts,
  visibleAlerts,
  acknowledgingIds,
  hiddenAlerts,
  setHiddenAlerts,
  markAllAsRead,
  acknowledge,
  formatDateTime,
  i18n,
}) => {
  const { t } = useTranslation();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alerts-container">
      {visibleAlerts.map((alert) => (
        <div key={alert.id} className={`alert-card alert-${alert.type}`}>
          <i
            className={`fas ${alert.type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}`}
          ></i>
          <span className={`alert-priority priority-${alert.priority}`}>
            {alert.priority}
          </span>
          <span>
            {t(alert.message)}{" "}
            {alert.meta?.count ? `(${alert.meta.count})` : ""}
          </span>
          <small className="alert-time">
            {formatDateTime(alert.time, i18n.language)}
          </small>
          <button
            className="alert-close"
            onClick={(e) => {
              e.stopPropagation();
              setHiddenAlerts((prev) => {
                const next = new Set(prev);
                next.add(alert.id);
                return next;
              });
            }}
          >
            <i className="fas fa-times"></i>
          </button>
          <button
            className="alert-ack"
            disabled={acknowledgingIds.has(alert.id)}
            onClick={(e) => {
              e.stopPropagation();
              acknowledge(alert.id);
            }}
          >
            {acknowledgingIds.has(alert.id) ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-check"></i>
            )}
          </button>
        </div>
      ))}
      <button
        className="btn btn-sm btn-outline-secondary mt-2"
        onClick={markAllAsRead}
      >
        {t("Mark All as Read")}
      </button>
    </div>
  );
};

export default memo(AlertsSection);
