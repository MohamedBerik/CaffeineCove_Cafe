import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import axios from "../../services/axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import "./SaaSReports.css";

// ثوابت
const COLORS = [
  "#1a237e",
  "#4caf50",
  "#ff9800",
  "#f44336",
  "#03a9f4",
  "#9c27b0",
];
const STATUS_COLORS = {
  active: "#4caf50",
  trial: "#ff9800",
  suspended: "#f44336",
  cancelled: "#9e9e9e",
};

export default function SaaSReports() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("overview");

  // ========================= Queries =========================
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["saas-reports", period],
    queryFn: async () => {
      const res = await axios.get(`/saas/reports?period=${period}`);
      return res.data.data;
    },
    staleTime: 60000,
  });

  // ========================= Memoized Values =========================
  const overview = useMemo(() => reportData?.overview || {}, [reportData]);
  const revenueData = useMemo(() => reportData?.revenue || [], [reportData]);
  const companiesGrowth = useMemo(
    () => reportData?.companies_growth || [],
    [reportData],
  );
  const churnData = useMemo(() => reportData?.churn || [], [reportData]);
  const plansDistribution = useMemo(() => {
    const data = reportData?.plans_distribution || {};
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [reportData]);
  const topCompanies = useMemo(
    () => reportData?.top_companies || [],
    [reportData],
  );
  const recentActivity = useMemo(
    () => reportData?.recent_activity || [],
    [reportData],
  );
  const kpis = useMemo(() => reportData?.kpis || {}, [reportData]);

  // ========================= Helpers =========================
  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat(
      i18n.language === "ar" ? "ar-EG" : "en-US",
    ).format(Number(value || 0));
  };

  const formatPercent = (value) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
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

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="reports-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading reports...")}</p>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="saas-reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="header-title">
          <h1>{t("SaaS Reports")}</h1>
          <p>{t("Analytics and insights for your platform")}</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            {["day", "week", "month", "year"].map((p) => (
              <button
                key={p}
                className={`period-btn ${period === p ? "active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {t(p)}
              </button>
            ))}
          </div>
          <button className="btn-export" onClick={() => window.print()}>
            <i className="fas fa-download"></i>
            {t("Export")}
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="report-tabs">
        <button
          className={`tab-btn ${reportType === "overview" ? "active" : ""}`}
          onClick={() => setReportType("overview")}
        >
          <i className="fas fa-chart-pie"></i>
          {t("Overview")}
        </button>
        <button
          className={`tab-btn ${reportType === "revenue" ? "active" : ""}`}
          onClick={() => setReportType("revenue")}
        >
          <i className="fas fa-dollar-sign"></i>
          {t("Revenue")}
        </button>
        <button
          className={`tab-btn ${reportType === "growth" ? "active" : ""}`}
          onClick={() => setReportType("growth")}
        >
          <i className="fas fa-chart-line"></i>
          {t("Growth")}
        </button>
        <button
          className={`tab-btn ${reportType === "churn" ? "active" : ""}`}
          onClick={() => setReportType("churn")}
        >
          <i className="fas fa-user-slash"></i>
          {t("Churn")}
        </button>
        <button
          className={`tab-btn ${reportType === "companies" ? "active" : ""}`}
          onClick={() => setReportType("companies")}
        >
          <i className="fas fa-building"></i>
          {t("Top Companies")}
        </button>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {reportType === "overview" && (
          <OverviewTab
            overview={overview}
            kpis={kpis}
            revenueData={revenueData}
            companiesGrowth={companiesGrowth}
            plansDistribution={plansDistribution}
            t={t}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
          />
        )}

        {reportType === "revenue" && (
          <RevenueTab
            revenueData={revenueData}
            kpis={kpis}
            t={t}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        )}

        {reportType === "growth" && (
          <GrowthTab
            companiesGrowth={companiesGrowth}
            kpis={kpis}
            t={t}
            formatNumber={formatNumber}
          />
        )}

        {reportType === "churn" && (
          <ChurnTab
            churnData={churnData}
            kpis={kpis}
            t={t}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
          />
        )}

        {reportType === "companies" && (
          <CompaniesTab
            topCompanies={topCompanies}
            recentActivity={recentActivity}
            t={t}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
}

// ========================= Tab Components =========================

function OverviewTab({
  overview,
  kpis,
  revenueData,
  companiesGrowth,
  plansDistribution,
  t,
  formatCurrency,
  formatNumber,
  formatPercent,
}) {
  return (
    <div className="overview-tab">
      {/* KPIs Row */}
      <div className="kpis-row">
        <KpiCard
          title={t("Total Companies")}
          value={formatNumber(kpis.total_companies || 0)}
          change={kpis.companies_growth}
          icon="fas fa-building"
          color="primary"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("Active Companies")}
          value={formatNumber(kpis.active_companies || 0)}
          change={kpis.active_growth}
          icon="fas fa-check-circle"
          color="success"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("MRR")}
          value={formatCurrency(kpis.mrr || 0)}
          change={kpis.mrr_growth}
          icon="fas fa-chart-line"
          color="info"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("Avg Revenue/Company")}
          value={formatCurrency(kpis.avg_revenue || 0)}
          change={kpis.avg_revenue_growth}
          icon="fas fa-dollar-sign"
          color="warning"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("Churn Rate")}
          value={`${(kpis.churn_rate || 0).toFixed(1)}%`}
          change={-kpis.churn_rate}
          icon="fas fa-user-slash"
          color="danger"
          formatPercent={formatPercent}
          invertChange
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="chart-header">
            <i className="fas fa-chart-line"></i>
            <h3>{t("Revenue Trend")}</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={(props) => (
                    <CustomTooltip
                      {...props}
                      formatCurrency={formatCurrency}
                      t={t}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1a237e"
                  fill="rgba(26, 35, 126, 0.1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <i className="fas fa-chart-bar"></i>
            <h3>{t("Companies Growth")}</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companiesGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="new"
                  fill="#4caf50"
                  radius={[8, 8, 0, 0]}
                  name={t("New")}
                />
                <Bar
                  dataKey="churned"
                  fill="#f44336"
                  radius={[8, 8, 0, 0]}
                  name={t("Churned")}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <i className="fas fa-chart-pie"></i>
            <h3>{t("Plans Distribution")}</h3>
          </div>
          <div className="chart-body">
            {plansDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={plansDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {plansDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">{t("No data available")}</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <i className="fas fa-building"></i>
            <h3>{t("Companies by Status")}</h3>
          </div>
          <div className="chart-body">
            <div className="status-stats">
              {Object.entries(overview).map(([status, count]) => (
                <div key={status} className="status-stat-item">
                  <div className="status-info">
                    <span
                      className="status-dot"
                      style={{ background: STATUS_COLORS[status] || "#6c757d" }}
                    ></span>
                    <span className="status-label">{t(status)}</span>
                  </div>
                  <span className="status-count">{formatNumber(count)}</span>
                  <span className="status-percent">
                    {((count / kpis.total_companies) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueTab({ revenueData, kpis, t, formatCurrency, formatPercent }) {
  return (
    <div className="revenue-tab">
      <div className="kpis-row small">
        <KpiCard
          title={t("Total Revenue")}
          value={formatCurrency(kpis.total_revenue || 0)}
          change={kpis.revenue_growth}
          icon="fas fa-dollar-sign"
          color="success"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("MRR")}
          value={formatCurrency(kpis.mrr || 0)}
          change={kpis.mrr_growth}
          icon="fas fa-chart-line"
          color="info"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("ARR")}
          value={formatCurrency(kpis.arr || 0)}
          change={kpis.arr_growth}
          icon="fas fa-calendar-alt"
          color="primary"
          formatPercent={formatPercent}
        />
        <KpiCard
          title={t("Avg Transaction")}
          value={formatCurrency(kpis.avg_transaction || 0)}
          change={kpis.avg_transaction_growth}
          icon="fas fa-receipt"
          color="warning"
          formatPercent={formatPercent}
        />
      </div>

      <div className="chart-card full-width">
        <div className="chart-header">
          <i className="fas fa-chart-line"></i>
          <h3>{t("Revenue Breakdown")}</h3>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1a237e"
                strokeWidth={3}
                dot={{ fill: "#1a237e", r: 4 }}
                name={t("Revenue")}
              />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="#4caf50"
                strokeWidth={2}
                dot={{ fill: "#4caf50", r: 4 }}
                name={t("MRR")}
              />
              <Line
                type="monotone"
                dataKey="subscriptions"
                stroke="#ff9800"
                strokeWidth={2}
                dot={{ fill: "#ff9800", r: 4 }}
                name={t("Subscriptions")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#1a237e" }}
            ></span>
            <span>{t("Revenue")}</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#4caf50" }}
            ></span>
            <span>{t("MRR")}</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#ff9800" }}
            ></span>
            <span>{t("Subscriptions")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrowthTab({ companiesGrowth, kpis, t, formatNumber }) {
  return (
    <div className="growth-tab">
      <div className="kpis-row small">
        <KpiCard
          title={t("Net Growth")}
          value={formatNumber(kpis.net_growth || 0)}
          change={kpis.net_growth_percent}
          icon="fas fa-chart-line"
          color="primary"
          formatPercent={(v) => `${v}%`}
        />
        <KpiCard
          title={t("New Companies")}
          value={formatNumber(kpis.new_companies || 0)}
          icon="fas fa-plus-circle"
          color="success"
        />
        <KpiCard
          title={t("Churned Companies")}
          value={formatNumber(kpis.churned_companies || 0)}
          icon="fas fa-minus-circle"
          color="danger"
        />
      </div>

      <div className="chart-card full-width">
        <div className="chart-header">
          <i className="fas fa-chart-bar"></i>
          <h3>{t("Monthly Growth")}</h3>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={companiesGrowth}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="new"
                fill="#4caf50"
                radius={[8, 8, 0, 0]}
                name={t("New")}
              />
              <Bar
                dataKey="churned"
                fill="#f44336"
                radius={[8, 8, 0, 0]}
                name={t("Churned")}
              />
              <Bar
                dataKey="net"
                fill="#1a237e"
                radius={[8, 8, 0, 0]}
                name={t("Net")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#4caf50" }}
            ></span>
            <span>{t("New Companies")}</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#f44336" }}
            ></span>
            <span>{t("Churned Companies")}</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-color"
              style={{ background: "#1a237e" }}
            ></span>
            <span>{t("Net Growth")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChurnTab({ churnData, kpis, t, formatNumber, formatPercent }) {
  return (
    <div className="churn-tab">
      <div className="kpis-row small">
        <KpiCard
          title={t("Churn Rate")}
          value={`${(kpis.churn_rate || 0).toFixed(1)}%`}
          icon="fas fa-user-slash"
          color="danger"
        />
        <KpiCard
          title={t("Retention Rate")}
          value={`${(kpis.retention_rate || 0).toFixed(1)}%`}
          icon="fas fa-user-check"
          color="success"
        />
        <KpiCard
          title={t("Avg Lifetime (months)")}
          value={formatNumber(kpis.avg_lifetime || 0)}
          icon="fas fa-clock"
          color="info"
        />
      </div>

      <div className="chart-card full-width">
        <div className="chart-header">
          <i className="fas fa-chart-line"></i>
          <h3>{t("Churn Trend")}</h3>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={churnData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="churn_rate"
                stroke="#f44336"
                strokeWidth={3}
                dot={{ fill: "#f44336", r: 4 }}
                name={t("Churn Rate")}
              />
              <Line
                type="monotone"
                dataKey="churned_count"
                stroke="#ff9800"
                strokeWidth={2}
                dot={{ fill: "#ff9800", r: 4 }}
                name={t("Churned Companies")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function CompaniesTab({
  topCompanies,
  recentActivity,
  t,
  formatCurrency,
  formatDate,
}) {
  return (
    <div className="companies-tab">
      <div className="charts-row">
        <div className="table-card">
          <div className="table-header">
            <i className="fas fa-trophy"></i>
            <h3>{t("Top Performing Companies")}</h3>
          </div>
          <div className="table-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("Company")}</th>
                  <th>{t("Revenue")}</th>
                  <th>{t("Growth")}</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map((company, index) => (
                  <tr key={company.id}>
                    <td className="rank">#{index + 1}</td>
                    <td>{company.name}</td>
                    <td>{formatCurrency(company.revenue)}</td>
                    <td
                      className={company.growth >= 0 ? "positive" : "negative"}
                    >
                      <i
                        className={`fas fa-arrow-${company.growth >= 0 ? "up" : "down"}`}
                      ></i>
                      {Math.abs(company.growth).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="activity-card">
          <div className="activity-header">
            <i className="fas fa-history"></i>
            <h3>{t("Recent Activity")}</h3>
          </div>
          <div className="activity-body">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <i className={`fas fa-${getActivityIcon(activity.type)}`}></i>
                </div>
                <div className="activity-content">
                  <span className="activity-text">{t(activity.message)}</span>
                  <span className="activity-time">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================= Helper Components =========================

function KpiCard({
  title,
  value,
  change,
  icon,
  color,
  formatPercent,
  invertChange,
}) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ backgroundColor: colors.bg }}>
        <i className={icon} style={{ color: colors.text }}></i>
      </div>
      <div className="kpi-content">
        <span className="kpi-value">{value}</span>
        <span className="kpi-title">{title}</span>
        {change !== undefined && formatPercent && (
          <div
            className={`kpi-change ${invertChange ? (change <= 0 ? "positive" : "negative") : change >= 0 ? "positive" : "negative"}`}
          >
            <i className={`fas fa-arrow-${change >= 0 ? "up" : "down"}`}></i>
            <span>{formatPercent(Math.abs(change))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, formatCurrency, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-item">
        <span className="tooltip-label">{t("Revenue")}:</span>
        <span className="tooltip-value">
          {formatCurrency(payload[0].value)}
        </span>
      </div>
      <div className="tooltip-item">
        <span className="tooltip-label">{t("Month")}:</span>
        <span className="tooltip-value">{payload[0].payload.month}</span>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  const icons = {
    company_created: "plus-circle",
    company_activated: "check-circle",
    subscription_created: "credit-card",
    payment_received: "dollar-sign",
    trial_started: "clock",
    trial_converted: "exchange-alt",
  };
  return icons[type] || "info-circle";
}
