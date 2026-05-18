import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/axios";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import "./PrintSaaSReportsPage.css";

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

export default function PrintSaaSReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const period = queryParams.get("period") || "month";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/saas/reports?period=${period}`);
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("Failed to load reports."));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatNumber = (value) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US").format(
      Number(value || 0),
    );

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString(
        i18n.language === "ar" ? "ar-EG" : "en-US",
        { year: "numeric", month: "short", day: "2-digit" },
      );
    } catch {
      return value;
    }
  };

  const kpis = useMemo(() => data?.kpis || {}, [data]);
  const revenueData = useMemo(() => data?.revenue || [], [data]);
  const companiesGrowth = useMemo(() => data?.companies_growth || [], [data]);
  const plansDistribution = useMemo(() => {
    const dist = data?.plans_distribution || {};
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [data]);
  const overview = useMemo(() => data?.overview || {}, [data]);
  const topCompanies = useMemo(() => data?.top_companies || [], [data]);

  if (loading) {
    return (
      <div className="print-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="print-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>{t("Go Back")}</button>
      </div>
    );
  }

  return (
    <div className="print-saas-reports-page">
      <div className="no-print print-actions">
        <button className="btn btn-primary me-2" onClick={() => window.print()}>
          <i className="fas fa-print me-2"></i>
          {t("Print")}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left me-2"></i>
          {t("Back")}
        </button>
      </div>

      <div className="print-content">
        <h1 className="print-title">{t("SaaS Reports")}</h1>
        <p className="print-period">
          {t("Period")}: {t(period)}
        </p>

        {/* KPIs */}
        <div className="print-kpi-grid">
          <div className="print-kpi">
            <span className="kpi-label">{t("Total Companies")}</span>
            <span className="kpi-value">
              {formatNumber(kpis.total_companies)}
            </span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("Active Companies")}</span>
            <span className="kpi-value">
              {formatNumber(kpis.active_companies)}
            </span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("MRR")}</span>
            <span className="kpi-value">{formatCurrency(kpis.mrr)}</span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("Avg Revenue/Company")}</span>
            <span className="kpi-value">
              {formatCurrency(kpis.avg_revenue)}
            </span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("Churn Rate")}</span>
            <span className="kpi-value">
              {(kpis.churn_rate || 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Charts */}
        <div className="print-charts">
          <div className="print-chart-box">
            <h3>{t("Revenue Trend")}</h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="custom-tooltip">
                          <span>{formatCurrency(payload[0].value)}</span>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1a237e"
                    fill="rgba(26,35,126,0.1)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">{t("No data")}</p>
            )}
          </div>

          <div className="print-chart-box">
            <h3>{t("Companies Growth")}</h3>
            {companiesGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={companiesGrowth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="new"
                    fill="#4caf50"
                    name={t("New")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="churned"
                    fill="#f44336"
                    name={t("Churned")}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">{t("No data")}</p>
            )}
          </div>

          <div className="print-chart-box">
            <h3>{t("Plans Distribution")}</h3>
            {plansDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={plansDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {plansDistribution.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">{t("No data")}</p>
            )}
          </div>

          <div className="print-chart-box">
            <h3>{t("Companies by Status")}</h3>
            <div className="status-list">
              {Object.entries(overview).map(([status, count]) => (
                <div key={status} className="status-item">
                  <span
                    className="status-dot"
                    style={{
                      backgroundColor: STATUS_COLORS[status] || "#6c757d",
                    }}
                  ></span>
                  <span>
                    {t(status)}: {formatNumber(count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Companies Table */}
        {topCompanies.length > 0 && (
          <div className="print-section">
            <h3>{t("Top Performing Companies")}</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("Company")}</th>
                  <th>{t("Revenue")}</th>
                  <th>{t("Growth")}</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{formatCurrency(c.revenue)}</td>
                    <td
                      style={{ color: c.growth >= 0 ? "#2e7d32" : "#c62828" }}
                    >
                      {c.growth > 0 ? "+" : ""}
                      {c.growth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="print-footer">
          {t("Generated on")}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
