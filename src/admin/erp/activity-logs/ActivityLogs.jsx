import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/axios";
import "./ActivityLogs.css";

export default function ActivityLogs() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  // ========================= Queries =========================
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["activity-logs", page, search, actionFilter],
    queryFn: async () => {
      const res = await api.get("/admin/activity-logs", {
        params: {
          page,
          search,
          action: actionFilter,
          per_page: 20,
          all_companies: true, // ✅ عشان Super Admin يشوف كل الشركات
        },
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  // ========================= Helpers =========================
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

  const getActionLabel = (action) => {
    const actions = {
      "company.created": t("Company Created"),
      "company.updated": t("Company Updated"),
      "company.deleted": t("Company Deleted"),
      "company.activated": t("Company Activated"),
      "company.suspended": t("Company Suspended"),
      "user.created": t("User Created"),
      "user.updated": t("User Updated"),
      "user.deleted": t("User Deleted"),
      "product.created": t("Product Created"),
      "product.updated": t("Product Updated"),
      "product.deleted": t("Product Deleted"),
      "invoice.created": t("Invoice Created"),
      "invoice.updated": t("Invoice Updated"),
      "payment.created": t("Payment Created"),
      "appointment.created": t("Appointment Created"),
      "appointment.updated": t("Appointment Updated"),
    };
    return actions[action] || action;
  };

  const getActionIcon = (action) => {
    if (action.includes("created")) return "fa-plus-circle";
    if (action.includes("updated")) return "fa-edit";
    if (action.includes("deleted")) return "fa-trash";
    if (action.includes("activated")) return "fa-check-circle";
    if (action.includes("suspended")) return "fa-pause-circle";
    return "fa-info-circle";
  };

  const getActionColor = (action) => {
    if (action.includes("created") || action.includes("activated"))
      return "success";
    if (action.includes("updated")) return "info";
    if (action.includes("deleted") || action.includes("suspended"))
      return "danger";
    return "secondary";
  };

  const logs = logsData?.data || [];
  const meta = logsData?.meta || {};

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="activity-logs-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading activity logs...")}</p>
      </div>
    );
  }

  // ========================= Error State =========================
  if (error) {
    return (
      <div className="activity-logs-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{t("Something went wrong")}</h3>
        <p>{error.message}</p>
        <button className="btn-retry" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="activity-logs-container">
      {/* Header */}
      <div className="activity-logs-header">
        <div className="header-title">
          <h1>{t("Activity Logs")}</h1>
          <p>{t("Monitor all activities across your platform")}</p>
        </div>
        <button className="btn-refresh" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Refresh")}
        </button>
      </div>

      {/* Filters */}
      <div className="activity-logs-filters">
        <div className="search-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={t("Search by action, user, or subject...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-wrapper">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("All Actions")}</option>
            <option value="company.created">{t("Company Created")}</option>
            <option value="company.updated">{t("Company Updated")}</option>
            <option value="user.created">{t("User Created")}</option>
            <option value="product.created">{t("Product Created")}</option>
            <option value="invoice.created">{t("Invoice Created")}</option>
            <option value="payment.created">{t("Payment Created")}</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="activity-logs-list">
        {logs.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-history"></i>
            <p>{t("No activity logs found")}</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`log-item log-${getActionColor(log.action)}`}
            >
              <div className="log-icon">
                <i className={`fas ${getActionIcon(log.action)}`}></i>
              </div>
              <div className="log-content">
                <div className="log-header">
                  <span className="log-action">
                    {getActionLabel(log.action)}
                  </span>
                  <span className="log-time">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
                <div className="log-details">
                  {log.user_name && (
                    <span className="log-user">
                      <i className="fas fa-user"></i>
                      {log.user_name}
                    </span>
                  )}
                  {log.company_id && (
                    <span className="log-company">
                      <i className="fas fa-building"></i>
                      Company #{log.company_id}
                    </span>
                  )}
                  {log.subject_type && (
                    <span className="log-subject">
                      <i className="fas fa-tag"></i>
                      {log.subject_type.split("\\").pop()} #{log.subject_id}
                    </span>
                  )}
                </div>
                {log.properties && Object.keys(log.properties).length > 0 && (
                  <div className="log-properties">
                    <details>
                      <summary>{t("View Details")}</summary>
                      <pre>{JSON.stringify(log.properties, null, 2)}</pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="activity-logs-pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <span className="pagination-info">
            {t("Page {{current}} of {{total}}", {
              current: meta.current_page,
              total: meta.last_page,
            })}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === meta.last_page}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
