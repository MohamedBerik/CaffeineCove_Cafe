import { memo } from "react";
import { useTranslation } from "react-i18next";

const getTypeIcon = (type) => {
  switch (type) {
    case "failed_login":
      return "fa-sign-in-alt";
    case "suspicious_activity":
      return "fa-exclamation-triangle";
    case "admin_override":
      return "fa-user-shield";
    default:
      return "fa-shield-alt";
  }
};

const getTypeLabel = (type, t) => {
  switch (type) {
    case "failed_login":
      return t("Failed Login");
    case "suspicious_activity":
      return t("Suspicious Activity");
    case "admin_override":
      return t("Admin Override");
    default:
      return type;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case "failed_login":
      return "danger";
    case "suspicious_activity":
      return "warning";
    case "admin_override":
      return "info";
    default:
      return "secondary";
  }
};

const SecurityCard = ({ event }) => {
  const { t } = useTranslation();

  return (
    <div className={`security-card border-${getTypeColor(event.type)}`}>
      <div className="card-header">
        <div className="card-icon">
          <i className={`fas ${getTypeIcon(event.type)}`}></i>
        </div>
        <div className="card-title-wrapper">
          <h5 className="card-title">{event.title}</h5>
          <span className={`badge badge-${getTypeColor(event.type)}`}>
            {getTypeLabel(event.type, t)}
          </span>
        </div>
        <small className="event-time">
          {new Date(event.created_at).toLocaleString()}
        </small>
      </div>

      <div className="card-body">
        <div className="event-details">
          {event.email && (
            <div className="detail-item">
              <i className="fas fa-envelope"></i>
              <span>{event.email}</span>
            </div>
          )}

          {event.ip && (
            <div className="detail-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{event.ip}</span>
            </div>
          )}

          {event.user_id && (
            <div className="detail-item">
              <i className="fas fa-user"></i>
              <span>User ID: {event.user_id}</span>
            </div>
          )}
        </div>

        {event.payload && Object.keys(event.payload).length > 0 && (
          <div className="event-payload">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={(e) => {
                const details = e.currentTarget.nextElementSibling;
                if (details) {
                  details.style.display =
                    details.style.display === "none" ? "block" : "none";
                }
              }}
            >
              <i className="fas fa-code"></i> {t("Details")}
            </button>
            <pre className="payload-content" style={{ display: "none" }}>
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(SecurityCard);
