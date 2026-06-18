import { memo } from "react";
import { useTranslation } from "react-i18next";

const typeIcons = {
  failed_login: "🔑",
  suspicious_activity: "⚠️",
  admin_override: "👤",
};

const typeColors = {
  failed_login: "danger",
  suspicious_activity: "warning",
  admin_override: "info",
};

const SecurityCard = memo(({ event }) => {
  const { t } = useTranslation();
  const icon = typeIcons[event.type] || "🔔";
  const color = typeColors[event.type] || "secondary";

  return (
    <div className={`card border-${color} shadow-sm`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex align-items-center">
            <span className="me-3 fs-3">{icon}</span>
            <div>
              <h5 className={`text-${color} mb-1`}>{t(event.title)}</h5>
              <div className="small text-muted">
                <span className="me-3">
                  <strong>{t("Type")}:</strong> {t(event.type)}
                </span>
                {event.email && (
                  <span className="me-3">
                    <strong>{t("Email")}:</strong> {event.email}
                  </span>
                )}
                {event.ip && (
                  <span className="me-3">
                    <strong>IP:</strong> {event.ip}
                  </span>
                )}
                {event.user_id && (
                  <span>
                    <strong>{t("User ID")}:</strong> {event.user_id}
                  </span>
                )}
              </div>
              {event.payload?.reason && (
                <p className="mb-0 mt-1 text-muted small">
                  {t("Reason")}: {event.payload.reason}
                </p>
              )}
            </div>
          </div>
          <small className="text-muted">
            {new Date(event.created_at).toLocaleString()}
          </small>
        </div>
      </div>
    </div>
  );
});

export default SecurityCard;
