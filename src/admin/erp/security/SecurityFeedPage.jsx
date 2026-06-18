import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/axios";
import SecurityCard from "./components/SecurityCard";
import SecurityFilters from "./components/SecurityFilters";
import useSecurityFeedSocket from "../../../hooks/useSecurityFeedSocket";
import EmptyState from "../dashboard/components/EmptyState";
import "./SecurityFeedPage.css";

export default function SecurityFeedPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    type: "",
    email: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState([]);

  // ✅ جلب البيانات من الـ API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["security-events", page, filters],
    queryFn: async () => {
      const params = { page, limit: 10, ...filters };
      const res = await api.get("/erp/security-events", { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  // ✅ تحديث الأحداث عبر WebSocket
  useSecurityFeedSocket((newEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // ✅ دمج البيانات الواردة من الـ socket مع البيانات القادمة من الـ API
  const displayedEvents = useMemo(() => {
    const apiEvents = data?.data ?? [];
    // دمج مع الحفاظ على الترتيب الزمني ومنع التكرار
    const merged = [...events];
    apiEvents.forEach((apiEvent) => {
      if (!merged.some((e) => e.id === apiEvent.id)) {
        merged.push(apiEvent);
      }
    });
    return merged.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [data, events]);

  return (
    <div className="container py-4">
      <div className="page-header mb-4">
        <h2>🚨 {t("Security Feed")}</h2>
        <p className="text-muted">
          {t("Monitor all security-related events in real-time")}
        </p>
      </div>

      <SecurityFilters filters={filters} onChange={handleFilterChange} />

      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t("Loading...")}</span>
          </div>
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">
          {t("Failed to load security events")}: {error.message}
        </div>
      )}

      {!isLoading && !isError && displayedEvents.length === 0 && (
        <EmptyState text={t("No security events found.")} />
      )}

      <div className="row">
        {displayedEvents.map((event) => (
          <div className="col-12 mb-3" key={event.id}>
            <SecurityCard event={event} />
          </div>
        ))}
      </div>

      {data?.meta && data.meta.last_page > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <button
            className="btn btn-outline-primary me-2"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("Previous")}
          </button>
          <span className="align-self-center">
            {t("Page {{current}} of {{total}}", {
              current: page,
              total: data.meta.last_page,
            })}
          </span>
          <button
            className="btn btn-outline-primary ms-2"
            disabled={page >= data.meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("Next")}
          </button>
        </div>
      )}
    </div>
  );
}
