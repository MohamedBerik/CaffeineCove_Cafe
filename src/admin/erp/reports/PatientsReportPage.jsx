import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";
import { useTranslation } from "react-i18next";
import "./PatientsReportPage.css";

export default function PatientsReportPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    gender: "",
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    male: 0,
    female: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n?.language === "ar" ? "ar-EG" : "en-US";
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

      const res = await axios.get("/erp/customers", { timeout: 30000 });
      const payload = res.data || {};

      let patientRows = [];
      if (Array.isArray(payload.data)) {
        patientRows = payload.data;
      } else if (payload.data?.data && Array.isArray(payload.data.data)) {
        patientRows = payload.data.data;
      }

      // تطبيق الفلاتر: تاريخ الإنشاء والجنس
      const filtered = patientRows.filter((p) => {
        const createdAt = p.created_at ? String(p.created_at).slice(0, 10) : "";

        if (filters.from && createdAt < filters.from) return false;
        if (filters.to && createdAt > filters.to) return false;
        if (filters.gender && p.gender !== filters.gender) return false;
        return true;
      });

      // تطبيع البيانات
      const normalized = filtered.map((p) => ({
        id: p.id,
        patient_code: p.patient_code || "-",
        name: p.name || "-",
        email: p.email || "-",
        phone: p.phone || "-",
        gender: p.gender || "-",
        gender_label: p.gender_label || p.gender || "-",
        date_of_birth: p.date_of_birth || null,
        age: p.age,
        status: p.status === "1" || p.status === "1" ? "active" : "inactive",
        status_label: p.status === "1" ? t("Active") : t("Inactive"),
        created_at: p.created_at || null,
      }));

      const total = normalized.length;
      const active = normalized.filter((p) => p.status === "active").length;
      const inactive = total - active;
      const male = normalized.filter((p) => p.gender === "male").length;
      const female = normalized.filter((p) => p.gender === "female").length;

      setRows(normalized);
      setSummary({ total, active, inactive, male, female });
    } catch (err) {
      let message = t("Failed to load patients report.");
      if (err.response?.data?.message) message = err.response.data.message;
      else if (err.response?.data?.msg) message = err.response.data.msg;
      setError(message);
      setRows([]);
      setSummary({ total: 0, active: 0, inactive: 0, male: 0, female: 0 });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    await loadReport();
  };

  const exportRows = () => {
    const csvRows = rows.map((r) => ({
      patient_code: r.patient_code,
      name: r.name,
      email: r.email,
      phone: r.phone,
      gender: r.gender_label,
      date_of_birth: r.date_of_birth,
      age: r.age,
      status: r.status_label,
      created_at: formatDate(r.created_at),
    }));
    exportToCsv("patients-report.csv", csvRows);
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
    <div className="patients-report-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Patients Report")}</h1>
          <p className="page-subtitle">
            {t("Overview of registered patients, demographics, and status")}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Reports")}
          </Link>

          <Link
            to={`/admin/erp/reports/patients/print?from=${filters.from}&to=${filters.to}&gender=${filters.gender}`}
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

      {/* Filters */}
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
                  <i className="fas fa-venus-mars me-1"></i>
                  {t("Gender")}
                </label>
                <select
                  className="form-select"
                  name="gender"
                  value={filters.gender}
                  onChange={handleChange}
                >
                  <option value="">{t("All Genders")}</option>
                  <option value="male">{t("Male")}</option>
                  <option value="female">{t("Female")}</option>
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
          title={t("Total Patients")}
          value={summary.total}
          color="primary"
          icon="fas fa-users"
        />
        <ReportCard
          title={t("Active")}
          value={summary.active}
          color="success"
          icon="fas fa-user-check"
        />
        <ReportCard
          title={t("Inactive")}
          value={summary.inactive}
          color="danger"
          icon="fas fa-user-times"
        />
        <ReportCard
          title={t("Male")}
          value={summary.male}
          color="info"
          icon="fas fa-male"
        />
        <ReportCard
          title={t("Female")}
          value={summary.female}
          color="warning"
          icon="fas fa-female"
        />
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-card-header">
          <i className="fas fa-table me-2"></i>
          <h5 className="mb-0">{t("Patient Rows")}</h5>
          <span className="row-count">
            {rows.length} {t("patients")}
          </span>
        </div>
        <div className="table-card-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-slash empty-icon"></i>
              <p className="empty-text">{t("No patients found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t("Code")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("Email")}</th>
                    <th>{t("Phone")}</th>
                    <th>{t("Gender")}</th>
                    <th>{t("Date of Birth")}</th>
                    <th>{t("Age")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Created")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t("Code")}>
                        <span className="patient-code">{row.patient_code}</span>
                      </td>
                      <td data-label={t("Name")}>{row.name}</td>
                      <td data-label={t("Email")}>{row.email}</td>
                      <td data-label={t("Phone")}>{row.phone}</td>
                      <td data-label={t("Gender")}>{row.gender_label}</td>
                      <td data-label={t("Date of Birth")}>
                        {formatDate(row.date_of_birth)}
                      </td>
                      <td data-label={t("Age")}>{row.age ?? "-"}</td>
                      <td data-label={t("Status")}>
                        <StatusBadge status={row.status} t={t} />
                      </td>
                      <td data-label={t("Created")}>
                        {formatDate(row.created_at)}
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

// --- Sub-components ---
function ReportCard({ title, value, color = "primary", icon }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="report-card">
      <div
        className="report-icon"
        style={{ backgroundColor: c.bg, color: c.text }}
      >
        <i className={icon}></i>
      </div>
      <div className="report-content">
        <div className="report-title">{title}</div>
        <div className="report-value" style={{ color: c.text }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";
  if (value === "active") {
    variant = "success";
    label = t("Active");
  }
  if (value === "inactive") {
    variant = "danger";
    label = t("Inactive");
  }
  return <span className={`status-badge status-${variant}`}>{label}</span>;
}
