import { useEffect, useMemo, useState } from "react";
import axios from "../../services/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("/erp/dashboard");
      setData(res.data?.data ?? null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load ERP dashboard."),
      );
    } finally {
      setLoading(false);
    }
  };

  // دالة لتنسيق العملة حسب اللغة
  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  // دالة لتنسيق التاريخ والوقت حسب اللغة
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

  // دالة لتنسيق التاريخ حسب اللغة
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

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={loadDashboard}
        >
          {t("Retry")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-warning">
        {t("No dashboard data available.")}
      </div>
    );
  }

  const kpis = data.kpis || {};
  const recentAppointments = data.recent_appointments || [];
  const recentInvoices = data.recent_invoices || [];
  const recentPayments = data.recent_payments || [];

  return (
    <div className="erp-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-text">
          <h1 className="dashboard-title">{t("ERP Dashboard")}</h1>
          <p className="dashboard-subtitle">
            {t("Clinic operations, billing, and payment overview")}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/visits/start" className="btn btn-primary">
            <i className="fas fa-stethoscope me-2"></i>
            {t("Start Visit")}
          </Link>

          <button
            className="btn btn-outline-secondary refresh-btn"
            onClick={loadDashboard}
            title={t("Refresh")}
          >
            <i className="fas fa-arrow-rotate-right"></i>
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="kpis-grid">
        <KpiCard
          title={t("Appointments Today")}
          value={kpis.today_appointments_count ?? 0}
          icon="fas fa-calendar-day"
          color="primary"
          link="/admin/erp/appointments/calendar"
        />

        <KpiCard
          title={t("Scheduled Today")}
          value={kpis.scheduled_today_count ?? 0}
          icon="fas fa-clock"
          color="info"
        />

        <KpiCard
          title={t("Completed Today")}
          value={kpis.completed_today_count ?? 0}
          icon="fas fa-check-circle"
          color="success"
        />

        <KpiCard
          title={t("Cancelled / No Show")}
          value={`${kpis.cancelled_today_count ?? 0} / ${kpis.no_show_today_count ?? 0}`}
          icon="fas fa-times-circle"
          color="danger"
        />

        <KpiCard
          title={t("Unpaid Invoices")}
          value={kpis.unpaid_invoices_count ?? 0}
          icon="fas fa-file-invoice"
          color="warning"
          link="/admin/erp/invoices"
        />

        <KpiCard
          title={t("Partially Paid")}
          value={kpis.partially_paid_invoices_count ?? 0}
          icon="fas fa-receipt"
          color="secondary"
        />

        <KpiCard
          title={t("Today Revenue")}
          value={formatCurrency(kpis.today_revenue)}
          icon="fas fa-money-bill-wave"
          color="success"
        />

        <KpiCard
          title={t("Month Revenue")}
          value={formatCurrency(kpis.month_revenue)}
          icon="fas fa-chart-line"
          color="dark"
        />

        <KpiCard
          title={t("Customer Credit Balance")}
          value={formatCurrency(kpis.credit_balance_total)}
          icon="fas fa-wallet"
          color="primary"
          link="/admin/erp/patients"
        />

        <KpiCard
          title={t("Paid Invoices")}
          value={kpis.paid_invoices_count ?? 0}
          icon="fas fa-check-double"
          color="success"
          link="/admin/erp/invoices"
        />
      </div>

      {/* Tables Section */}
      <div className="tables-grid">
        {/* Recent Appointments Table */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <h5 className="card-title">
              <i className="fas fa-calendar-alt me-2"></i>
              {t("Recent Appointments")}
            </h5>
            <Link
              to="/admin/erp/appointments/calendar"
              className="btn btn-sm btn-link"
            >
              {t("View All")} <i className="fas fa-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="card-body-custom">
            {recentAppointments.length === 0 ? (
              <EmptyState text={t("No recent appointments.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Patient")}</th>
                      <th>{t("Doctor")}</th>
                      <th>{t("Date")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Patient")}>
                          {item.patient?.id ? (
                            <Link
                              to={`/admin/erp/patients/${item.patient.id}/profile`}
                              className="patient-link"
                            >
                              {item.patient?.name || "-"}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td data-label={t("Doctor")}>
                          {item.doctor?.name || item.doctor_name || "-"}
                        </td>
                        <td data-label={t("Date")}>
                          {item.appointment_date}{" "}
                          {String(item.appointment_time || "").slice(0, 5)}
                        </td>
                        <td data-label={t("Status")}>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <h5 className="card-title">
              <i className="fas fa-file-invoice me-2"></i>
              {t("Recent Invoices")}
            </h5>
            <Link to="/admin/erp/invoices" className="btn btn-sm btn-link">
              {t("View All")} <i className="fas fa-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="card-body-custom">
            {recentInvoices.length === 0 ? (
              <EmptyState text={t("No recent invoices.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Number")}</th>
                      <th>{t("Total")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Issued")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Number")}>
                          <Link
                            to={`/admin/erp/invoices/${item.id}`}
                            className="invoice-link"
                          >
                            {item.number}
                          </Link>
                        </td>
                        <td data-label={t("Total")} className="fw-semibold">
                          {formatCurrency(item.total)}
                        </td>
                        <td data-label={t("Status")}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td data-label={t("Issued")}>
                          {formatDate(item.issued_at || item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <h5 className="card-title">
              <i className="fas fa-credit-card me-2"></i>
              {t("Recent Payments")}
            </h5>
            <Link to="/admin/erp/invoices" className="btn btn-sm btn-link">
              {t("View All")} <i className="fas fa-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="card-body-custom">
            {recentPayments.length === 0 ? (
              <EmptyState text={t("No recent payments.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Invoice")}</th>
                      <th>{t("Applied")}</th>
                      <th>{t("Method")}</th>
                      <th>{t("Paid At")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Invoice")}>
                          <Link
                            to={`/admin/erp/invoices/${item.invoice_id}`}
                            className="invoice-link"
                          >
                            #{item.invoice_id}
                          </Link>
                        </td>
                        <td
                          data-label={t("Applied")}
                          className="fw-semibold text-success"
                        >
                          {formatCurrency(item.applied_amount)}
                        </td>
                        <td
                          data-label={t("Method")}
                          className="text-capitalize"
                        >
                          {item.method || "-"}
                        </td>
                        <td data-label={t("Paid At")}>
                          {formatDateTime(item.paid_at || item.created_at)}
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
    </div>
  );
}

// KpiCard Component - Improved
function KpiCard({ title, value, icon, color = "primary", link }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    secondary: { bg: "rgba(108, 117, 125, 0.1)", text: "#6c757d" },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529" },
  };

  const colors = colorMap[color] || colorMap.primary;

  const cardContent = (
    <div className="kpi-card">
      <div className="kpi-content">
        <div className="kpi-info">
          <span className="kpi-title">{title}</span>
          <span className="kpi-value">{value}</span>
        </div>
        <div
          className="kpi-icon"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );

  if (!link) return cardContent;

  return (
    <Link to={link} className="kpi-link">
      {cardContent}
    </Link>
  );
}

// EmptyState Component
function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <i className="fas fa-inbox empty-icon"></i>
      <p className="empty-text">{text}</p>
    </div>
  );
}

// StatusBadge Component - Improved
function StatusBadge({ status }) {
  const statusMap = {
    paid: { label: "Paid", class: "success" },
    completed: { label: "Completed", class: "success" },
    unpaid: { label: "Unpaid", class: "danger" },
    cancelled: { label: "Cancelled", class: "danger" },
    no_show: { label: "No Show", class: "danger" },
    partially_paid: { label: "Partially Paid", class: "warning" },
    scheduled: { label: "Scheduled", class: "warning" },
    in_progress: { label: "In Progress", class: "info" },
    pending: { label: "Pending", class: "secondary" },
  };

  const value = String(status || "").toLowerCase();
  const statusInfo = statusMap[value] || { label: status, class: "secondary" };
  const { t } = useTranslation();

  return (
    <span className={`status-badge status-${statusInfo.class}`}>
      {t(statusInfo.label)}
    </span>
  );
}
