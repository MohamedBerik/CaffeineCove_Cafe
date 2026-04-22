import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "../../services/axios";
import "./SaaSDashboard.css";
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
} from "recharts";

// ثوابت
const STATUS_COLORS = {
  active: "#4caf50",
  trial: "#ff9800",
  suspended: "#f44336",
  cancelled: "#9e9e9e",
};

const GROWTH_COLORS = {
  positive: "#4caf50",
  negative: "#f44336",
  neutral: "#6c757d",
};

export default function SaaSDashboard() {
  const { t, i18n } = useTranslation();
  const [greeting, setGreeting] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // ========================= Queries =========================
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["saas-dashboard", selectedPeriod],
    queryFn: async () => {
      const res = await axios.get(`/saas/dashboard?period=${selectedPeriod}`);
      return res.data?.data || null;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // ========================= Effects =========================
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t("Good Morning"));
    else if (hour < 18) setGreeting(t("Good Afternoon"));
    else setGreeting(t("Good Evening"));
  }, [t]);

  // ========================= Memoized Values =========================
  const stats = useMemo(() => dashboard?.stats || {}, [dashboard]);
  const recentCompanies = useMemo(
    () => dashboard?.recent_companies || [],
    [dashboard],
  );
  const mrrData = useMemo(() => dashboard?.mrr || [], [dashboard]);
  const companiesByStatus = useMemo(() => {
    const statusData = dashboard?.companies_by_status || {};
    return Object.entries(statusData).map(([name, value]) => ({
      name: t(name),
      value,
      color: STATUS_COLORS[name] || "#6c757d",
    }));
  }, [dashboard, t]);
  const growthData = useMemo(() => dashboard?.growth || [], [dashboard]);
  const topClinics = useMemo(() => dashboard?.top_clinics || [], [dashboard]);
  const recentActivities = useMemo(
    () => dashboard?.recent_activities || [],
    [dashboard],
  );

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
    return new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US").format(
      Number(value || 0),
    );
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

  const getGrowthColor = (value) => {
    if (value > 0) return GROWTH_COLORS.positive;
    if (value < 0) return GROWTH_COLORS.negative;
    return GROWTH_COLORS.neutral;
  };

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="saas-loading">
        <div className="loading-animation">
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
        </div>
        <p>{t("Loading SaaS Dashboard...")}</p>
      </div>
    );
  }

  // ========================= Error State =========================
  if (error) {
    return (
      <div className="saas-error">
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

  // ========================= UI =========================
  return (
    <div className="saas-dashboard">
      {/* Welcome Header */}
      <div className="saas-welcome-header">
        <div className="saas-welcome-content">
          <div className="saas-greeting-badge">
            <i className="fas fa-crown"></i>
            <span>{greeting}, Super Admin</span>
          </div>
          <h1 className="saas-welcome-title">{t("SaaS Management Dashboard")}</h1>
          <p className="saas-welcome-subtitle">
            {t("Monitor and manage all clinics from one place")}
          </p>
        </div>
        <div className="saas-date-badge">
          <i className="fas fa-calendar-alt"></i>
          <span>{formatDate(new Date())}</span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="saas-period-selector">
        {["day", "week", "month", "year"].map((period) => (
          <button
            key={period}
            className={`saas-period-btn ${selectedPeriod === period ? "active" : ""}`}
            onClick={() => setSelectedPeriod(period)}
          >
            {t(period)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="saas-metrics-grid">
        <MetricCard
          title={t("Total Companies")}
          value={formatNumber(stats.total_companies || 0)}
          icon="fas fa-building"
          color="primary"
          trend={stats.companies_growth}
          trendLabel={t("vs last period")}
          t={t}
        />
        <MetricCard
          title={t("Active Companies")}
          value={formatNumber(stats.active_companies || 0)}
          icon="fas fa-check-circle"
          color="success"
          percentage={stats.active_percentage}
          t={t}
        />
        <MetricCard
          title={t("Trial Companies")}
          value={formatNumber(stats.trial_companies || 0)}
          icon="fas fa-clock"
          color="warning"
          trend={stats.trial_growth}
          trendLabel={t("vs last period")}
          t={t}
        />
        <MetricCard
          title={t("MRR")}
          value={formatCurrency(stats.mrr || 0)}
          icon="fas fa-chart-line"
          color="info"
          trend={stats.mrr_growth}
          trendLabel={t("vs last month")}
          t={t}
        />
        <MetricCard
          title={t("Total Revenue")}
          value={formatCurrency(stats.total_revenue || 0)}
          icon="fas fa-dollar-sign"
          color="dark"
          trend={stats.revenue_growth}
          trendLabel={t("vs last period")}
          t={t}
        />
        <MetricCard
          title={t("Suspended Companies")}
          value={formatNumber(stats.suspended_companies || 0)}
          icon="fas fa-ban"
          color="danger"
          t={t}
        />
      </div>

      {/* Charts Row 1 - MRR & Growth */}
      <div className="saas-charts-row">
        <div className="saas-chart-card">
          <div className="saas-chart-header">
            <i className="fas fa-chart-line"></i>
            <h4>{t("Monthly Recurring Revenue (MRR)")}</h4>
          </div>
          <div className="saas-chart-body">
            {mrrData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mrrData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    content={(props) => (
                      <MRRTooltip {...props} formatCurrency={formatCurrency} t={t} />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#1a237e"
                    strokeWidth={3}
                    dot={{ fill: "#1a237e", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="saas-chart-empty">{t("No data available")}</div>
            )}
          </div>
        </div>

        <div className="saas-chart-card">
          <div className="saas-chart-header">
            <i className="fas fa-trend-up"></i>
            <h4>{t("Companies Growth")}</h4>
          </div>
          <div className="saas-chart-body">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={growthData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    content={(props) => (
                      <GrowthTooltip {...props} formatNumber={formatNumber} t={t} />
                    )}
                  />
                  <Bar dataKey="new" fill="#4caf50" radius={[8, 8, 0, 0]} name={t("New")} />
                  <Bar dataKey="churned" fill="#f44336" radius={[8, 8, 0, 0]} name={t("Churned")} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="saas-chart-empty">{t("No data available")}</div>
            )}
          </div>
          <div className="saas-chart-legend">
            <div className="saas-legend-item">
              <span className="saas-legend-color new"></span>
              <span>{t("New Companies")}</span>
            </div>
            <div className="saas-legend-item">
              <span className="saas-legend-color churned"></span>
              <span>{t("Churned Companies")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Status Distribution & Top Clinics */}
      <div className="saas-charts-row">
        <div className="saas-chart-card">
          <div className="saas-chart-header">
            <i className="fas fa-chart-pie"></i>
            <h4>{t("Companies by Status")}</h4>
          </div>
          <div className="saas-chart-body">
            {companiesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={companiesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {companiesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={(props) => <PieTooltip {...props} t={t} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="saas-chart-empty">{t("No data available")}</div>
            )}
          </div>
        </div>

        <div className="saas-chart-card">
          <div className="saas-chart-header">
            <i className="fas fa-trophy"></i>
            <h4>{t("Top Performing Clinics")}</h4>
          </div>
          <div className="saas-chart-body">
            {topClinics.length > 0 ? (
              <div className="saas-top-clinics">
                {topClinics.map((clinic, index) => (
                  <div key={clinic.id} className="saas-top-clinic-item">
                    <div className="saas-top-clinic-rank">#{index + 1}</div>
                    <div className="saas-top-clinic-info">
                      <span className="saas-top-clinic-name">{clinic.name}</span>
                      <span className="saas-top-clinic-meta">
                        {formatCurrency(clinic.revenue)} • {clinic.appointments} {t("appts")}
                      </span>
                    </div>
                    <div className="saas-top-clinic-growth" style={{ color: getGrowthColor(clinic.growth) }}>
                      <i className={`fas fa-arrow-${clinic.growth >= 0 ? "up" : "down"}`}></i>
                      {Math.abs(clinic.growth).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="saas-chart-empty">{t("No data available")}</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="saas-section-header">
        <h2>{t("Quick Actions")}</h2>
        <p>{t("Manage your platform efficiently")}</p>
      </div>
      <div className="saas-quick-actions">
        <Link to="/admin/companies/create" className="saas-action-card">
          <i className="fas fa-plus-circle"></i>
          <span>{t("Add New Company")}</span>
        </Link>
        <Link to="/admin/companies" className="saas-action-card">
          <i className="fas fa-list"></i>
          <span>{t("Manage Companies")}</span>
        </Link>
        <Link to="/admin/plans" className="saas-action-card">
          <i className="fas fa-tags"></i>
          <span>{t("Manage Plans")}</span>
        </Link>
        <Link to="/admin/reports/saas" className="saas-action-card">
          <i className="fas fa-file-alt"></i>
          <span>{t("SaaS Reports")}</span>
        </Link>
      </div>

      {/* Recent Companies & Activities */}
      <div className="saas-tables-row">
        <div className="saas-table-card">
          <div className="saas-table-header">
            <div className="saas-table-title">
              <i className="fas fa-building"></i>
              <h5>{t("Recent Companies")}</h5>
            </div>
            <Link to="/admin/companies" className="saas-table-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="saas-table-body">
            {recentCompanies.length > 0 ? (
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>{t("Company")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Created")}</th>
                    <th>{t("Trial Ends")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompanies.map((company) => (
                    <tr key={company.id}>
                      <td>
                        <Link to={`/admin/companies/${company.id}`} className="saas-company-link">
                          {company.name}
                        </Link>
                        <div className="saas-company-slug">{company.slug}</div>
                      </td>
                      <td>
                        <StatusBadge status={company.status} t={t} />
                      </td>
                      <td>{formatDate(company.created_at)}</td>
                      <td>{company.trial_ends_at ? formatDate(company.trial_ends_at) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState text={t("No recent companies")} />
            )}
          </div>
        </div>

        <div className="saas-table-card">
          <div className="saas-table-header">
            <div className="saas-table-title">
              <i className="fas fa-history"></i>
              <h5>{t("Recent Activities")}</h5>
            </div>
          </div>
          <div className="saas-table-body">
            {recentActivities.length > 0 ? (
              <div className="saas-activities-list">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="saas-activity-item">
                    <div className="saas-activity-icon">
                      <i className={`fas fa-${getActivityIcon(activity.type)}`}></i>
                    </div>
                    <div className="saas-activity-content">
                      <span className="saas-activity-text">{t(activity.message)}</span>
                      <span className="saas-activity-time">{formatDateTime(activity.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text={t("No recent activities")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================= Sub-Components =========================

function MetricCard({ title, value, icon, color, trend, trendLabel, percentage, t }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="saas-metric-card">
      <div className="saas-metric-icon" style={{ backgroundColor: colors.bg }}>
        <i className={icon} style={{ color: colors.text }}></i>
      </div>
      <div className="saas-metric-content">
        <span className="saas-metric-value">{value}</span>
        <span className="saas-metric-title">{title}</span>
        {trend !== undefined && (
          <div className={`saas-metric-trend ${trend >= 0 ? "positive" : "negative"}`}>
            <i className={`fas fa-arrow-${trend >= 0 ? "up" : "down"}`}></i>
            <span>
              {Math.abs(trend).toFixed(1)}% {trendLabel}
            </span>
          </div>
        )}
        {percentage !== undefined && (
          <div className="saas-metric-percentage">
            <span>{percentage.toFixed(1)}% {t("of total")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const statusMap = {
    active: { label: "Active", class: "success" },
    trial: { label: "Trial", class: "warning" },
    suspended: { label: "Suspended", class: "danger" },
    cancelled: { label: "Cancelled", class: "secondary" },
  };
  const info = statusMap[status] || { label: status, class: "secondary" };
  return (
    <span className={`saas-status-badge saas-status-${info.class}`}>
      <span className="saas-status-dot"></span>
      {t(info.label)}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="saas-empty-state">
      <i className="fas fa-inbox saas-empty-icon"></i>
      <p className="saas-empty-text">{text}</p>
    </div>
  );
}

function MRRTooltip({ active, payload, formatCurrency, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="saas-custom-tooltip">
      <div className="saas-tooltip-item">
        <span className="saas-tooltip-label">{t("MRR")}:</span>
        <span className="saas-tooltip-value">{formatCurrency(payload[0].value)}</span>
      </div>
      <div className="saas-tooltip-item">
        <span className="saas-tooltip-label">{t("Month")}:</span>
        <span className="saas-tooltip-value">{payload[0].payload.month}</span>
      </div>
    </div>
  );
}

function GrowthTooltip({ active, payload, formatNumber, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="saas-custom-tooltip">
      <div className="saas-tooltip-item">
        <span className="saas-tooltip-label">{t("New")}:</span>
        <span className="saas-tooltip-value" style={{ color: "#4caf50" }}>
          {formatNumber(payload[0]?.value || 0)}
        </span>
      </div>
      <div className="saas-tooltip-item">
        <span className="saas-tooltip-label">{t("Churned")}:</span>
        <span className="saas-tooltip-value" style={{ color: "#f44336" }}>
          {formatNumber(payload[1]?.value || 0)}
        </span>
      </div>
      <div className="saas-tooltip-item">
        <span className="saas-tooltip-label">{t("Net")}:</span>
        <span
          className="saas-tooltip-value"
          style={{ color: (payload[0]?.value || 0) - (payload[1]?.value || 0) >= 0 ? "#4caf50" : "#f44336" }}
        >
          {formatNumber((payload[0]?.value || 0) - (payload[1]?.value || 0))}
        </span>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="saas-custom-tooltip">
      <div className="saas-tooltip-item">
        <span className="saas-tooltip-label">{payload[0].name}:</span>
        <span className="saas-tooltip-value">{payload[0].value}</span>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  const icons = {
    company_created: "plus-circle",
    company_activated: "check-circle",
    company_suspended: "ban",
    subscription_created: "credit-card",
    payment_received: "dollar-sign",
    trial_started: "clock",
    trial_expired: "hourglass-end",
  };
  return icons[type] || "info-circle";
}

export default SaaSDashboard;