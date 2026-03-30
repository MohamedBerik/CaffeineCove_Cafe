import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./AppointmentListPage.css";

export default function AppointmentsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const highlightAppointmentId = searchParams.get("appointment_id") || "";

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  const [openRescheduleId, setOpenRescheduleId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    appointment_date: "",
    appointment_time: "",
    doctor_id: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments", {
          params: search ? { search } : {},
        }),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const rowsData = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      setRows(rowsData);
      setMeta(
        appointmentsPayload.meta || appointmentsPayload.data?.meta || null,
      );
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load appointments."),
      );
    } finally {
      setLoading(false);
    }
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
      return String(value).slice(0, 10);
    }
  };

  const formatTime = (value) => {
    if (!value) return "-";
    return String(value).slice(0, 5) || "-";
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

  const formatAppointmentType = (value) => {
    const type = String(value || "").toLowerCase();
    if (type === "consultation") return t("Consultation");
    if (type === "treatment") return t("Treatment");
    return value || "-";
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = rows.filter((item) => {
      const id = String(item.id || "").toLowerCase();
      const patientName = String(item.patient?.name || "").toLowerCase();
      const patientEmail = String(item.patient?.email || "").toLowerCase();
      const doctorName = String(
        item.doctor?.name || item.doctor_name || "",
      ).toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();
      const date = String(item.appointment_date || "").toLowerCase();
      const time = String(item.appointment_time || "")
        .slice(0, 5)
        .toLowerCase();
      const appointmentType = String(item.appointment_type || "").toLowerCase();
      const invoiceId = String(item.invoice_id || "").toLowerCase();
      const treatmentPlanId = String(
        item.treatment_plan_id || "",
      ).toLowerCase();

      const matchesSearch =
        !q ||
        id.includes(q) ||
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        doctorName.includes(q) ||
        status.includes(q) ||
        notes.includes(q) ||
        date.includes(q) ||
        time.includes(q) ||
        appointmentType.includes(q) ||
        invoiceId.includes(q) ||
        treatmentPlanId.includes(q);

      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();

      const normalizedItemDate = String(item.appointment_date || "").slice(
        0,
        10,
      );

      const matchesDate = !dateFilter || normalizedItemDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });

    return [...result].sort((a, b) => {
      const aHighlighted =
        String(a.id) === String(highlightAppointmentId || "") ? 1 : 0;
      const bHighlighted =
        String(b.id) === String(highlightAppointmentId || "") ? 1 : 0;

      if (aHighlighted !== bHighlighted) {
        return bHighlighted - aHighlighted;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [rows, search, statusFilter, dateFilter, highlightAppointmentId]);

  const applySearch = async (e) => {
    e.preventDefault();
    await loadAll();
  };

  const clearActionMessages = () => {
    setActionError("");
    setActionSuccess("");
  };

  const postAction = async (url, successMessage) => {
    try {
      clearActionMessages();
      setActingId(url);

      await axios.post(url);

      setActionSuccess(successMessage);
      closeInlineForms();
      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Action failed."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Action failed."),
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (item) => {
    const ok = window.confirm(t("Cancel this appointment?"));
    if (!ok) return;

    await postAction(
      `/erp/appointments/${item.id}/cancel`,
      t("Appointment cancelled successfully."),
    );
  };

  const handleNoShow = async (item) => {
    const ok = window.confirm(t("Mark this appointment as no-show?"));
    if (!ok) return;

    await postAction(
      `/erp/appointments/${item.id}/no-show`,
      t("Appointment marked as no-show."),
    );
  };

  const handleSendReminder = async (item) => {
    const ok = window.confirm(t("Send reminder for this appointment?"));
    if (!ok) return;

    try {
      clearActionMessages();
      setActingId(`reminder-${item.id}`);

      const res = await axios.post(
        `/erp/appointments/${item.id}/send-reminder`,
      );

      setActionSuccess(res?.data?.msg || t("Reminder sent successfully."));

      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to send reminder."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to send reminder."),
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const handleComplete = async (item) => {
    const typeLabel = formatAppointmentType(item.appointment_type);
    const ok = window.confirm(
      t("Complete this {{type}} appointment?", {
        type: typeLabel.toLowerCase(),
      }),
    );
    if (!ok) return;

    try {
      clearActionMessages();
      setActingId(`complete-${item.id}`);

      const res = await axios.post(`/erp/appointments/${item.id}/complete`, {});
      const result = res?.data || {};

      setActionSuccess(result?.msg || t("Appointment completed successfully."));

      await loadAll();

      if (result?.invoice_id) {
        navigate(`/admin/erp/invoices/${result.invoice_id}`);
        return;
      }

      if (result?.treatment_plan_id) {
        navigate(`/admin/erp/treatment-plans/${result.treatment_plan_id}`);
        return;
      }

      navigate(`/admin/erp/appointments/${item.id}/activity`);
    } catch (err) {
      const responseData = err?.response?.data || {};
      const errors = responseData?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to complete appointment."));
      } else {
        setActionError(
          responseData?.message ||
            responseData?.msg ||
            t("Failed to complete appointment."),
        );
      }

      if (responseData?.invoice_id) {
        navigate(`/admin/erp/invoices/${responseData.invoice_id}`);
      }
    } finally {
      setActingId(null);
    }
  };

  const openRescheduleFormFor = (item) => {
    clearActionMessages();
    setOpenRescheduleId(item.id);
    setRescheduleForm({
      appointment_date: item.appointment_date || "",
      appointment_time: formatTime(item.appointment_time),
      doctor_id: item.doctor_id ? String(item.doctor_id) : "",
    });
  };

  const submitReschedule = async (appointmentId) => {
    try {
      clearActionMessages();
      setActingId(`reschedule-${appointmentId}`);

      const payload = {
        appointment_date: rescheduleForm.appointment_date,
        appointment_time: rescheduleForm.appointment_time,
        doctor_id: Number(rescheduleForm.doctor_id),
      };

      await axios.post(
        `/erp/appointments/${appointmentId}/reschedule`,
        payload,
      );

      setActionSuccess(t("Appointment rescheduled successfully."));
      closeInlineForms();
      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to reschedule appointment."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to reschedule appointment."),
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const closeInlineForms = () => {
    setOpenRescheduleId(null);
    setRescheduleForm({
      appointment_date: "",
      appointment_time: "",
      doctor_id: "",
    });
  };

  const clearFilters = async () => {
    setSearch("");
    setStatusFilter("");
    setDateFilter("");
    setOpenRescheduleId(null);
    clearActionMessages();

    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const rowsData = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      setRows(rowsData);
      setMeta(
        appointmentsPayload.meta || appointmentsPayload.data?.meta || null,
      );
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load appointments."),
      );
    } finally {
      setLoading(false);
    }
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
    <div className="appointments-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Appointments")}</h1>
          <p className="page-subtitle">
            {t("Daily schedule, doctor bookings, and patient appointments")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/appointments/calendar"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-calendar-alt me-2"></i>
            {t("Calendar")}
          </Link>

          <Link
            to="/admin/erp/appointments/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Book Appointment")}
          </Link>

          <button className="btn btn-primary" onClick={loadAll}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {actionError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError("")}
          ></button>
        </div>
      )}

      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {actionSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionSuccess("")}
          ></button>
        </div>
      )}

      {/* Search Filters Card */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Search & Filters")}</h5>
        </div>
        <div className="filters-card-body">
          <form onSubmit={applySearch}>
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-search me-1"></i>
                  {t("Search")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t(
                    "ID, patient, doctor, date, time, status, type, invoice, plan...",
                  )}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-calendar me-1"></i>
                  {t("Date")}
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-tag me-1"></i>
                  {t("Status")}
                </label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">{t("All Statuses")}</option>
                  <option value="scheduled">{t("Scheduled")}</option>
                  <option value="completed">{t("Completed")}</option>
                  <option value="cancelled">{t("Cancelled")}</option>
                  <option value="no_show">{t("No Show")}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-database me-1"></i>
                  {t("Loaded")}
                </label>
                <div className="filter-badge">{meta?.total ?? rows.length}</div>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-eye me-1"></i>
                  {t("Shown")}
                </label>
                <div className="filter-badge">{filteredRows.length}</div>
              </div>

              <div className="filter-actions">
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-search me-2"></i>
                  {t("Search")}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                >
                  <i className="fas fa-eraser me-2"></i>
                  {t("Clear Filters")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="appointments-table-card">
        <div className="table-card-header">
          <i className="fas fa-calendar-check me-2"></i>
          <h5 className="mb-0">{t("Appointments List")}</h5>
        </div>

        <div className="table-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times empty-icon"></i>
              <p className="empty-text">{t("No appointments found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Patient")}</th>
                    <th>{t("Doctor")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Time")}</th>
                    <th>{t("Type")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Reminder")}</th>
                    <th>{t("Next Reminder")}</th>
                    <th>{t("Last Reminder")}</th>
                    <th>{t("Follow-up")}</th>
                    <th>{t("Invoice")}</th>
                    <th>{t("Treatment Plan")}</th>
                    <th>{t("Notes")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
                    <AppointmentRow
                      key={item.id}
                      item={item}
                      doctors={doctors}
                      actingId={actingId}
                      onCancel={handleCancel}
                      onNoShow={handleNoShow}
                      onSendReminder={handleSendReminder}
                      onComplete={handleComplete}
                      onOpenReschedule={openRescheduleFormFor}
                      openRescheduleId={openRescheduleId}
                      rescheduleForm={rescheduleForm}
                      setRescheduleForm={setRescheduleForm}
                      onSubmitReschedule={submitReschedule}
                      onCloseInlineForms={closeInlineForms}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      formatDateTime={formatDateTime}
                      formatAppointmentType={formatAppointmentType}
                      highlightAppointmentId={highlightAppointmentId}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AppointmentRow Component
function AppointmentRow({
  item,
  doctors,
  actingId,
  onCancel,
  onNoShow,
  onSendReminder,
  onComplete,
  onOpenReschedule,
  openRescheduleId,
  rescheduleForm,
  setRescheduleForm,
  onSubmitReschedule,
  onCloseInlineForms,
  formatDate,
  formatTime,
  formatDateTime,
  formatAppointmentType,
  highlightAppointmentId,
  t,
}) {
  const isRescheduleOpen = openRescheduleId === item.id;
  const isHighlighted =
    String(item.id) === String(highlightAppointmentId || "");

  const status = String(item.status || "").toLowerCase();
  const canComplete = status === "scheduled";
  const canCancel = status === "scheduled";
  const canNoShow = status === "scheduled";
  const canReschedule = ["scheduled", "cancelled", "no_show"].includes(status);

  const patientId = item.patient?.id || item.patient_id || null;
  const invoiceId = item.invoice_id || null;
  const treatmentPlanId = item.treatment_plan_id || null;
  const reminderStatus = String(item.reminder_status || "").toLowerCase();
  const canSendReminder =
    status === "scheduled" && ["pending", "sent"].includes(reminderStatus);

  return (
    <>
      <tr className={isHighlighted ? "highlighted-row" : ""}>
        <td data-label={t("ID")}>
          <span className="appointment-id">APT-{item.id}</span>
        </td>

        <td data-label={t("Patient")}>
          <div className="patient-info">
            <div className="patient-name">
              {patientId ? (
                <Link
                  to={`/admin/erp/patients/${patientId}/profile`}
                  className="patient-link"
                >
                  {item.patient?.name || `Patient #${patientId}`}
                </Link>
              ) : (
                item.patient?.name || "-"
              )}
            </div>
            <div className="patient-email">{item.patient?.email || "-"}</div>
          </div>
        </td>

        <td data-label={t("Doctor")}>
          {item.doctor?.name || item.doctor_name || "-"}
        </td>

        <td data-label={t("Date")}>{formatDate(item.appointment_date)}</td>
        <td data-label={t("Time")}>{formatTime(item.appointment_time)}</td>

        <td data-label={t("Type")}>
          <AppointmentTypeBadge type={item.appointment_type} t={t} />
        </td>

        <td data-label={t("Status")}>
          <StatusBadge status={item.status} t={t} />
        </td>

        <td data-label={t("Reminder")}>
          <ReminderStatusBadge status={item.reminder_status} t={t} />
          <div className="reminder-count">
            {t("Sent")}: {Number(item.reminder_sent_count || 0)}
          </div>
        </td>

        <td data-label={t("Next Reminder")}>
          {item.next_reminder_at ? (
            new Date(item.next_reminder_at) < new Date() ? (
              <span className="text-danger fw-semibold">
                {formatDateTime(item.next_reminder_at)}
              </span>
            ) : (
              formatDateTime(item.next_reminder_at)
            )
          ) : (
            "-"
          )}
        </td>

        <td data-label={t("Last Reminder")}>
          {formatDateTime(item.last_reminder_at)}
        </td>

        <td data-label={t("Follow-up")}>
          <FollowUpStatusBadge
            state={item.follow_up_state}
            retryCount={item.follow_up_retry_count}
            nextRetryAt={item.follow_up_next_retry_at}
            formatDateTime={formatDateTime}
            t={t}
          />
        </td>

        <td data-label={t("Invoice")}>
          {invoiceId ? (
            <Link
              to={`/admin/erp/invoices/${invoiceId}`}
              className="invoice-link"
            >
              #{invoiceId}
            </Link>
          ) : (
            "-"
          )}
        </td>

        <td data-label={t("Treatment Plan")}>
          {treatmentPlanId ? (
            <Link
              to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
              className="plan-link"
            >
              #{treatmentPlanId}
            </Link>
          ) : (
            "-"
          )}
        </td>

        <td data-label={t("Notes")} className="notes-cell">
          {item.notes || "-"}
        </td>

        <td data-label={t("Actions")}>
          <div className="action-buttons">
            {patientId && (
              <Link
                to={`/admin/erp/patients/${patientId}/profile`}
                className="btn btn-sm btn-outline-primary"
                title={t("View Patient")}
              >
                <i className="fas fa-user"></i>
              </Link>
            )}

            <Link
              to={`/admin/erp/appointments/${item.id}/activity`}
              className="btn btn-sm btn-outline-secondary"
              title={t("View Activity")}
            >
              <i className="fas fa-history"></i>
            </Link>

            {invoiceId && (
              <Link
                to={`/admin/erp/invoices/${invoiceId}`}
                className="btn btn-sm btn-outline-success"
                title={t("View Invoice")}
              >
                <i className="fas fa-file-invoice"></i>
              </Link>
            )}

            {treatmentPlanId && (
              <Link
                to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
                className="btn btn-sm btn-outline-info"
                title={t("View Treatment Plan")}
              >
                <i className="fas fa-notes-medical"></i>
              </Link>
            )}

            {canCancel && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onCancel(item)}
                disabled={actingId === `/erp/appointments/${item.id}/cancel`}
                title={t("Cancel")}
              >
                <i className="fas fa-times"></i>
              </button>
            )}

            {canNoShow && (
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => onNoShow(item)}
                disabled={actingId === `/erp/appointments/${item.id}/no-show`}
                title={t("Mark as No Show")}
              >
                <i className="fas fa-user-slash"></i>
              </button>
            )}

            {canSendReminder && (
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => onSendReminder(item)}
                disabled={actingId === `reminder-${item.id}`}
                title={t("Send Reminder")}
              >
                <i className="fas fa-bell"></i>
              </button>
            )}

            {canComplete && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => onComplete(item)}
                disabled={actingId === `complete-${item.id}`}
                title={t("Complete")}
              >
                <i className="fas fa-check"></i>
              </button>
            )}

            {canReschedule && (
              <button
                className="btn btn-sm btn-outline-info"
                onClick={() => onOpenReschedule(item)}
                title={t("Reschedule")}
              >
                <i className="fas fa-calendar-alt"></i>
              </button>
            )}
          </div>
        </td>
      </tr>

      {isRescheduleOpen && (
        <tr className="reschedule-row">
          <td colSpan="15">
            <div className="reschedule-form">
              <div className="reschedule-header">
                <i className="fas fa-calendar-week me-2"></i>
                <strong>{t("Reschedule Appointment")}</strong>
              </div>

              <div className="reschedule-fields">
                <div className="reschedule-field">
                  <label>{t("Date")}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={rescheduleForm.appointment_date}
                    onChange={(e) =>
                      setRescheduleForm((prev) => ({
                        ...prev,
                        appointment_date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="reschedule-field">
                  <label>{t("Time")}</label>
                  <input
                    type="time"
                    className="form-control"
                    value={rescheduleForm.appointment_time}
                    onChange={(e) =>
                      setRescheduleForm((prev) => ({
                        ...prev,
                        appointment_time: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="reschedule-field">
                  <label>{t("Doctor")}</label>
                  <select
                    className="form-select"
                    value={rescheduleForm.doctor_id}
                    onChange={(e) =>
                      setRescheduleForm((prev) => ({
                        ...prev,
                        doctor_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">{t("Select doctor")}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="reschedule-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => onSubmitReschedule(item.id)}
                    disabled={actingId === `reschedule-${item.id}`}
                  >
                    {actingId === `reschedule-${item.id}` ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t("Saving...")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {t("Confirm")}
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={onCloseInlineForms}
                  >
                    <i className="fas fa-times me-2"></i>
                    {t("Close")}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Badge Components
function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  } else if (value === "no_show") {
    variant = "danger";
    label = t("No Show");
  } else if (value === "scheduled") {
    variant = "warning";
    label = t("Scheduled");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

function AppointmentTypeBadge({ type, t }) {
  const value = String(type || "").toLowerCase();
  let variant = "secondary";
  let label = type || "-";

  if (value === "consultation") {
    variant = "primary";
    label = t("Consultation");
  } else if (value === "treatment") {
    variant = "info";
    label = t("Treatment");
  }

  return <span className={`type-badge type-${variant}`}>{label}</span>;
}

function ReminderStatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "pending") {
    variant = "warning";
    label = t("Pending");
  } else if (value === "sent") {
    variant = "success";
    label = t("Sent");
  } else if (value === "not_needed") {
    variant = "secondary";
    label = t("Not Needed");
  }

  return <span className={`reminder-badge reminder-${variant}`}>{label}</span>;
}

function FollowUpStatusBadge({
  state,
  retryCount,
  nextRetryAt,
  formatDateTime,
  t,
}) {
  const value = String(state || "").toLowerCase();
  let variant = "secondary";
  let label = state || "-";

  if (value === "pending") {
    variant = "warning";
    label = t("Pending");
  } else if (value === "processing") {
    variant = "info";
    label = t("Processing");
  } else if (value === "sent") {
    variant = "success";
    label = t("Sent");
  } else if (value === "retrying") {
    variant = "dark";
    label = t("Retrying");
  } else if (value === "stopped") {
    variant = "danger";
    label = t("Stopped");
  } else if (value === "skipped") {
    variant = "secondary";
    label = t("Skipped");
  }

  return (
    <div className="followup-info">
      <span className={`followup-badge followup-${variant}`}>{label}</span>
      <div className="followup-retries">
        {t("Retries")}: {Number(retryCount || 0)}
      </div>
      {nextRetryAt && (
        <div
          className={`followup-next ${new Date(nextRetryAt) < new Date() ? "overdue" : ""}`}
        >
          {t("Next")}: {formatDateTime(nextRetryAt)}
        </div>
      )}
    </div>
  );
}
