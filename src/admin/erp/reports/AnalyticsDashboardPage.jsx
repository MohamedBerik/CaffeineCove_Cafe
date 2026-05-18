import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./AnalyticsDashboardPage.css";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Colors for Pie Chart
const COLORS = ["#1a237e", "#4caf50", "#f44336", "#ff9800", "#03a9f4"];

export default function AnalyticsDashboardPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
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

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, invoicesRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/invoices"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const invoicesPayload = invoicesRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const appointmentRows = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const invoiceRows = Array.isArray(invoicesPayload.data)
        ? invoicesPayload.data
        : invoicesPayload.data?.data || invoicesPayload.invoices || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      setAppointments(appointmentRows);
      setInvoices(invoiceRows);
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load analytics."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inRange = (dateValue) => {
    const dateOnly = String(dateValue || "").slice(0, 10);
    if (!dateOnly) return false;
    if (filters.from && dateOnly < filters.from) return false;
    if (filters.to && dateOnly > filters.to) return false;
    return true;
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => inRange(item.appointment_date));
  }, [appointments, filters]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) =>
      inRange(item.issued_at || item.created_at),
    );
  }, [invoices, filters]);

  const revenueTrendData = useMemo(() => {
    const map = {};

    filteredInvoices.forEach((item) => {
      const date = String(item.issued_at || item.created_at || "").slice(0, 10);
      if (!date) return;

      const total = Number(item.total || 0);
      const paid = Number(item.net_paid ?? item.total_paid ?? 0);

      if (!map[date]) {
        map[date] = {
          date: formatDate(date),
          invoiced: 0,
          paid: 0,
        };
      }

      map[date].invoiced += total;
      map[date].paid += paid;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInvoices]);

  const appointmentStatusData = useMemo(() => {
    const statusMap = {
      scheduled: t("Scheduled"),
      completed: t("Completed"),
      cancelled: t("Cancelled"),
      no_show: t("No Show"),
      in_progress: t("In Progress"),
    };

    const counts = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      in_progress: 0,
    };

    filteredAppointments.forEach((item) => {
      const key = String(item.status || "").toLowerCase();
      if (counts[key] != null) counts[key] += 1;
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: statusMap[name] || name,
        value,
      }));
  }, [filteredAppointments]);

  const doctorLoadData = useMemo(() => {
    return doctors.map((doctor) => {
      const doctorAppointments = filteredAppointments.filter(
        (a) => String(a.doctor_id) === String(doctor.id),
      );

      return {
        name: doctor.name || `${t("Doctor")} #${doctor.id}`,
        total: doctorAppointments.length,
        completed: doctorAppointments.filter((a) => a.status === "completed")
          .length,
      };
    });
  }, [doctors, filteredAppointments]);

  const paymentSnapshot = useMemo(() => {
    let invoiced = 0;
    let paid = 0;
    let refunded = 0;
    let remaining = 0;

    filteredInvoices.forEach((item) => {
      const total = Number(item.total || 0);
      const grossPaid = Number(
        item.total_paid ?? item.gross_paid ?? item.net_paid ?? 0,
      );
      const itemRefunded = Number(item.total_refunded ?? item.refunded ?? 0);
      const netPaid =
        item.net_paid != null
          ? Number(item.net_paid)
          : Math.max(grossPaid - itemRefunded, 0);
      const itemRemaining =
        item.remaining != null
          ? Number(item.remaining)
          : Math.max(total - netPaid, 0);

      invoiced += total;
      paid += netPaid;
      refunded += itemRefunded;
      remaining += itemRemaining;
    });

    return [
      { name: t("Invoiced"), value: invoiced, color: "#1a237e" },
      { name: t("Paid"), value: paid, color: "#4caf50" },
      { name: t("Refunded"), value: refunded, color: "#f44336" },
      { name: t("Remaining"), value: remaining, color: "#ff9800" },
    ];
  }, [filteredInvoices]);

  const kpis = useMemo(() => {
    const totalAppointments = filteredAppointments.length;
    const completedAppointments = filteredAppointments.filter(
      (a) => a.status === "completed",
    ).length;

    const totalInvoiced = filteredInvoices.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );

    const totalPaid = filteredInvoices.reduce(
      (sum, item) => sum + Number(item.net_paid ?? item.total_paid ?? 0),
      0,
    );

    return {
      totalAppointments,
      completedAppointments,
      totalInvoiced,
      totalPaid,
    };
  }, [filteredAppointments, filteredInvoices]);

  const applyFilters = async (e) => {
    e.preventDefault();
    // Filters are already applied via useMemo
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
    <div className="analytics-dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Analytics Dashboard")}</h1>
          <p className="page-subtitle">
            {t(
              "Visual overview of revenue, appointments, doctors, and collections",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-chart-bar me-2"></i>
            {t("Back to Reports")}
          </Link>
          <Link
            to="/admin/erp/reports/analytics/print"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark"
          >
            <i className="fas fa-print me-2"></i>
            {t("Print")}
          </Link>
          <button className="btn btn-primary" onClick={loadAnalytics}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Date Range Filter")}</h5>
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

      {/* KPI Cards */}
      <div className="kpi-grid">
        <MetricCard
          title={t("Total Appointments")}
          value={kpis.totalAppointments}
          subtitle={t("Filtered range")}
          icon="fas fa-calendar-check"
          color="primary"
        />
        <MetricCard
          title={t("Completed Appointments")}
          value={kpis.completedAppointments}
          subtitle={t("Appointments done")}
          icon="fas fa-check-circle"
          color="success"
        />
        <MetricCard
          title={t("Total Invoiced")}
          value={formatCurrency(kpis.totalInvoiced)}
          subtitle={t("Total billed")}
          icon="fas fa-file-invoice"
          color="primary"
        />
        <MetricCard
          title={t("Total Collected")}
          value={formatCurrency(kpis.totalPaid)}
          subtitle={t("Net paid")}
          icon="fas fa-money-bill-wave"
          color="success"
        />
      </div>

      <div className="charts-grid">
        {/* Revenue Trend Chart */}
        <div className="chart-card large">
          <div className="chart-card-header">
            <i className="fas fa-chart-line me-2"></i>
            <h5 className="mb-0">{t("Revenue Trend")}</h5>
          </div>
          <div className="chart-card-body">
            {revenueTrendData.length === 0 ? (
              <div className="empty-chart">
                <i className="fas fa-chart-line empty-icon"></i>
                <p className="empty-text">
                  {t("No revenue data in this range.")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="invoiced"
                    stroke="#1a237e"
                    strokeWidth={2}
                    name={t("Invoiced")}
                  />
                  <Line
                    type="monotone"
                    dataKey="paid"
                    stroke="#4caf50"
                    strokeWidth={2}
                    name={t("Paid")}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Appointment Status Pie Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <i className="fas fa-chart-pie me-2"></i>
            <h5 className="mb-0">{t("Appointment Status")}</h5>
          </div>
          <div className="chart-card-body">
            {appointmentStatusData.length === 0 ? (
              <div className="empty-chart">
                <i className="fas fa-chart-pie empty-icon"></i>
                <p className="empty-text">
                  {t("No appointment data in this range.")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Doctor Load Bar Chart */}
        <div className="chart-card large">
          <div className="chart-card-header">
            <i className="fas fa-chart-bar me-2"></i>
            <h5 className="mb-0">{t("Doctor Load")}</h5>
          </div>
          <div className="chart-card-body">
            {doctorLoadData.length === 0 ||
            doctorLoadData.every((d) => d.total === 0) ? (
              <div className="empty-chart">
                <i className="fas fa-chart-bar empty-icon"></i>
                <p className="empty-text">{t("No doctor data available.")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={doctorLoadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="total"
                    fill="#1a237e"
                    name={t("Total Appointments")}
                  />
                  <Bar
                    dataKey="completed"
                    fill="#4caf50"
                    name={t("Completed")}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Snapshot Card */}
        <div className="snapshot-card">
          <div className="snapshot-card-header">
            <i className="fas fa-wallet me-2"></i>
            <h5 className="mb-0">{t("Payment Snapshot")}</h5>
          </div>
          <div className="snapshot-card-body">
            {paymentSnapshot.map((item) => (
              <div key={item.name} className="snapshot-item">
                <div className="snapshot-label">
                  <div
                    className="snapshot-dot"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}</span>
                </div>
                <div className="snapshot-value">
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// MetricCard Component
function MetricCard({ title, value, subtitle, icon, color = "primary" }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="metric-card">
      <div
        className="metric-icon"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <i className={icon}></i>
      </div>
      <div className="metric-content">
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}
