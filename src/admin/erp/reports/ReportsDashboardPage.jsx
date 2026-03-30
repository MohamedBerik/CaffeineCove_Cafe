import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ReportsDashboardPage.css";

export default function ReportsDashboardPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    doctor_id: "",
  });

  const reportCards = useMemo(
    () => [
      {
        titleKey: "Revenue Report",
        descriptionKey: "revenue_report_desc",
        icon: "fas fa-money-bill-wave",
        color: "success",
        to: "/admin/erp/reports/revenue",
      },
      {
        titleKey: "Appointments Report",
        descriptionKey: "appointments_report_desc",
        icon: "fas fa-calendar-check",
        color: "primary",
        to: "/admin/erp/reports/appointments",
      },
      {
        titleKey: "Doctor Performance",
        descriptionKey: "doctor_performance_desc",
        icon: "fas fa-user-md",
        color: "info",
        to: "/admin/erp/reports/doctors",
      },
      {
        titleKey: "Analytics Dashboard",
        descriptionKey: "analytics_dashboard_desc",
        icon: "fas fa-chart-line",
        color: "primary",
        to: "/admin/erp/reports/analytics",
      },
      {
        titleKey: "Payments Report",
        descriptionKey: "payments_report_desc",
        icon: "fas fa-credit-card",
        color: "warning",
        to: "/admin/erp/reports/payments",
      },
      {
        titleKey: "Treatment Plans Report",
        descriptionKey: "treatment_plans_report_desc",
        icon: "fas fa-notes-medical",
        color: "secondary",
        to: "/admin/erp/reports/treatment-plans",
      },
      {
        titleKey: "Patients Report",
        descriptionKey: "patients_report_desc",
        icon: "fas fa-users",
        color: "dark",
        to: "/admin/erp/reports/patients",
      },
    ],
    [],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  return (
    <div className="reports-dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Clinic Reports")}</h1>
          <p className="page-subtitle">
            {t(
              "Reporting hub for finance, appointments, doctors, and patient activity",
            )}
          </p>
        </div>

        <Link to="/admin/erp" className="btn btn-outline-secondary">
          <i className="fas fa-tachometer-alt me-2"></i>
          {t("Back to Dashboard")}
        </Link>
      </div>

      {/* Global Filters Card */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-globe me-2"></i>
          <h5 className="mb-0">{t("Global Filters")}</h5>
        </div>

        <div className="filters-card-body">
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
                {t("Doctor ID")}
              </label>
              <input
                type="number"
                className="form-control"
                name="doctor_id"
                value={filters.doctor_id}
                onChange={handleChange}
                placeholder={t("Optional")}
              />
            </div>
          </div>

          <div className="filters-note">
            <i className="fas fa-info-circle me-1"></i>
            {t(
              "These filters are UI-ready and can be wired to report APIs next.",
            )}
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="reports-grid">
        {reportCards.map((card) => (
          <Link to={card.to} className="report-card-link" key={card.to}>
            <div className="report-card">
              <div className="report-card-header">
                <div className={`report-icon ${card.color}`}>
                  <i className={card.icon}></i>
                </div>
                <span className="report-badge">{t("Report")}</span>
              </div>
              <h5 className="report-title">{t(card.titleKey)}</h5>
              <p className="report-description">{t(card.descriptionKey)}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recommended Reports Section */}
      <div className="recommended-card">
        <div className="recommended-card-header">
          <i className="fas fa-star me-2"></i>
          <h5 className="mb-0">{t("Recommended First Reports")}</h5>
        </div>

        <div className="recommended-card-body">
          <div className="recommended-grid">
            <ReportHint
              title={t("Revenue Report")}
              text={t("revenue_hint_text")}
            />
            <ReportHint
              title={t("Appointments Report")}
              text={t("appointments_hint_text")}
            />
            <ReportHint
              title={t("Doctor Performance")}
              text={t("doctor_performance_hint_text")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ReportHint Component
function ReportHint({ title, text }) {
  return (
    <div className="report-hint">
      <div className="report-hint-icon">
        <i className="fas fa-lightbulb"></i>
      </div>
      <div className="report-hint-content">
        <div className="report-hint-title">{title}</div>
        <div className="report-hint-text">{text}</div>
      </div>
    </div>
  );
}
