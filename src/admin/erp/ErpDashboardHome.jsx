import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useFormatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  generateSummary,
  getGreeting,
} from "./dashboard/helpers";
import { useDashboardData } from "./dashboard/hooks/useDashboardData";
import { RANGE, insightIconMap } from "./dashboard/constants";
import RevenueChartCard from "./dashboard/components/RevenueChartCard";
import AppointmentsChartCard from "./dashboard/components/AppointmentsChartCard";
import KpiCard from "./dashboard/components/KpiCard";
import EmptyState from "./dashboard/components/EmptyState";
import StatusBadge from "./dashboard/components/StatusBadge";
import SummaryCard from "./dashboard/components/SummaryCard";
import "./ErpDashboardHome.css";

// Helper function for activity log formatting (kept local as it's small)
const formatLog = (log, t) => {
  const type = log.subject_type;
  const action = log.action;
  if (type === "Appointment") {
    if (action === "created") return t("New appointment created");
    if (action === "updated") return t("Appointment updated");
    if (action === "deleted") return t("Appointment deleted");
  }
  if (type === "Invoice") {
    if (action === "created") return t("New invoice created");
    if (action === "paid") return t("Invoice paid");
  }
  if (type === "Payment") return t("New payment recorded");
  if (type === "Customer") return t("Customer updated");
  return `${type} ${action}`;
};

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();

  // ========================= Local State =========================
  const [greeting, setGreeting] = useState("");
  const [range, setRange] = useState(RANGE.DAY);
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") || "all",
  );
  const [showComparison, setShowComparison] = useState(() => {
    const saved = localStorage.getItem("showComparison");
    return saved === "true";
  });
  const [expandedInsight, setExpandedInsight] = useState(null);

  // ========================= Effects =========================
  // Sync branch from Navbar
  useEffect(() => {
    const syncBranch = (event) => {
      const latestBranch =
        event?.detail?.branchId ||
        localStorage.getItem("selectedBranchId") ||
        "all";
      setBranchId((prev) => (prev !== latestBranch ? latestBranch : prev));
    };
    window.addEventListener("globalBranchChanged", syncBranch);
    window.addEventListener("storage", syncBranch);
    return () => {
      window.removeEventListener("globalBranchChanged", syncBranch);
      window.removeEventListener("storage", syncBranch);
    };
  }, []);

  // Greeting (باستخدام helper)
  useEffect(() => {
    setGreeting(getGreeting(t));
    const interval = setInterval(() => setGreeting(getGreeting(t)), 60000);
    return () => clearInterval(interval);
  }, [t]);

  // Store comparison preference
  useEffect(() => {
    localStorage.setItem("showComparison", showComparison);
  }, [showComparison]);

  // ========================= Data Hook =========================
  const {
    dashboard,
    isLoading,
    error,
    refetch,
    activityLogs,
    acknowledge,
    acknowledgingIds,
    hiddenAlerts,
    setHiddenAlerts,
    markAllAsRead,
    revenueDataWithAnomalies,
    appointmentsDataWithAnomalies,
  } = useDashboardData(branchId, range, showComparison);

  // ========================= Early Returns =========================
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-animation">
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
        </div>
        <p>{t("Loading dashboard...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
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

  if (!dashboard) {
    return (
      <div className="dashboard-empty">
        <i className="fas fa-chart-line"></i>
        <h3>{t("No Data Available")}</h3>
        <p>{t("No dashboard data available.")}</p>
      </div>
    );
  }

  // ========================= Data Extraction =========================
  const kpis = dashboard.kpis || {};
  const summaryMessages = generateSummary(kpis, t);
  const recentAppointments = dashboard.recent_appointments || [];
  const recentInvoices = dashboard.recent_invoices || [];
  const recentPayments = dashboard.recent_payments || [];
  const recentPurchaseOrders = dashboard.recent_purchase_orders || [];
  const lowStockSupplies = dashboard.low_stock_supplies || [];
  const failedReminders = dashboard.reminders?.failed_recent || [];
  const alerts = dashboard.reminders?.alerts || [];
  const insights = dashboard.insights || [];
  const reminderStats = dashboard.reminders?.stats || {};

  const visibleAlerts = useMemo(
    () => alerts.filter((a) => !hiddenAlerts.has(a.id)),
    [alerts, hiddenAlerts],
  );

  const totalRevenue = kpis.revenue?.current || 0;
  const completionRate = kpis.appointments?.current
    ? Math.round(
        (kpis.completed_appointments?.current / kpis.appointments?.current) *
          100,
      )
    : 0;

  // ========================= UI =========================
  return (
    <div className="erp-dashboard">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-content">
          <div className="greeting-badge">
            <i className="fas fa-sun"></i>
            <span>{greeting}</span>
          </div>
          <h1 className="welcome-title">{t("Welcome to ERP Dashboard")}</h1>
          <p className="welcome-subtitle">
            {t("Here's what's happening with your clinic today")}
          </p>
        </div>
        <div className="date-badge">
          <i className="fas fa-calendar-alt"></i>
          <span>{formatDate(new Date(), i18n)}</span>
        </div>
      </div>

      <div className="comparison-toggle-container">
        <div className="range-toggle">
          {[RANGE.DAY, RANGE.WEEK, RANGE.MONTH].map((r) => (
            <button
              key={r}
              className={`range-btn ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
            >
              {t(r)}
            </button>
          ))}
        </div>
        <label className="comparison-toggle">
          <input
            type="checkbox"
            checked={showComparison}
            onChange={() => setShowComparison((prev) => !prev)}
          />
          <span>{t("Compare with previous period")}</span>
        </label>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-container">
          {visibleAlerts.map((alert) => (
            <div key={alert.id} className={`alert-card alert-${alert.type}`}>
              <i
                className={`fas ${alert.type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}`}
              ></i>
              <span className={`alert-priority priority-${alert.priority}`}>
                {alert.priority}
              </span>
              <span>
                {t(alert.message)}{" "}
                {alert.meta?.count ? `(${alert.meta.count})` : ""}
              </span>
              <small className="alert-time">
                {formatDateTime(alert.time, i18n)}
              </small>
              <button
                className="alert-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setHiddenAlerts((prev) => {
                    const next = new Set(prev);
                    next.add(alert.id);
                    return next;
                  });
                }}
              >
                <i className="fas fa-times"></i>
              </button>
              <button
                className="alert-ack"
                disabled={acknowledgingIds.has(alert.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  acknowledge(alert.id);
                }}
              >
                <i className="fas fa-check"></i>
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={markAllAsRead}
          >
            {t("Mark All as Read")}
          </button>
        </div>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="insights-container">
          <div className="insights-header">
            <i className="fas fa-lightbulb"></i>
            <h4>{t("Smart Insights")}</h4>
          </div>
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`insight-card ${insight.priority} ${insight.explanation ? "expandable" : ""}`}
              onClick={() => {
                if (insight.explanation) {
                  setExpandedInsight(expandedInsight === i ? null : i);
                }
              }}
            >
              <div className="insight-icon">
                {insightIconMap[insight.category] || "📊"}
              </div>
              <div className="insight-content">
                <span className="insight-category">{t(insight.category)}</span>
                <p>{t(insight.message)}</p>
                {expandedInsight === i && insight.explanation && (
                  <div className="insight-explanation">
                    <p className="explanation-summary">
                      {t(insight.explanation.summary)}
                    </p>
                    <ul className="explanation-factors">
                      {insight.explanation.factors.map((factor, idx) => (
                        <li key={idx}>
                          <span>{t(factor.label)}</span>
                          <strong className={factor.value > 10 ? "high" : ""}>
                            {factor.value}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SummaryCard messages={summaryMessages} t={t} />

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="stat-icon primary">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.appointments?.current ?? 0}
            </span>
            <span className="stat-label">{t("Appointments")}</span>
          </div>
          <div className="stat-trend up">
            <i className="fas fa-arrow-up"></i>
            <span>{completionRate}%</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon success">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
            <span className="stat-label">{t("Total Revenue")}</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon warning">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{reminderStats.pending ?? 0}</span>
            <span className="stat-label">{t("Pending Reminders")}</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon info">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.total_patients?.current ?? 0}
            </span>
            <span className="stat-label">{t("New Patients")}</span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="section-header">
        <h2>{t("Financial Overview")}</h2>
        <p>{t("Key financial health indicators")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Net Profit")}
          value={formatCurrency(kpis.net_profit?.current || 0)}
          icon="fas fa-chart-pie"
          color={(kpis.net_profit?.current || 0) >= 0 ? "success" : "danger"}
          delta={kpis.net_profit?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Outstanding Receivables")}
          value={formatCurrency(kpis.outstanding_receivables?.current || 0)}
          icon="fas fa-hand-holding-usd"
          color="warning"
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Outstanding Payables")}
          value={formatCurrency(kpis.outstanding_payables?.current || 0)}
          icon="fas fa-money-check-alt"
          color="danger"
          link="/admin/erp/purchase-orders"
        />
      </div>

      {/* KPIs Grid */}
      <div className="section-header">
        <h2>{t("Key Performance Indicators")}</h2>
        <p>{t("Monitor your clinic's performance at a glance")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Revenue")}
          value={formatCurrency(kpis.revenue?.current || 0)}
          icon="fas fa-money-bill-wave"
          color="success"
          delta={kpis.revenue?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Appointments")}
          value={kpis.appointments?.current || 0}
          icon="fas fa-calendar-check"
          color="primary"
          delta={kpis.appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Completed")}
          value={kpis.completed_appointments?.current || 0}
          icon="fas fa-check-circle"
          color="info"
          delta={kpis.completed_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Cancelled")}
          value={kpis.cancelled_appointments?.current || 0}
          icon="fas fa-times-circle"
          color="danger"
          delta={kpis.cancelled_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("No Show")}
          value={kpis.no_show_appointments?.current || 0}
          icon="fas fa-user-slash"
          color="warning"
          delta={kpis.no_show_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Unpaid Invoices")}
          value={kpis.unpaid_invoices?.current || 0}
          icon="fas fa-file-invoice"
          color="danger"
          delta={kpis.unpaid_invoices?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Paid Invoices")}
          value={kpis.paid_invoices?.current || 0}
          icon="fas fa-check-double"
          color="success"
          delta={kpis.paid_invoices?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("New Patients")}
          value={kpis.total_patients?.current || 0}
          icon="fas fa-user-plus"
          color="primary"
          delta={kpis.total_patients?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/patients"
        />
      </div>

      {/* Purchases KPIs */}
      <div className="section-header">
        <h2>{t("Purchases")}</h2>
        <p>{t("Monitor your procurement and supplier payments")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Purchase Total")}
          value={formatCurrency(kpis.purchase_total?.current || 0)}
          icon="fas fa-shopping-cart"
          color="info"
          delta={kpis.purchase_total?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Orders Count")}
          value={kpis.purchase_orders_count?.current || 0}
          icon="fas fa-clipboard-list"
          color="primary"
          delta={kpis.purchase_orders_count?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Paid to Suppliers")}
          value={formatCurrency(kpis.supplier_payments?.current || 0)}
          icon="fas fa-credit-card"
          color="success"
          delta={kpis.supplier_payments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Purchase Returns")}
          value={formatCurrency(kpis.purchase_returns?.current || 0)}
          icon="fas fa-undo-alt"
          color="danger"
          delta={kpis.purchase_returns?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Net Purchases")}
          value={formatCurrency(kpis.purchase_net?.current || 0)}
          icon="fas fa-receipt"
          color="primary"
          delta={kpis.purchase_net?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={
            (kpis.purchase_balance?.current || 0) < 0
              ? t("Supplier Credits")
              : t("Purchase Balance")
          }
          value={
            (kpis.purchase_balance?.current || 0) < 0
              ? formatCurrency(Math.abs(kpis.purchase_balance?.current || 0))
              : formatCurrency(kpis.purchase_balance?.current || 0)
          }
          icon={
            (kpis.purchase_balance?.current || 0) < 0
              ? "fas fa-hand-holding-heart"
              : "fas fa-balance-scale"
          }
          color={
            (kpis.purchase_balance?.current || 0) < 0 ? "success" : "secondary"
          }
          delta={kpis.purchase_balance?.delta}
          deltaLabel={t("vs previous")}
        />
      </div>

      {/* Inventory KPIs */}
      <div className="section-header">
        <h2>{t("Inventory")}</h2>
        <p>{t("Stock levels and inventory valuation")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Low Stock Supplies")}
          value={kpis.low_stock_supplies?.current || 0}
          icon="fas fa-exclamation-triangle"
          color="warning"
          link="/admin/erp/supplies"
        />
        <KpiCard
          title={t("Inventory Value")}
          value={formatCurrency(kpis.inventory_value?.current || 0)}
          icon="fas fa-boxes"
          color="info"
          link="/admin/erp/supplies"
        />
      </div>

      {/* Charts Section */}
      <div className="section-header">
        <h2>{t("Analytics Overview")}</h2>
        <p>{t("Real-time insights at a glance")}</p>
      </div>
      <div className="charts-grid">
        <RevenueChartCard
          data={revenueDataWithAnomalies}
          t={t}
          formatCurrency={formatCurrency}
          showComparison={showComparison}
        />
        <AppointmentsChartCard data={appointmentsDataWithAnomalies} t={t} />
      </div>

      {/* Recent Activity */}
      <div className="section-header">
        <h2>{t("Recent Activity")}</h2>
        <p>{t("Latest updates from your clinic")}</p>
      </div>
      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-history"></i>
            <h5 className="card-title">{t("Activity Logs")}</h5>
          </div>
        </div>
        <div className="card-body-custom">
          {activityLogs.length === 0 ? (
            <EmptyState text={t("No activity yet.")} />
          ) : (
            <ul className="activity-list">
              {activityLogs.map((log) => (
                <li key={log.id} className="activity-item">
                  <div className="activity-text">{formatLog(log, t)}</div>
                  <small className="activity-time">
                    {formatDateTime(log.created_at, i18n)}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        {/* Recent Appointments */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-calendar-alt"></i>
              <h5 className="card-title">{t("Recent Appointments")}</h5>
            </div>
            <Link to="/admin/erp/appointments/calendar" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
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
                          {formatDate(item.appointment_date, i18n)}{" "}
                          {formatTime(item.appointment_time)}
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

        {/* Recent Invoices */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-file-invoice"></i>
              <h5 className="card-title">{t("Recent Invoices")}</h5>
            </div>
            <Link to="/admin/erp/invoices" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
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
                          {formatDate(item.issued_at || item.created_at, i18n)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-credit-card"></i>
              <h5 className="card-title">{t("Recent Payments")}</h5>
            </div>
            <Link to="/admin/erp/invoices" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
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
                          {formatDateTime(
                            item.paid_at || item.created_at,
                            i18n,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-truck"></i>
              <h5 className="card-title">{t("Recent Purchase Orders")}</h5>
            </div>
            <Link to="/admin/erp/purchase-orders" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-body-custom">
            {recentPurchaseOrders.length === 0 ? (
              <EmptyState text={t("No recent purchase orders.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("PO #")}</th>
                      <th>{t("Supplier")}</th>
                      <th>{t("Total")}</th>
                      <th>{t("Paid")}</th>
                      <th>{t("Remaining")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchaseOrders.map((po) => (
                      <tr key={po.id}>
                        <td data-label={t("PO #")}>
                          <Link
                            to={`/admin/erp/purchase-orders/${po.id}`}
                            className="invoice-link"
                          >
                            {po.number}
                          </Link>
                        </td>
                        <td data-label={t("Supplier")}>{po.supplier || "-"}</td>
                        <td data-label={t("Total")}>
                          {formatCurrency(po.total)}
                        </td>
                        <td data-label={t("Paid")}>
                          {formatCurrency(po.total_paid)}
                        </td>
                        <td data-label={t("Remaining")}>
                          {formatCurrency(po.remaining)}
                        </td>
                        <td data-label={t("Status")}>
                          <StatusBadge status={po.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Supplies */}
        {lowStockSupplies.length > 0 && (
          <div className="dashboard-card warning-card">
            <div className="card-header-custom">
              <div className="card-title-wrapper">
                <i className="fas fa-exclamation-triangle"></i>
                <h5 className="card-title">{t("Low Stock Supplies")}</h5>
              </div>
              <Link to="/admin/erp/supplies" className="card-link">
                {t("View All")} <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="card-body-custom">
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Name")}</th>
                      <th>{t("In Stock")}</th>
                      <th>{t("Unit Cost")}</th>
                      <th>{t("Total Value")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockSupplies.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Name")}>
                          <Link
                            to={`/admin/erp/supplies/${item.id}/edit`}
                            className="invoice-link"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td
                          data-label={t("In Stock")}
                          className="text-danger fw-bold"
                        >
                          {item.stock_quantity}
                        </td>
                        <td data-label={t("Unit Cost")}>
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td data-label={t("Total Value")}>
                          {formatCurrency(item.inventory_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Failed Reminders */}
        {failedReminders.length > 0 && (
          <div className="dashboard-card warning-card">
            <div className="card-header-custom">
              <div className="card-title-wrapper">
                <i className="fas fa-bell-slash"></i>
                <h5 className="card-title">{t("Failed Reminders")}</h5>
              </div>
            </div>
            <div className="card-body-custom">
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Appointment")}</th>
                      <th>{t("Doctor")}</th>
                      <th>{t("Date")}</th>
                      <th>{t("Retries")}</th>
                      <th>{t("Last Attempt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedReminders.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Appointment")}>#{item.id}</td>
                        <td data-label={t("Doctor")}>
                          {item.doctor_name || "-"}
                        </td>
                        <td data-label={t("Date")}>
                          {formatDate(item.appointment_date, i18n)}
                        </td>
                        <td
                          data-label={t("Retries")}
                          className="text-danger fw-bold"
                        >
                          {item.reminder_retry_count}
                        </td>
                        <td data-label={t("Last Attempt")}>
                          {formatDateTime(item.reminder_last_attempt_at, i18n)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
