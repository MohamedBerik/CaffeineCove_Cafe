import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./AppointmentCalendarPage.css";

export default function AppointmentCalendarPage() {
  const { t, i18n } = useTranslation();

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

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

      setAppointments(appointmentRows);
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load appointment calendar."),
      );
    } finally {
      setLoading(false);
    }
  };

  const normalizeDate = (value) => {
    if (!value) return "";

    const raw = String(value).trim();

    if (raw.length >= 10) {
      return raw.slice(0, 10);
    }

    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return raw;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch {
      return raw;
    }
  };

  const normalizeTime = (value) => {
    if (!value) return "";
    return String(value).slice(0, 5);
  };

  const formatAppointmentType = (value) => {
    const type = String(value || "").toLowerCase();

    if (type === "consultation") return t("Consultation");
    if (type === "treatment") return t("Treatment");

    return "-";
  };

  const formatDateLabel = (value) => {
    if (!value) return "-";

    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(`${value}T12:00:00`).toLocaleDateString(lang, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const visibleAppointments = useMemo(() => {
    return appointments
      .filter((item) => {
        const sameDate =
          normalizeDate(item.appointment_date) === normalizeDate(selectedDate);

        const sameDoctor = selectedDoctorId
          ? String(item.doctor_id || "") === String(selectedDoctorId)
          : true;

        return sameDate && sameDoctor;
      })
      .sort((a, b) => {
        return normalizeTime(a.appointment_time).localeCompare(
          normalizeTime(b.appointment_time),
        );
      });
  }, [appointments, selectedDate, selectedDoctorId]);

  const groupedByHour = useMemo(() => {
    const groups = {};

    visibleAppointments.forEach((item) => {
      const hhmm = normalizeTime(item.appointment_time) || "00:00";
      const hourKey = `${hhmm.slice(0, 2)}:00`;

      if (!groups[hourKey]) groups[hourKey] = [];
      groups[hourKey].push(item);
    });

    return groups;
  }, [visibleAppointments]);

  const hours = useMemo(() => {
    const result = [];
    for (let h = 8; h <= 20; h += 1) {
      result.push(`${String(h).padStart(2, "0")}:00`);
    }
    return result;
  }, []);

  const changeDay = (direction) => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + direction);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    setSelectedDate(`${year}-${month}-${day}`);
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
    <div className="calendar-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Appointment Calendar")}</h1>
          <p className="page-subtitle">
            {t("Daily clinic schedule by date and doctor")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/appointments/create"
            className="btn btn-outline-success"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Book Appointment")}
          </Link>

          <button className="btn btn-primary" onClick={loadData}>
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
          <i className="fas fa-sliders-h me-2"></i>
          <h5 className="mb-0">{t("Calendar Filters")}</h5>
        </div>
        <div className="filters-card-body">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-calendar-day me-1"></i>
                {t("Date")}
              </label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-user-md me-1"></i>
                {t("Doctor")}
              </label>
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">{t("All Doctors")}</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-chevron-circle-left me-1"></i>
                {t("Navigation")}
              </label>
              <div className="date-nav-buttons">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => changeDay(-1)}
                  title={t("Previous Day")}
                >
                  <i className="fas fa-chevron-left"></i>
                  <span className="nav-text">{t("Prev")}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setSelectedDate(todayStr)}
                >
                  <i className="fas fa-calendar-day me-1"></i>
                  {t("Today")}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => changeDay(1)}
                  title={t("Next Day")}
                >
                  <span className="nav-text">{t("Next")}</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="selected-day-info">
            <div className="day-label">{t("Selected Day")}</div>
            <div className="day-value">{formatDateLabel(selectedDate)}</div>
          </div>
        </div>
      </div>

      {/* Calendar Schedule Card */}
      <div className="schedule-card">
        <div className="schedule-card-header">
          <i className="fas fa-calendar-alt me-2"></i>
          <h5 className="mb-0">{t("Daily Schedule")}</h5>
          <span className="appointment-count">
            {visibleAppointments.length} {t("appointments")}
          </span>
        </div>

        <div className="schedule-card-body">
          {visibleAppointments.length === 0 ? (
            <div className="empty-schedule">
              <i className="fas fa-calendar-times empty-icon"></i>
              <p className="empty-text">
                {t("No appointments scheduled for this selection.")}
              </p>
            </div>
          ) : (
            <div className="schedule-timeline">
              {hours.map((hour) => {
                const items = groupedByHour[hour] || [];
                const hasAppointments = items.length > 0;

                return (
                  <div key={hour} className="timeline-row">
                    <div className="timeline-hour">
                      <div className="hour-label">{hour}</div>
                    </div>

                    <div className="timeline-slots">
                      {!hasAppointments ? (
                        <div className="empty-slot">
                          <i className="fas fa-clock me-1"></i>
                          {t("No appointments")}
                        </div>
                      ) : (
                        <div className="appointments-list">
                          {items.map((item) => (
                            <AppointmentCard
                              key={item.id}
                              item={item}
                              normalizeTime={normalizeTime}
                              formatAppointmentType={formatAppointmentType}
                              t={t}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AppointmentCard Component
function AppointmentCard({ item, normalizeTime, formatAppointmentType, t }) {
  const status = String(item.status || "").toLowerCase();

  const getStatusColor = () => {
    if (status === "completed") return "success";
    if (status === "cancelled" || status === "no_show") return "danger";
    if (status === "scheduled") return "warning";
    if (status === "in_progress") return "info";
    return "secondary";
  };

  const getTypeColor = () => {
    const type = String(item.appointment_type || "").toLowerCase();
    if (type === "consultation") return "primary";
    if (type === "treatment") return "info";
    return "secondary";
  };

  return (
    <div className={`appointment-card status-${getStatusColor()}`}>
      <div className="appointment-header">
        <div className="appointment-time">
          <i className="fas fa-clock me-1"></i>
          {normalizeTime(item.appointment_time)}
        </div>
        <div className="appointment-badges">
          <span className={`badge-type type-${getTypeColor()}`}>
            {formatAppointmentType(item.appointment_type)}
          </span>
          <span className={`badge-status status-${getStatusColor()}`}>
            {t(item.status || "-")}
          </span>
        </div>
      </div>

      <div className="appointment-patient">
        <div className="patient-name">
          <i className="fas fa-user-circle me-2"></i>
          {item.patient?.name || t("Unknown Patient")}
        </div>
        <div className="patient-details">
          <span>{item.patient?.email || "-"}</span>
          <span className="separator">•</span>
          <span>{item.doctor?.name || item.doctor_name || "-"}</span>
        </div>
      </div>

      {item.notes && (
        <div className="appointment-notes">
          <i className="fas fa-pencil-alt me-1"></i>
          <span>{item.notes}</span>
        </div>
      )}

      {(item.clinical_notes || item.diagnosis || item.next_step) && (
        <div className="appointment-clinical">
          {item.clinical_notes && (
            <div className="clinical-item">
              <i className="fas fa-notes-medical me-1"></i>
              <strong>{t("Clinical Notes")}:</strong> {item.clinical_notes}
            </div>
          )}
          {item.diagnosis && (
            <div className="clinical-item">
              <i className="fas fa-stethoscope me-1"></i>
              <strong>{t("Diagnosis")}:</strong> {item.diagnosis}
            </div>
          )}
          {item.next_step && (
            <div className="clinical-item">
              <i className="fas fa-arrow-right me-1"></i>
              <strong>{t("Next Step")}:</strong> {item.next_step}
            </div>
          )}
        </div>
      )}

      <div className="appointment-actions">
        {item.patient?.id && (
          <Link
            to={`/admin/erp/patients/${item.patient.id}/profile`}
            className="btn btn-sm btn-outline-primary"
            title={t("View Patient")}
          >
            <i className="fas fa-user"></i>
            <span>{t("Patient")}</span>
          </Link>
        )}

        {item.treatment_plan_id && (
          <Link
            to={`/admin/erp/treatment-plans/${item.treatment_plan_id}`}
            className="btn btn-sm btn-outline-info"
            title={t("View Treatment Plan")}
          >
            <i className="fas fa-notes-medical"></i>
            <span>{t("Plan")}</span>
          </Link>
        )}

        {item.invoice_id && (
          <Link
            to={`/admin/erp/invoices/${item.invoice_id}`}
            className="btn btn-sm btn-outline-success"
            title={t("View Invoice")}
          >
            <i className="fas fa-file-invoice"></i>
            <span>{t("Invoice")}</span>
          </Link>
        )}

        <Link
          to={`/admin/erp/appointments/${item.id}/activity`}
          className="btn btn-sm btn-outline-secondary"
          title={t("View Activity")}
        >
          <i className="fas fa-history"></i>
          <span>{t("Activity")}</span>
        </Link>
      </div>
    </div>
  );
}
