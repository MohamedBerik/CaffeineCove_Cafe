import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";
import { useTranslation } from "react-i18next";
import "./DoctorPerformanceReportPage.css";

export default function DoctorPerformanceReportPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const appointments = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctors = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      const filtered = appointments.filter((a) => {
        const d = String(a.appointment_date || "").slice(0, 10);

        if (filters.from && d < filters.from) return false;
        if (filters.to && d > filters.to) return false;

        return true;
      });

      const doctorStats = doctors.map((doc) => {
        const items = filtered.filter(
          (a) => String(a.doctor_id) === String(doc.id),
        );

        const total = items.length;
        const completed = items.filter((x) => x.status === "completed").length;
        const cancelled = items.filter((x) => x.status === "cancelled").length;
        const no_show = items.filter((x) => x.status === "no_show").length;
        const scheduled = items.filter((x) => x.status === "scheduled").length;

        const completionRate = total
          ? Math.round((completed / total) * 100)
          : 0;

        return {
          id: doc.id,
          name: doc.name,
          specialty: doc.specialty || "-",
          total,
          completed,
          cancelled,
          no_show,
          scheduled,
          completionRate,
        };
      });

      setRows(doctorStats);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load doctor performance report."),
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    await loadReport();
  };

  const exportRows = () => {
    const csvRows = rows.map((row) => ({
      doctor_name: row.name,
      specialty: row.specialty,
      total_appointments: row.total,
      completed: row.completed,
      scheduled: row.scheduled,
      cancelled: row.cancelled,
      no_show: row.no_show,
      completion_rate: `${row.completionRate}%`,
    }));

    exportToCsv("doctor-performance-report.csv", csvRows);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-performance-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Doctor Performance Report")}</h1>
          <p className="page-subtitle">
            {t(
              "Compare doctors by appointments, completion rate, and attendance",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Reports")}
          </Link>

          <Link
            to={`/admin/erp/reports/doctors/print?from=${filters.from}&to=${filters.to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark"
          >
            <i className="fas fa-print me-2"></i>
            {t("Print")}
          </Link>

          <button className="btn btn-primary" onClick={loadReport}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Filters")}</h5>
        </div>
        <div className="filters-card-body">
          <form onSubmit={applyFilters}>
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-calendar-alt me-1"></i>
                  {t("From Date")}
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="from"
                  value={filters.from}
                  onChange={handleChange}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-calendar-alt me-1"></i>
                  {t("To Date")}
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="to"
                  value={filters.to}
                  onChange={handleChange}
                />
              </div>

              <div className="filter-actions">
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-search me-2"></i>
                  {t("Apply Filters")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              backgroundColor: "rgba(26, 35, 126, 0.1)",
              color: "#1a237e",
            }}
          >
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-content">
            <div className="stat-title">{t("Total Doctors")}</div>
            <div className="stat-value">{rows.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              color: "#4caf50",
            }}
          >
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-title">{t("Total Appointments")}</div>
            <div className="stat-value">
              {rows.reduce((sum, r) => sum + r.total, 0)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              color: "#2196f3",
            }}
          >
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <div className="stat-title">{t("Avg Completion Rate")}</div>
            <div className="stat-value">
              {rows.length
                ? `${Math.round(rows.reduce((sum, r) => sum + r.completionRate, 0) / rows.length)}%`
                : "0%"}
            </div>
          </div>
        </div>
      </div>

      {/* Report Period Info */}
      <div className="period-info">
        <i className="fas fa-calendar-alt me-2"></i>
        <span>
          {t("Report Period")}: {formatDate(filters.from) || "-"} →{" "}
          {formatDate(filters.to) || "-"}
        </span>
      </div>

      {/* Doctors Table */}
      <div className="doctors-table-card">
        <div className="table-card-header">
          <i className="fas fa-chart-bar me-2"></i>
          <h5 className="mb-0">{t("Doctor Statistics")}</h5>
          <span className="doctor-count">
            {rows.length} {t("doctors")}
          </span>
        </div>

        <div className="table-card-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-chart-line empty-icon"></i>
              <p className="empty-text">{t("No data available.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>{t("Doctor")}</th>
                    <th>{t("Specialty")}</th>
                    <th>{t("Total")}</th>
                    <th>{t("Completed")}</th>
                    <th>{t("Scheduled")}</th>
                    <th>{t("Cancelled")}</th>
                    <th>{t("No Show")}</th>
                    <th>{t("Completion Rate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    let rateClass = "rate-low";
                    if (row.completionRate >= 70) rateClass = "rate-high";
                    else if (row.completionRate >= 40)
                      rateClass = "rate-medium";

                    return (
                      <tr key={row.id}>
                        <td data-label={t("Doctor")}>
                          <div className="doctor-name">{row.name}</div>
                        </td>
                        <td data-label={t("Specialty")}>
                          <span className="specialty-badge">
                            {row.specialty}
                          </span>
                        </td>
                        <td data-label={t("Total")} className="stat-number">
                          {row.total}
                        </td>
                        <td
                          data-label={t("Completed")}
                          className="stat-number success"
                        >
                          {row.completed}
                        </td>
                        <td
                          data-label={t("Scheduled")}
                          className="stat-number warning"
                        >
                          {row.scheduled}
                        </td>
                        <td
                          data-label={t("Cancelled")}
                          className="stat-number danger"
                        >
                          {row.cancelled}
                        </td>
                        <td
                          data-label={t("No Show")}
                          className="stat-number danger"
                        >
                          {row.no_show}
                        </td>
                        <td data-label={t("Completion Rate")}>
                          <div className="rate-container">
                            <div className={`rate-badge ${rateClass}`}>
                              {row.completionRate}%
                            </div>
                            <div className="rate-bar">
                              <div
                                className={`rate-bar-fill ${rateClass}`}
                                style={{ width: `${row.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
