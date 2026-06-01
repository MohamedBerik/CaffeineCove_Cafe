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
import KpisSection from "./components/KpisSection";
import PurchasesSection from "./components/PurchasesSection";
import InventorySection from "./components/InventorySection";
import "./ErpDashboardHome.css";

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const chartRef = useRef(null);

  const [greeting, setGreeting] = useState("");
  const [range, setRange] = useState(RANGE.DAY);

  // قراءة القيمة الأولية بأمان
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") || "all",
  );

  const [showComparison, setShowComparison] = useState(() => {
    const saved = localStorage.getItem("showComparison");
    return saved === "true";
  });
  const [expandedInsight, setExpandedInsight] = useState(null);

  // ✅ تعديل الدالة: إضافة حماية تمنع التحديث إذا كان الفرع لم يتغير فعلياً في التخزين
  // قراءة القيمة الأولية
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") || "all",
  );

  // مزامنة الفرع القادم من الـ Navbar
  useEffect(() => {
    const syncBranch = (event) => {
      const latestBranch =
        event?.detail?.branchId ??
        localStorage.getItem("selectedBranchId") ??
        "all";

      setBranchId((current) => {
        if (String(current) === String(latestBranch)) {
          return current;
        }

        return latestBranch;
      });
    };

    window.addEventListener("activeBranchChanged", syncBranch);

    return () => {
      window.removeEventListener("activeBranchChanged", syncBranch);
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

  // ---- Memoized values ----
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

  // ---- AnimatedDot component (improved) ----
  const AnimatedDot = useCallback((props) => {
    const { cx, cy, payload } = props;
    if (!payload?.anomaly) return null;
    const color = getAnomalyColor(payload.anomaly.priority);
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} className="pulse-dot" fill={color} />
        <text x={cx} y={cy - 12} fontSize="12" textAnchor="middle" fill={color}>
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

  // Data for tables
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
        visibleAlerts={visibleAlerts}
        acknowledgingIds={acknowledgingIds}
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
      <KpisSection kpis={kpis} formatCurrency={formatCurrency} />

      {/* Purchases KPIs */}
      <PurchasesSection kpis={kpis} formatCurrency={formatCurrency} />

      {/* Inventory KPIs */}
      <InventorySection kpis={kpis} formatCurrency={formatCurrency} />

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
