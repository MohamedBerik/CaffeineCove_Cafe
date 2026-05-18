import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintDoctorPerformanceReportPage.css";

export default function PrintDoctorPerformanceReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const queryParams = new URLSearchParams(location.search);
  const [filters] = useState({
    from: queryParams.get("from") || today,
    to: queryParams.get("to") || today,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

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

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const appointments = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctors = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      // فلترة حسب التاريخ
      const filtered = appointments.filter((a) => {
        const d = String(a.appointment_date || "").slice(0, 10);
        if (filters.from && d < filters.from) return false;
        if (filters.to && d > filters.to) return false;
        return true;
      });

      const doctorStats = doctors.map((doc) => {
        const items = filtered.filter(
          (a) => String(a.doctor_id) === String(doc.id),
        );

        const total = items.length;
        const completed = items.filter((x) => x.status === "completed").length;
        const cancelled = items.filter((x) => x.status === "cancelled").length;
        const no_show = items.filter((x) => x.status === "no_show").length;
        const scheduled = items.filter((x) => x.status === "scheduled").length;

        const completionRate = total
          ? Math.round((completed / total) * 100)
          : 0;

        return {
          id: doc.id,
          name: doc.name,
          specialty: doc.specialty || "-",
          total,
          completed,
          cancelled,
          no_show,
          scheduled,
          completionRate,
        };
      });

      setRows(doctorStats);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load doctor performance report."),
      );
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalDoctors = rows.length;
    const totalAppointments = rows.reduce((sum, r) => sum + r.total, 0);
    const avgCompletion = totalDoctors
      ? Math.round(
          rows.reduce((s, r) => s + r.completionRate, 0) / totalDoctors,
        )
      : 0;

    return { totalDoctors, totalAppointments, avgCompletion };
  }, [rows]);

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
    <div className="print-doctor-report-page">
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
        <h1 className="print-title">{t("Doctor Performance Report")}</h1>
        <p className="print-period">
          {t("Period")}: {formatDate(filters.from)} – {formatDate(filters.to)}
        </p>

        {/* Summary Cards */}
        <div className="print-summary-grid">
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Doctors")}</span>
            <span className="summary-value">{summary.totalDoctors}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Appointments")}</span>
            <span className="summary-value">{summary.totalAppointments}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Avg Completion Rate")}</span>
            <span className="summary-value">{summary.avgCompletion}%</span>
          </div>
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <p className="text-center text-muted">{t("No data available.")}</p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th>{t("Doctor")}</th>
                <th>{t("Specialty")}</th>
                <th>{t("Total")}</th>
                <th>{t("Completed")}</th>
                <th>{t("Scheduled")}</th>
                <th>{t("Cancelled")}</th>
                <th>{t("No Show")}</th>
                <th>{t("Completion Rate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.specialty}</td>
                  <td>{row.total}</td>
                  <td>{row.completed}</td>
                  <td>{row.scheduled}</td>
                  <td>{row.cancelled}</td>
                  <td>{row.no_show}</td>
                  <td>{row.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="print-footer">
          {t("Generated on")}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
