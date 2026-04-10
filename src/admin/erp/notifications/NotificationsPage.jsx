import { useEffect, useState } from "react";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatDateTime = (value) => {
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
  };

  const fetchAlerts = async (pageNumber = 1, append = false) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/erp/alerts?page=${pageNumber}&filter=${filter}`,
      );

      const newAlerts = res.data.data;

      setAlerts((prev) => (append ? [...prev, ...newAlerts] : newAlerts));

      setHasMore(res.data.meta.has_more);
    } catch (err) {
      console.error("❌ Error loading alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
    fetchAlerts(1, false);
  }, [filter]);

  // ✅ Mark as read + حذف الإشعار من القائمة
  const markAsRead = async (alertId) => {
    try {
      await api.post(`/erp/alerts/${alertId}/read`);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      if (expandedId === alertId) setExpandedId(null);
    } catch (err) {
      console.error("❌ Error marking alert as read:", err);
    }
  };

  // ✅ Acknowledge + حذف الإشعار من القائمة
  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/erp/alerts/${alertId}/ack`);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      if (expandedId === alertId) setExpandedId(null);
    } catch (err) {
      console.error("❌ Error acknowledging alert:", err);
    }
  };

  // ✅ الضغط على الإشعار = توسيع + Mark as read
  const handleAlertClick = (alert) => {
    if (expandedId === alert.id) {
      setExpandedId(null);
    } else {
      setExpandedId(alert.id);
      if (!alert.read) {
        markAsRead(alert.id);
      }
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAlerts(nextPage, true);
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

  if (loading && page === 1 && alerts.length === 0) {
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
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Notifications")}</h1>
          <p className="page-subtitle">
            {t("Stay updated with important system alerts and reminders")}
          </p>
        </div>
      </div>

      {/* Filters */}
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

      {/* Notifications List */}
      <div className="notifications-card">
        <div className="notifications-card-header">
          <i className="fas fa-bell me-2"></i>
          <h5 className="mb-0">{t("Notifications List")}</h5>
          <span className="notification-count">
            {alerts.length} {t("notifications")}
          </span>
        </div>

        <div className="notifications-card-body">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-bell-slash empty-icon"></i>
              <p className="empty-text">{t("No notifications found.")}</p>
            </div>
          ) : (
            <div className="notifications-list">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`notification-card ${getPriorityClass(alert.priority)} ${getTypeClass(alert.type)} ${expandedId === alert.id ? "expanded" : ""}`}
                >
                  <div
                    className="notification-summary"
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
                    <div className="notification-status">
                      {!alert.read && <span className="unread-dot"></span>}
                      <i
                        className={`fas fa-chevron-${expandedId === alert.id ? "up" : "down"}`}
                      ></i>
                    </div>
                  </div>

                  {/* ✅ Expanded View (توسيع الإشعار) */}
                  {expandedId === alert.id && (
                    <div className="notification-expanded">
                      <div className="expanded-details">
                        <div className="detail-row">
                          <span className="detail-label">{t("Priority")}:</span>
                          <span
                            className={`detail-value priority-badge ${getPriorityClass(alert.priority)}`}
                          >
                            {t(alert.priority || "Normal")}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">{t("Type")}:</span>
                          <span className="detail-value">
                            {t(alert.type || "Info")}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">{t("Time")}:</span>
                          <span className="detail-value">
                            {formatDateTime(alert.time)}
                          </span>
                        </div>
                        {alert.meta?.count && (
                          <div className="detail-row">
                            <span className="detail-label">{t("Count")}:</span>
                            <span className="detail-value">
                              {alert.meta.count}
                            </span>
                          </div>
                        )}
                        {alert.code && (
                          <div className="detail-row">
                            <span className="detail-label">{t("Code")}:</span>
                            <span className="detail-value code-value">
                              {alert.code}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="expanded-actions">
                        <button
                          className="btn-acknowledge"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <i className="fas fa-check-circle me-2"></i>
                          {t("Acknowledge")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && alerts.length > 0 && (
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
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
