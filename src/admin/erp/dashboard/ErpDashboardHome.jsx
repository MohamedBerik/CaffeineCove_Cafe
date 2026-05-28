import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import {
  useFormatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  generateSummary,
  getGreeting,
  getAnomalyColor,
} from "./helpers";
import { useDashboardData } from "./hooks/useDashboardData";
import { RANGE } from "./constants";
import RevenueChartCard from "./components/RevenueChartCard";
import AppointmentsChartCard from "./components/AppointmentsChartCard";
import SummaryCard from "./components/SummaryCard";
import AlertsSection from "./components/AlertsSection";
import InsightsSection from "./components/InsightsSection";
import StatsSection from "./components/StatsSection";
import ActivitySection from "./components/ActivitySection";
import TablesSection from "./components/TablesSection";
// يمكن إضافة KpisSection لو أردت نقل كل البطاقات أيضاً
import KpiCard from "./components/KpiCard"; // سنستخدمها مباشرة لبقية المؤشرات
import "./ErpDashboardHome.css";

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const chartRef = useRef(null);

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

  // ---- Sync branch from Navbar ----
  useEffect(() => {
    const syncBranch = (event) => {
      const latestBranch =
        event?.detail?.branchId ??
        localStorage.getItem("selectedBranchId") ??
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

  // ---- Greeting ----
  useEffect(() => {
    setGreeting(getGreeting(t));
    const interval = setInterval(() => setGreeting(getGreeting(t)), 60000);
    return () => clearInterval(interval);
  }, [t]);

  // ---- Store comparison preference ----
  useEffect(() => {
    localStorage.setItem("showComparison", showComparison);
  }, [showComparison]);

  // ---- Data hook ----
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
    focusRange,
    setFocusRange,
    visibleRevenueData,
    appointmentsDataWithAnomalies,
  } = useDashboardData(branchId, range, showComparison);

  // ---- Memoized values (before any return) ----
  const kpis = dashboard?.kpis || {};
  const alerts = dashboard?.reminders?.alerts || [];
  const insights = dashboard?.insights || [];
  const reminderStats = dashboard?.reminders?.stats || {};

  const summaryMessages = useMemo(() => {
    if (!dashboard?.kpis) return [];
    return generateSummary(dashboard.kpis, t);
  }, [dashboard?.kpis, t]);

  const visibleAlerts = useMemo(
    () => alerts.filter((a) => !hiddenAlerts.has(a.id)),
    [alerts, hiddenAlerts],
  );

  // ---- Scroll to chart on focusRange ----
  useEffect(() => {
    if (focusRange && chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusRange]);

  // ---- Auto-expand first high-priority insight ----
  useEffect(() => {
    if (insights.length > 0) {
      const highIndex = insights.findIndex((i) => i.priority === "high");
      if (highIndex !== -1) {
        setExpandedInsight(highIndex);
      }
    }
  }, [insights]);

  // ---- AnimatedDot component (passed as function) ----
  const AnimatedDot = useCallback((props) => {
    const { cx, cy, payload } = props;
    if (!payload?.anomaly) return null;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={8}
          className="pulse-dot"
          fill={getAnomalyColor(payload.anomaly.priority)}
        />
        <text
          x={cx}
          y={cy - 12}
          fontSize="12"
          textAnchor="middle"
          fill={getAnomalyColor(payload.anomaly.priority)}
        >
          ⚠️
        </text>
      </g>
    );
  }, []);

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
          <i className="fas fa-sync-alt"></i> {t("Try Again")}
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

  // Data extraction for tables & extra sections
  const recentAppointments = dashboard.recent_appointments || [];
  const recentInvoices = dashboard.recent_invoices || [];
  const recentPayments = dashboard.recent_payments || [];
  const recentPurchaseOrders = dashboard.recent_purchase_orders || [];
  const lowStockSupplies = dashboard.low_stock_supplies || [];
  const failedReminders = dashboard.reminders?.failed_recent || [];

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
          <span>{formatDate(new Date(), i18n.language)}</span>
        </div>
      </div>

      {/* Range & Comparison Toggle */}
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
      <AlertsSection
        alerts={alerts}
        visibleAlerts={visibleAlerts}
        acknowledgingIds={acknowledgingIds}
        hiddenAlerts={hiddenAlerts}
        setHiddenAlerts={setHiddenAlerts}
        markAllAsRead={markAllAsRead}
        acknowledge={acknowledge}
        formatDateTime={formatDateTime}
        i18n={i18n}
      />

      {/* Insights Section */}
      <InsightsSection
        insights={insights}
        expandedInsight={expandedInsight}
        setExpandedInsight={setExpandedInsight}
      />

      {/* Summary Card */}
      <SummaryCard messages={summaryMessages} t={t} />

      {/* Stats Section (Quick Stats + Financial Overview) */}
      <StatsSection
        kpis={kpis}
        formatCurrency={formatCurrency}
        pendingReminders={reminderStats.pending ?? 0}
      />

      {/* Key Performance Indicators */}
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
          data={visibleRevenueData}
          t={t}
          formatCurrency={formatCurrency}
          AnimatedDot={AnimatedDot}
          chartRef={chartRef}
          focusRange={focusRange}
          setFocusRange={setFocusRange}
          showComparison={showComparison}
        />
        <AppointmentsChartCard data={appointmentsDataWithAnomalies} t={t} />
      </div>

      {/* Activity Section */}
      <ActivitySection
        activityLogs={activityLogs}
        formatDateTime={formatDateTime}
        i18n={i18n}
      />

      {/* Tables Section */}
      <TablesSection
        recentAppointments={recentAppointments}
        recentInvoices={recentInvoices}
        recentPayments={recentPayments}
        recentPurchaseOrders={recentPurchaseOrders}
        lowStockSupplies={lowStockSupplies}
        failedReminders={failedReminders}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatTime={formatTime}
        formatDateTime={formatDateTime}
        i18n={i18n}
      />
    </div>
  );
}
