import { useEffect, useMemo, useState } from "react";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintAnalyticsDashboardPage.css";
import { useNavigate, useLocation } from "react-router-dom";

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

const COLORS = ["#1a237e", "#4caf50", "#f44336", "#ff9800", "#03a9f4"];

export default function PrintAnalyticsDashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation(); // لاستخراج القيم من الرابط
  const today = new Date().toISOString().slice(0, 10);

  // قراءة التواريخ من الرابط إذا وجدت، وإلا استخدام تاريخ اليوم كبديل احتياطي
  const queryParams = new URLSearchParams(location.search);
  const [filters] = useState({
    from: queryParams.get("from") || today,
    to: queryParams.get("to") || today,
  });
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  };

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

  const loadData = async () => {
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

      // ✅ نفس منطق الاستخراج الموجود في AnalyticsDashboardPage
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

  const inRange = (dateValue) => {
    const d = String(dateValue || "").slice(0, 10);
    if (!d) return false;
    return (
      (!filters.from || d >= filters.from) && (!filters.to || d <= filters.to)
    );
  };

  const filteredAppointments = useMemo(
    () => appointments.filter((a) => inRange(a.appointment_date)),
    [appointments, filters],
  );

  const filteredInvoices = useMemo(
    () => invoices.filter((i) => inRange(i.issued_at || i.created_at)),
    [invoices, filters],
  );

  const revenueTrend = useMemo(() => {
    const map = {};
    filteredInvoices.forEach((inv) => {
      const date = String(inv.issued_at || inv.created_at || "").slice(0, 10);
      if (!date) return;
      if (!map[date])
        map[date] = { date: formatDate(date), invoiced: 0, paid: 0 };
      map[date].invoiced += Number(inv.total || 0);
      map[date].paid += Number(inv.net_paid ?? inv.total_paid ?? 0);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInvoices]);

  const appointmentStatus = useMemo(() => {
    const labels = {
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
    filteredAppointments.forEach((a) => {
      const key = String(a.status || "").toLowerCase();
      if (counts[key] !== undefined) counts[key]++;
    });
    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [filteredAppointments]);

  const doctorLoad = useMemo(() => {
    return doctors.map((doc) => {
      const apps = filteredAppointments.filter(
        (a) => String(a.doctor_id) === String(doc.id),
      );
      return {
        name: doc.name || `${t("Doctor")} #${doc.id}`,
        total: apps.length,
        completed: apps.filter((a) => a.status === "completed").length,
      };
    });
  }, [doctors, filteredAppointments]);

  const paymentSnapshot = useMemo(() => {
    let invoiced = 0,
      paid = 0,
      refunded = 0,
      remaining = 0;
    filteredInvoices.forEach((inv) => {
      const ttl = Number(inv.total || 0);
      const net = Number(inv.net_paid ?? inv.total_paid ?? 0);
      const ref = Number(inv.total_refunded ?? 0);
      invoiced += ttl;
      paid += net;
      refunded += ref;
      remaining += Math.max(ttl - net, 0);
    });
    return [
      { name: t("Invoiced"), value: invoiced, color: "#1a237e" },
      { name: t("Paid"), value: paid, color: "#4caf50" },
      { name: t("Refunded"), value: refunded, color: "#f44336" },
      { name: t("Remaining"), value: remaining, color: "#ff9800" },
    ];
  }, [filteredInvoices]);

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
    <div className="print-analytics-page">
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
        <h1 className="print-title">{t("Analytics Dashboard")}</h1>
        <p className="print-period">
          {t("Period")}: {formatDate(filters.from)} – {formatDate(filters.to)}
        </p>

        {/* KPI Summary */}
        <div className="print-kpi-grid">
          <div className="print-kpi">
            <span className="kpi-label">{t("Appointments")}</span>
            <span className="kpi-value">{filteredAppointments.length}</span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("Completed")}</span>
            <span className="kpi-value">
              {
                filteredAppointments.filter((a) => a.status === "completed")
                  .length
              }
            </span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("Invoiced")}</span>
            <span className="kpi-value">
              {formatCurrency(
                filteredInvoices.reduce((s, i) => s + Number(i.total || 0), 0),
              )}
            </span>
          </div>
          <div className="print-kpi">
            <span className="kpi-label">{t("Collected")}</span>
            <span className="kpi-value">
              {formatCurrency(
                filteredInvoices.reduce(
                  (s, i) => s + Number(i.net_paid ?? i.total_paid ?? 0),
                  0,
                ),
              )}
            </span>
          </div>
        </div>

        {/* Charts */}
        <div className="print-charts">
          <div className="print-chart-box">
            <h3>{t("Revenue Trend")}</h3>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line
                    dataKey="invoiced"
                    stroke="#1a237e"
                    name={t("Invoiced")}
                  />
                  <Line dataKey="paid" stroke="#4caf50" name={t("Paid")} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">{t("No data")}</p>
            )}
          </div>

          <div className="print-chart-box">
            <h3>{t("Appointment Status")}</h3>
            {appointmentStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={appointmentStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {appointmentStatus.map((_, idx) => (
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
            <h3>{t("Doctor Load")}</h3>
            {doctorLoad.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={doctorLoad}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1a237e" name={t("Total")} />
                  <Bar
                    dataKey="completed"
                    fill="#4caf50"
                    name={t("Completed")}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">{t("No data")}</p>
            )}
          </div>

          <div className="print-chart-box">
            <h3>{t("Payment Snapshot")}</h3>
            <div className="snapshot-print">
              {paymentSnapshot.map((item) => (
                <div key={item.name} className="snapshot-row">
                  <span style={{ color: item.color }}>● {item.name}</span>
                  <span className="fw-bold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="print-footer">
          {t("Generated on")}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
