import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { useAlertState, useAlertActions } from "../../context/AlertContext";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { alerts, unreadCount } = useAlertState();
  const { markAsRead, markAllAsRead } = useAlertActions();
  const { fetchAlerts: fetchAlertsFromContext, setAlerts } = useAlertActions();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const abortControllerRef = useRef(null);

  const displayAlerts = alerts.filter((a) => {
    if (filter === "unread") return !a.read;
    if (filter === "high") return a.priority === "high";
    return true;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatDateTime = useCallback(
    (value) => {
      if (!value) return "-";
      try {
        const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
        return new Date(value).toLocaleString(lang, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return value;
      }
    },
    [i18n.language],
  );

  const fetchAlerts = useCallback(
    async (pageNumber = 1, append = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);
        const res = await fetchAlertsFromContext(pageNumber, filter);
        const newAlerts = res.data;

        setAlerts((prev) => {
          if (!append) return newAlerts;

          const existingIds = new Set(prev.map((a) => a.id));
          const filtered = newAlerts.filter((a) => !existingIds.has(a.id));

          return [...prev, ...filtered];
        });

        setHasMore(res.meta.has_more);
      } catch (err) {
        if (err.name !== "AbortError" && err.code !== "ERR_CANCELED") {
          console.error("❌ Error loading alerts:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [filter, fetchAlertsFromContext, setAlerts],
  );

  useEffect(() => {
    setPage(1);
    fetchAlerts(1, false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filter, fetchAlerts]);

  const handleAcknowledge = async (alertId) => {
    try {
      await markAsRead(alertId);
      setSelectedAlert((prev) => (prev ? { ...prev, read: true } : null));
    } catch (err) {
      console.error("❌ Error acknowledging alert:", err);
    }
  };

  const handleAlertClick = (alertItem) => {
    setSelectedAlert(alertItem);
  };

  const closeModal = () => {
    setSelectedAlert(null);
  };

  const loadMore = () => {
    setPage((prev) => {
      const next = prev + 1;
      fetchAlerts(next, true);
      return next;
    });
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      case "low":
        return "priority-low";
      default:
        return "priority-default";
    }
  };

  const getTypeClass = (type) => {
    switch (type?.toLowerCase()) {
      case "danger":
        return "type-danger";
      case "warning":
        return "type-warning";
      case "info":
        return "type-info";
      default:
        return "type-default";
    }
  };

  if (loading && page === 1 && displayAlerts.length === 0) {
    return (
      <div className="notifications-loading">
        <div className="loading-animation">
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
        </div>
        <p>{t("Loading notifications...")}</p>
      </div>
    );
  }

  return (
    <div
      className="notifications-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Notifications")}</h1>
          <p className="page-subtitle">
            {t("Stay updated with important system alerts and reminders")}
          </p>
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Filter Notifications")}</h5>
        </div>
        <div className="filters-card-body">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              <i className="fas fa-bell me-1"></i>
              {t("All")}
            </button>
            <button
              className={`filter-btn ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              <i className="fas fa-envelope me-1"></i>
              {t("Unread")}
            </button>
            <button
              className={`filter-btn ${filter === "high" ? "active" : ""}`}
              onClick={() => setFilter("high")}
            >
              <i className="fas fa-exclamation-triangle me-1"></i>
              {t("High Priority")}
            </button>
          </div>
        </div>
      </div>

      <div className="notifications-card">
        <div className="notifications-card-header">
          <i className="fas fa-bell me-2"></i>
          <h5 className="mb-0">{t("Notifications List")}</h5>
          <span className="notification-count">
            {displayAlerts.length} {t("notifications")}
          </span>
        </div>

        <div className="notifications-card-body">
          {displayAlerts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-bell-slash empty-icon"></i>
              <p className="empty-text">{t("No notifications found.")}</p>
            </div>
          ) : (
            <div className="notifications-list">
              {displayAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`notification-card ${getPriorityClass(alert.priority)} ${getTypeClass(alert.type)} ${alert.read ? "read" : "unread"}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="notification-icon">
                    {alert.type === "danger" && (
                      <i className="fas fa-exclamation-circle"></i>
                    )}
                    {alert.type === "warning" && (
                      <i className="fas fa-exclamation-triangle"></i>
                    )}
                    {alert.type === "info" && (
                      <i className="fas fa-info-circle"></i>
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">
                      {t(alert.message)}
                    </div>
                    <div className="notification-meta">
                      <span
                        className={`priority-badge ${getPriorityClass(alert.priority)}`}
                      >
                        {t(alert.priority || "Normal")}
                      </span>
                      <span className="notification-time">
                        <i className="fas fa-clock me-1"></i>
                        {formatDateTime(alert.time)}
                      </span>
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!alert.read && (
                      <button
                        className="btn-mark-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(alert.id);
                        }}
                        title={t("Mark as read")}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                  </div>
                  <div className="notification-status">
                    {!alert.read && <span className="unread-dot"></span>}
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && displayAlerts.length > 0 && (
            <div className="load-more-container">
              <button
                className="btn-load-more"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t("Loading...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-down me-2"></i>
                    {t("Load More")}
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && displayAlerts.length > 0 && (
            <div className="no-more-container">
              <p className="no-more-text">{t("No more notifications")}</p>
            </div>
          )}
        </div>
      </div>

      {selectedAlert && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className={`modal-icon ${getTypeClass(selectedAlert.type)}`}>
                {selectedAlert.type === "danger" && (
                  <i className="fas fa-exclamation-circle"></i>
                )}
                {selectedAlert.type === "warning" && (
                  <i className="fas fa-exclamation-triangle"></i>
                )}
                {selectedAlert.type === "info" && (
                  <i className="fas fa-info-circle"></i>
                )}
              </div>
              <h3>{t(selectedAlert.message)}</h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">{t("Priority")}:</span>
                <span
                  className={`detail-value priority-badge ${getPriorityClass(selectedAlert.priority)}`}
                >
                  {t(selectedAlert.priority || "Normal")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("Type")}:</span>
                <span className="detail-value">
                  {t(selectedAlert.type || "Info")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("Time")}:</span>
                <span className="detail-value">
                  {formatDateTime(selectedAlert.time)}
                </span>
              </div>
              {selectedAlert.code && (
                <div className="detail-row">
                  <span className="detail-label">{t("Code")}:</span>
                  <span className="detail-value code-value">
                    {selectedAlert.code}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!selectedAlert.read && (
                <button
                  className="btn-acknowledge"
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                >
                  <i className="fas fa-check-circle me-2"></i>
                  {t("Acknowledge")}
                </button>
              )}
              <button className="btn-close-modal" onClick={closeModal}>
                <i className="fas fa-times me-2"></i>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
