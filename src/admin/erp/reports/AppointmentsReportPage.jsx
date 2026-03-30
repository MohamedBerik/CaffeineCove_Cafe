import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";
import { useTranslation } from "react-i18next";
import "./AppointmentsReportPage.css";

export default function AppointmentsReportPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    doctor_id: "",
    status: "",
  });

  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    in_progress: 0,
  });

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
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      const appointmentRows = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      const filtered = appointmentRows.filter((item) => {
        const dateOnly = String(item.appointment_date || "").slice(0, 10);

        if (filters.from && dateOnly < filters.from) return false;
        if (filters.to && dateOnly > filters.to) return false;

        if (
          filters.doctor_id &&
          String(item.doctor_id || "") !== String(filters.doctor_id)
        ) {
          return false;
        }

        if (
          filters.status &&
          String(item.status || "").toLowerCase() !==
            String(filters.status).toLowerCase()
        ) {
          return false;
        }

        return true;
      });

      const total = filtered.length;
      const scheduled = filtered.filter((x) => x.status === "scheduled").length;
      const completed = filtered.filter((x) => x.status === "completed").length;
      const cancelled = filtered.filter((x) => x.status === "cancelled").length;
      const no_show = filtered.filter((x) => x.status === "no_show").length;
      const in_progress = filtered.filter(
        (x) => x.status === "in_progress",
      ).length;

      setRows(filtered);
      setDoctors(doctorRows);
      setSummary({
        total,
        scheduled,
        completed,
        cancelled,
        no_show,
        in_progress,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load appointments report."),
      );
    } finally {
      setLoading(false);
    }
  };

  const doctorLabel = useMemo(() => {
    if (!filters.doctor_id) return t("All Doctors");
    const doctor = doctors.find(
      (d) => String(d.id) === String(filters.doctor_id),
    );
    return doctor?.name || `${t("Doctor")} #${filters.doctor_id}`;
  }, [filters.doctor_id, doctors]);

  const statusLabel = useMemo(() => {
    if (!filters.status) return t("All Statuses");
    const statusMap = {
      scheduled: t("Scheduled"),
      completed: t("Completed"),
      cancelled: t("Cancelled"),
      no_show: t("No Show"),
      in_progress: t("In Progress"),
    };
    return statusMap[filters.status] || filters.status;
  }, [filters.status]);

  const applyFilters = async (e) => {
    e.preventDefault();
    await loadReport();
  };

  const exportRows = () => {
    const csvRows = rows.map((row) => ({
      patient_name: row.patient?.name || "",
      patient_email: row.patient?.email || "",
      doctor_name: row.doctor?.name || row.doctor_name || "",
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      status: row.status,
      notes: row.notes || "",
    }));

    exportToCsv("appointments-report.csv", csvRows);
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
    <div className="appointments-report-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Appointments Report")}</h1>
          <p className="page-subtitle">
            {t(
              "Operational report for scheduling, completion, cancellation, and no-show trends",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Reports")}
          </Link>

          <button className="btn btn-outline-dark" onClick={printReport}>
            <i className="fas fa-print me-2"></i>
            {t("Print")}
          </button>

          <button className="btn btn-outline-success" onClick={exportRows}>
            <i className="fas fa-file-csv me-2"></i>
            {t("Export CSV")}
          </button>

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

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-user-md me-1"></i>
                  {t("Doctor")}
                </label>
                <select
                  className="form-select"
                  name="doctor_id"
                  value={filters.doctor_id}
                  onChange={handleChange}
                >
                  <option value="">{t("All Doctors")}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-tag me-1"></i>
                  {t("Status")}
                </label>
                <select
                  className="form-select"
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                >
                  <option value="">{t("All Statuses")}</option>
                  <option value="scheduled">{t("Scheduled")}</option>
                  <option value="completed">{t("Completed")}</option>
                  <option value="cancelled">{t("Cancelled")}</option>
                  <option value="no_show">{t("No Show")}</option>
                  <option value="in_progress">{t("In Progress")}</option>
                </select>
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

      {/* Summary Cards */}
      <div className="summary-grid">
        <ReportCard
          title={t("Total Appointments")}
          value={summary.total}
          color="primary"
          icon="fas fa-calendar-check"
        />
        <ReportCard
          title={t("Scheduled")}
          value={summary.scheduled}
          color="warning"
          icon="fas fa-clock"
        />
        <ReportCard
          title={t("Completed")}
          value={summary.completed}
          color="success"
          icon="fas fa-check-circle"
        />
        <ReportCard
          title={t("Cancelled")}
          value={summary.cancelled}
          color="danger"
          icon="fas fa-times-circle"
        />
        <ReportCard
          title={t("No Show")}
          value={summary.no_show}
          color="dark"
          icon="fas fa-user-slash"
        />
        <ReportCard
          title={t("In Progress")}
          value={summary.in_progress}
          color="info"
          icon="fas fa-spinner"
        />
      </div>

      {/* Report Summary Info */}
      <div className="info-card">
        <div className="info-card-header">
          <i className="fas fa-info-circle me-2"></i>
          <h5 className="mb-0">{t("Report Summary")}</h5>
          <span className="report-badge">
            {doctorLabel} | {filters.from || "-"} → {filters.to || "-"}
            {filters.status && ` | ${statusLabel}`}
          </span>
        </div>
        <div className="info-card-body">
          <p className="info-text">
            {t(
              "This report is currently built from the appointments listing response and is ready to be switched later to a dedicated reporting API.",
            )}
          </p>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="table-card">
        <div className="table-card-header">
          <i className="fas fa-table me-2"></i>
          <h5 className="mb-0">{t("Appointment Rows")}</h5>
          <span className="row-count">
            {rows.length} {t("appointments")}
          </span>
        </div>

        <div className="table-card-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times empty-icon"></i>
              <p className="empty-text">
                {t("No appointments found for this report.")}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t("Patient")}</th>
                    <th>{t("Doctor")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Time")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Notes")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("Patient")}>
                        <div className="patient-name">
                          {item.patient?.name || "-"}
                        </div>
                        <div className="patient-email">
                          {item.patient?.email || "-"}
                        </div>
                      </td>
                      <td data-label={t("Doctor")}>
                        {item.doctor?.name || item.doctor_name || "-"}
                      </td>
                      <td data-label={t("Date")}>
                        {formatDate(item.appointment_date)}
                      </td>
                      <td data-label={t("Time")}>
                        {String(item.appointment_time || "").slice(0, 5) || "-"}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge status={item.status} t={t} />
                      </td>
                      <td data-label={t("Notes")} className="notes-cell">
                        {item.notes || "-"}
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          {item.patient?.id && (
                            <Link
                              to={`/admin/erp/patients/${item.patient.id}/profile`}
                              className="btn btn-sm btn-outline-primary"
                              title={t("View Patient")}
                            >
                              <i className="fas fa-user"></i>
                              <span>{t("Patient")}</span>
                            </Link>
                          )}
                          <Link
                            to={`/admin/erp/appointments/${item.id}/activity`}
                            className="btn btn-sm btn-outline-secondary"
                            title={t("View Activity")}
                          >
                            <i className="fas fa-history"></i>
                            <span>{t("Activity")}</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ReportCard Component
function ReportCard({ title, value, color = "primary", icon }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="report-card">
      <div
        className="report-icon"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <i className={icon}></i>
      </div>
      <div className="report-content">
        <div className="report-title">{title}</div>
        <div className="report-value" style={{ color: colors.text }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// StatusBadge Component
function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled" || value === "no_show") {
    variant = "danger";
    label = t(value === "cancelled" ? "Cancelled" : "No Show");
  } else if (value === "scheduled") {
    variant = "warning";
    label = t("Scheduled");
  } else if (value === "in_progress") {
    variant = "info";
    label = t("In Progress");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}
