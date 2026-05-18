import { useEffect, useMemo, useState } from "react";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import "./PrintAppointmentsReportPage.css";

export default function PrintAppointmentsReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const queryParams = new URLSearchParams(location.search);
  const [filters] = useState({
    from: queryParams.get("from") || today,
    to: queryParams.get("to") || today,
    doctor_id: queryParams.get("doctor_id") || "",
    status: queryParams.get("status") || "",
  });

  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    in_progress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const appointmentRows = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      // تطبيق الفلاتر
      const filtered = appointmentRows.filter((item) => {
        const dateOnly = String(item.appointment_date || "").slice(0, 10);
        if (filters.from && dateOnly < filters.from) return false;
        if (filters.to && dateOnly > filters.to) return false;
        if (
          filters.doctor_id &&
          String(item.doctor_id || "") !== String(filters.doctor_id)
        )
          return false;
        if (
          filters.status &&
          String(item.status || "").toLowerCase() !==
            filters.status.toLowerCase()
        )
          return false;
        return true;
      });

      const total = filtered.length;
      const scheduled = filtered.filter((x) => x.status === "scheduled").length;
      const completed = filtered.filter((x) => x.status === "completed").length;
      const cancelled = filtered.filter((x) => x.status === "cancelled").length;
      const no_show = filtered.filter((x) => x.status === "no_show").length;
      const in_progress = filtered.filter(
        (x) => x.status === "in_progress",
      ).length;

      setRows(filtered);
      setDoctors(doctorRows);
      setSummary({
        total,
        scheduled,
        completed,
        cancelled,
        no_show,
        in_progress,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load appointments report."),
      );
    } finally {
      setLoading(false);
    }
  };

  const doctorLabel = useMemo(() => {
    if (!filters.doctor_id) return t("All Doctors");
    const doctor = doctors.find(
      (d) => String(d.id) === String(filters.doctor_id),
    );
    return doctor?.name || `${t("Doctor")} #${filters.doctor_id}`;
  }, [filters.doctor_id, doctors]);

  const statusLabel = useMemo(() => {
    if (!filters.status) return t("All Statuses");
    const map = {
      scheduled: t("Scheduled"),
      completed: t("Completed"),
      cancelled: t("Cancelled"),
      no_show: t("No Show"),
      in_progress: t("In Progress"),
    };
    return map[filters.status] || filters.status;
  }, [filters.status]);

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
    <div className="print-appointments-report-page">
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
        <h1 className="print-title">{t("Appointments Report")}</h1>
        <p className="print-period">
          {doctorLabel} | {formatDate(filters.from)} – {formatDate(filters.to)}
          {filters.status && ` | ${statusLabel}`}
        </p>

        {/* Summary Cards */}
        <div className="print-summary-grid">
          <div className="print-summary-card">
            <span className="summary-label">{t("Total")}</span>
            <span className="summary-value">{summary.total}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Scheduled")}</span>
            <span className="summary-value">{summary.scheduled}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Completed")}</span>
            <span className="summary-value">{summary.completed}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Cancelled")}</span>
            <span className="summary-value">{summary.cancelled}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("No Show")}</span>
            <span className="summary-value">{summary.no_show}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("In Progress")}</span>
            <span className="summary-value">{summary.in_progress}</span>
          </div>
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <p className="text-center text-muted">
            {t("No appointments found.")}
          </p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th>{t("Patient")}</th>
                <th>{t("Doctor")}</th>
                <th>{t("Date")}</th>
                <th>{t("Time")}</th>
                <th>{t("Status")}</th>
                <th>{t("Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.patient?.name || "-"}</td>
                  <td>{item.doctor?.name || item.doctor_name || "-"}</td>
                  <td>{formatDate(item.appointment_date)}</td>
                  <td>
                    {String(item.appointment_time || "").slice(0, 5) || "-"}
                  </td>
                  <td>{item.status}</td>
                  <td>{item.notes || "-"}</td>
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
