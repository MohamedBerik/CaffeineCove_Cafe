import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";
import { useTranslation } from "react-i18next";
import "./TreatmentPlansReportPage.css";

export default function TreatmentPlansReportPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    status: "",
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_plans: 0,
    total_cost: 0,
    total_paid: 0,
    total_remaining: 0,
    completion_rate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n?.language === "ar" ? "ar-EG" : "en-US";
    try {
      return new Intl.NumberFormat(lang, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    } catch {
      return `$${Number(value || 0).toFixed(2)}`;
    }
  };

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

      const res = await axios.get("/erp/treatment-plans", { timeout: 30000 });
      const payload = res.data || {};

      let planRows = [];
      if (Array.isArray(payload.data)) {
        planRows = payload.data;
      } else if (payload.data?.data && Array.isArray(payload.data.data)) {
        planRows = payload.data.data;
      }

      // فلترة حسب التاريخ والحالة
      const filtered = planRows.filter((plan) => {
        const createdAt = plan.created_at
          ? String(plan.created_at).slice(0, 10)
          : "";

        if (filters.from && createdAt < filters.from) return false;
        if (filters.to && createdAt > filters.to) return false;
        if (filters.status && plan.status !== filters.status) return false;
        return true;
      });

      // تطبيع البيانات
      const normalized = filtered.map((plan) => ({
        id: plan.id,
        title: plan.title || "-",
        patient_name: plan.customer?.name || "-",
        patient_email: plan.customer?.email || "",
        total_cost: Number(plan.total_cost || 0),
        total_paid: Number(plan.total_paid || 0),
        net_paid: Number(plan.net_paid || 0),
        remaining: Number(plan.remaining || 0),
        status: plan.status || "-",
        created_at: plan.created_at || null,
      }));

      const totalPlans = normalized.length;
      const totalCost = normalized.reduce((s, p) => s + p.total_cost, 0);
      const totalPaid = normalized.reduce((s, p) => s + p.total_paid, 0);
      const totalRemaining = normalized.reduce((s, p) => s + p.remaining, 0);
      const completedCount = normalized.filter(
        (p) => p.status === "completed",
      ).length;
      const completionRate = totalPlans
        ? Math.round((completedCount / totalPlans) * 100)
        : 0;

      setRows(normalized);
      setSummary({
        total_plans: totalPlans,
        total_cost: totalCost,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        completion_rate: completionRate,
      });
    } catch (err) {
      let message = t("Failed to load treatment plans report.");
      if (err.response?.data?.message) message = err.response.data.message;
      else if (err.response?.data?.msg) message = err.response.data.msg;
      setError(message);
      setRows([]);
      setSummary({
        total_plans: 0,
        total_cost: 0,
        total_paid: 0,
        total_remaining: 0,
        completion_rate: 0,
      });
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
      title: row.title,
      patient: row.patient_name,
      email: row.patient_email,
      total_cost: row.total_cost,
      total_paid: row.total_paid,
      net_paid: row.net_paid,
      remaining: row.remaining,
      status: row.status,
      created_at: formatDate(row.created_at),
    }));
    exportToCsv("treatment-plans-report.csv", csvRows);
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
    <div className="treatment-plans-report-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Treatment Plans Report")}</h1>
          <p className="page-subtitle">
            {t("Overview of all treatment plans, costs, and payments")}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Reports")}
          </Link>

          <Link
            to={`/admin/erp/reports/treatment-plans/print?from=${filters.from}&to=${filters.to}&status=${filters.status}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark"
          >
            <i className="fas fa-print me-2"></i>
            {t("Print")}
          </Link>

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
                  <option value="active">{t("Active")}</option>
                  <option value="completed">{t("Completed")}</option>
                  <option value="cancelled">{t("Cancelled")}</option>
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
          title={t("Total Plans")}
          value={summary.total_plans}
          color="primary"
          icon="fas fa-notes-medical"
        />
        <ReportCard
          title={t("Total Cost")}
          value={formatCurrency(summary.total_cost)}
          color="warning"
          icon="fas fa-dollar-sign"
        />
        <ReportCard
          title={t("Total Paid")}
          value={formatCurrency(summary.total_paid)}
          color="success"
          icon="fas fa-check-circle"
        />
        <ReportCard
          title={t("Total Remaining")}
          value={formatCurrency(summary.total_remaining)}
          color="danger"
          icon="fas fa-hourglass-half"
        />
        <ReportCard
          title={t("Completion Rate")}
          value={`${summary.completion_rate}%`}
          color="info"
          icon="fas fa-chart-pie"
        />
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-card-header">
          <i className="fas fa-table me-2"></i>
          <h5 className="mb-0">{t("Plan Rows")}</h5>
          <span className="row-count">
            {rows.length} {t("plans")}
          </span>
        </div>
        <div className="table-card-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-folder-open empty-icon"></i>
              <p className="empty-text">{t("No treatment plans found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t("Title")}</th>
                    <th>{t("Patient")}</th>
                    <th>{t("Total Cost")}</th>
                    <th>{t("Total Paid")}</th>
                    <th>{t("Net Paid")}</th>
                    <th>{t("Remaining")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Created")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t("Title")}>{row.title}</td>
                      <td data-label={t("Patient")}>
                        <div>{row.patient_name}</div>
                        {row.patient_email && (
                          <small className="text-muted">
                            {row.patient_email}
                          </small>
                        )}
                      </td>
                      <td data-label={t("Total Cost")} className="amount-cell">
                        {formatCurrency(row.total_cost)}
                      </td>
                      <td
                        data-label={t("Total Paid")}
                        className="amount-cell success"
                      >
                        {formatCurrency(row.total_paid)}
                      </td>
                      <td
                        data-label={t("Net Paid")}
                        className="amount-cell info"
                      >
                        {formatCurrency(row.net_paid)}
                      </td>
                      <td
                        data-label={t("Remaining")}
                        className={`amount-cell ${row.remaining > 0 ? "warning" : "success"}`}
                      >
                        {formatCurrency(row.remaining)}
                      </td>
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

// Helper components similar to previous reports
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
    variant = "warning";
    label = t("Active");
  } else if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  }
  return <span className={`status-badge status-${variant}`}>{label}</span>;
}
