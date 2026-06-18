import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../services/axios";
import SecurityCard from "./components/SecurityCard";
import SecurityFilters from "./components/SecurityFilters";
import EmptyState from "../dashboard/components/EmptyState";
import { useAuth } from "../../../context/AuthContext";
import "./SecurityFeedPage.css";

export default function SecurityFeedPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    email: "",
    date: "",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const fetchEvents = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { limit: 10, page };
        if (filters.type) params.type = filters.type;
        if (filters.email) params.email = filters.email;
        if (filters.date) params.date = filters.date;

        const res = await api.get("/erp/security-events", { params });
        setEvents(res.data.data || []);
        setPagination({
          current_page: res.data.meta.current_page,
          last_page: res.data.meta.last_page,
          total: res.data.meta.total,
        });
      } catch (error) {
        console.error("Failed to fetch security events", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page) => {
    fetchEvents(page);
  };

  // التحقق من صلاحية الوصول
  if (!user?.is_super_admin && user?.role !== "admin") {
    return (
      <div className="security-feed-page">
        <EmptyState text={t("You don't have permission to view this page")} />
      </div>
    );
  }

  return (
    <div className="security-feed-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">🚨 {t("Security Feed")}</h1>
          <p className="page-subtitle">
            {t(
              "Monitor suspicious activities, failed logins, and admin overrides",
            )}
          </p>
        </div>
        <div className="stats-badge">
          <i className="fas fa-shield-alt"></i>
          <span>
            {pagination.total} {t("events")}
          </span>
        </div>
      </div>

      {/* Filters */}
      <SecurityFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Events List */}
      <div className="security-events-list">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i> {t("Loading...")}
          </div>
        ) : events.length === 0 ? (
          <EmptyState text={t("No security events found")} />
        ) : (
          events.map((event) => <SecurityCard key={event.id} event={event} />)
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="pagination-controls">
          <button
            className="btn btn-outline-secondary"
            disabled={pagination.current_page === 1}
            onClick={() => handlePageChange(pagination.current_page - 1)}
          >
            <i className="fas fa-chevron-left"></i> {t("Previous")}
          </button>
          <span className="page-info">
            {t("Page")} {pagination.current_page} {t("of")}{" "}
            {pagination.last_page}
          </span>
          <button
            className="btn btn-outline-secondary"
            disabled={pagination.current_page === pagination.last_page}
            onClick={() => handlePageChange(pagination.current_page + 1)}
          >
            {t("Next")} <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
