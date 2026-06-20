import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { useAlertActions } from "../../../context/AlertContext";
import api from "../../../services/axios";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { markAsRead, markManyAsRead } = useAlertActions(); // ✅ استخراج الدالة الجديدة
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [selectedCompany, setSelectedCompany] = useState(
    () => localStorage.getItem("selectedCompany") || user?.company_id || null,
  );
  const [selectedBranch, setSelectedBranch] = useState(
    () => localStorage.getItem("selectedBranchId") || user?.branch_id || null,
  );

  useEffect(() => {
    const sync = () => {
      setSelectedBranch(localStorage.getItem("selectedBranchId"));
      setSelectedCompany(localStorage.getItem("selectedCompany"));
    };
    window.addEventListener("branchChanged", sync);
    window.addEventListener("companyChanged", sync);
    return () => {
      window.removeEventListener("branchChanged", sync);
      window.removeEventListener("companyChanged", sync);
    };
  }, []);

  const {
    data: alertsData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["alerts", filter, selectedCompany, selectedBranch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(
        `/erp/alerts?page=${pageParam}&filter=${filter}&branch_id=${selectedBranch || ""}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta?.has_more ? lastPage.meta.current_page + 1 : undefined,
    staleTime: 1000 * 30,
    placeholderData: undefined,
  });

  const { data: insightsData } = useQuery({
    queryKey: ["insights", selectedCompany, selectedBranch],
    queryFn: async () => {
      try {
        const res = await api.get(
          `/erp/dashboard?branch_id=${selectedBranch || ""}`,
        );
        return res.data?.data?.insights || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 30,
  });

  const alerts = alertsData?.pages.flatMap((page) => page.data) || [];
  const insights = insightsData || [];

  const allNotifications = useMemo(
    () => [
      ...alerts.map((a) => ({ ...a, notificationType: "alert" })),
      ...insights.map((i) => ({
        ...i,
        notificationType: "insight",
        id: `insight-${i.category}`,
        read: true,
      })),
    ],
    [alerts, insights],
  );

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

  const handleAcknowledge = async (alertId) => {
    if (typeof alertId === "string" && alertId.startsWith("insight-")) return;
    try {
      await markAsRead(alertId);
      setSelectedAlert((prev) => (prev ? { ...prev, read: true } : null));
    } catch (err) {
      console.error("❌ Error acknowledging alert:", err);
    }
  };

  const acknowledgeGroup = async (group) => {
    const ids = group.itemIds || [];
    if (ids.length === 0) return;

    try {
      await markManyAsRead(ids); // ✅ مصدر واحد للحقيقة
      toast.success(t("All selected notifications have been acknowledged"));
    } catch (err) {
      console.error("Bulk acknowledge failed:", err);
      toast.error(t("Failed to acknowledge notifications"));
    }

    setSelectedGroup(null);
  };

  const handleAlertClick = (alertItem) => {
    setSelectedAlert(alertItem);
  };

  const closeModal = () => {
    setSelectedAlert(null);
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

  const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

  // ✅ دوال التجميع والفرز (مع useCallback)
  const groupAlerts = useCallback((items) => {
    const groups = {};
    items.forEach((item) => {
      const key = item.code
        ? `${item.code}-${item.type}-${item.priority}`
        : item.notificationType === "insight"
          ? `insight-${item.category}`
          : `${item.type}-${item.priority}-${item.message}`;

      if (!groups[key]) {
        groups[key] = {
          id: item.id,
          message: item.message,
          priority: item.priority,
          type: item.type,
          notificationType: item.notificationType,
          category: item.category,
          time: item.time,
          count: 1,
          // ✅ تخزين آخر عنصر فقط وعدد التكرار بدلاً من المصفوفة كاملة
          latestItem: item,
          itemIds: [item.id],
        };
      } else {
        groups[key].count += 1;
        groups[key].itemIds.push(item.id);
      }
    });
    return Object.values(groups);
  }, []);

  const sortGroups = useCallback(
    (groups) =>
      groups.sort(
        (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority],
      ),
    [],
  );

  const categorize = useCallback((item) => {
    if (item.notificationType === "insight") {
      return item.priority === "high" ? "critical" : "attention";
    }
    if (item.type === "danger" || item.priority === "high") return "critical";
    if (item.type === "warning" || item.priority === "medium")
      return "attention";
    return "info";
  }, []);

  const formatGroupDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("Today");
    if (diffDays === 1) return t("Yesterday");
    if (diffDays < 7) return `${diffDays} ${t("days ago")}`;
    return date.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredAlerts = useMemo(() => {
    return allNotifications.filter((a) => {
      if (filter === "unread") return !a.read;
      if (filter === "high") return a.priority === "high";
      return true;
    });
  }, [allNotifications, filter]);

  const smartGroupedAlerts = useMemo(() => {
    return sortGroups(groupAlerts(filteredAlerts));
  }, [filteredAlerts, groupAlerts, sortGroups]);

  const getNotificationIcon = (item) => {
    if (item.notificationType === "insight") {
      const iconMap = {
        revenue: "💰",
        appointments: "📅",
        invoices: "🧾",
        patients: "👥",
        doctors: "👨‍⚕️",
      };
      return iconMap[item.category] || "📊";
    }
    if (item.type === "danger") return "🔴";
    if (item.type === "warning") return "🟡";
    return "🔵";
  };

  if (isLoading) {
    return (
      <div
        className="notifications-page"
        dir={i18n.language === "ar" ? "rtl" : "ltr"}
      >
        <div className="page-header skeleton">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="filters-card skeleton">
          <div className="skeleton-filters">
            <div className="skeleton-filter-btn"></div>
            <div className="skeleton-filter-btn"></div>
            <div className="skeleton-filter-btn"></div>
          </div>
        </div>
        <div className="notifications-card skeleton">
          <div className="notifications-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="notification-card skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-content">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
              <i className="fas fa-bell me-1"></i> {t("All")}
            </button>
            <button
              className={`filter-btn ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              <i className="fas fa-envelope me-1"></i> {t("Unread")}
            </button>
            <button
              className={`filter-btn ${filter === "high" ? "active" : ""}`}
              onClick={() => setFilter("high")}
            >
              <i className="fas fa-exclamation-triangle me-1"></i>{" "}
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
            {filteredAlerts.length} {t("notifications")}
          </span>
        </div>
        <div className="notifications-card-body">
          {filteredAlerts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-bell-slash empty-icon"></i>
              <p className="empty-text">
                {filter === "unread"
                  ? t("🎉 No unread notifications!")
                  : filter === "high"
                    ? t("No high priority notifications")
                    : t("No notifications found.")}
              </p>
            </div>
          ) : (
            <div className="smart-notifications-list">
              {smartGroupedAlerts.map((group) => (
                <div
                  key={group.id}
                  className={`smart-alert-card ${categorize(group)}`}
                >
                  <div className="alert-header">
                    <span className="alert-icon-large">
                      {getNotificationIcon(group)}
                    </span>
                    <div className="alert-header-content">
                      <span className="alert-category-badge">
                        {group.notificationType === "insight"
                          ? t(group.category)
                          : t(categorize(group))}
                      </span>
                      <strong>{t(group.message)}</strong>
                    </div>
                    {group.count > 1 && (
                      <span className="alert-count">({group.count})</span>
                    )}
                  </div>
                  {group.notificationType !== "insight" && group.time && (
                    <div className="alert-time">
                      <i className="fas fa-clock"></i>{" "}
                      {formatDateTime(group.time)}
                    </div>
                  )}
                  <div className="alert-actions">
                    <button
                      className="btn-view-group"
                      onClick={() => setSelectedGroup(group)}
                    >
                      {t("View Details")}
                    </button>
                    {group.notificationType !== "insight" && (
                      <button
                        className="btn-ack-group"
                        onClick={() => acknowledgeGroup(group)}
                      >
                        {t("Acknowledge All")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasNextPage && (
            <div className="load-more-container">
              <button
                className="btn-load-more"
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
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

      {selectedGroup && (
        <div className="modal-overlay" onClick={() => setSelectedGroup(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t(selectedGroup.message)}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedGroup(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {selectedGroup.itemIds.map((id) => {
                const item = allNotifications.find((n) => n.id === id);
                return item ? (
                  <div key={id} className="group-item">
                    <span className="group-item-icon">
                      {getNotificationIcon(item)}
                    </span>
                    <span className="group-item-text">
                      {item.notificationType === "insight"
                        ? `${t(item.category)} - ${t(item.message)}`
                        : formatDateTime(item.time)}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
            <div className="modal-footer">
              {selectedGroup.notificationType !== "insight" && (
                <button
                  className="btn-acknowledge"
                  onClick={() => acknowledgeGroup(selectedGroup)}
                >
                  {t("Acknowledge All")} ({selectedGroup.count})
                </button>
              )}
              <button
                className="btn-close-modal"
                onClick={() => setSelectedGroup(null)}
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <i className="fas fa-check-circle me-2"></i>{" "}
                  {t("Acknowledge")}
                </button>
              )}
              <button className="btn-close-modal" onClick={closeModal}>
                <i className="fas fa-times me-2"></i> {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
