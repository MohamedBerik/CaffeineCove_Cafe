import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentsListPage() {
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
          "Failed to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("en-US", {
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

  const formatAppointmentType = (value) => {
    const type = String(value || "").toLowerCase();
    if (type === "consultation") return "Consultation";
    if (type === "treatment") return "Treatment";
    return "-";
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
        appointmentType.includes(q);

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
        setActionError(firstError || "Action failed.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Action failed.",
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (item) => {
    const ok = window.confirm("Cancel this appointment?");
    if (!ok) return;

    await postAction(
      `/erp/appointments/${item.id}/cancel`,
      "Appointment cancelled successfully.",
    );
  };

  const handleNoShow = async (item) => {
    const ok = window.confirm("Mark this appointment as no-show?");
    if (!ok) return;

    await postAction(
      `/erp/appointments/${item.id}/no-show`,
      "Appointment marked as no-show.",
    );
  };

  const handleComplete = async (item) => {
    const typeLabel = formatAppointmentType(item.appointment_type);
    const ok = window.confirm(
      `Complete this ${typeLabel.toLowerCase()} appointment?`,
    );
    if (!ok) return;

    try {
      clearActionMessages();
      setActingId(`complete-${item.id}`);

      const res = await axios.post(`/erp/appointments/${item.id}/complete`, {});

      const invoiceId = res?.data?.invoice_id || null;

      setActionSuccess(res?.data?.msg || "Appointment completed successfully.");

      await loadAll();

      if (invoiceId) {
        navigate(`/admin/erp/invoices/${invoiceId}`);
        return;
      }

      setActionError(
        "Appointment was completed, but no invoice was returned from the server.",
      );
    } catch (err) {
      const errors = err?.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || "Failed to complete appointment.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to complete appointment.",
        );
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

      setActionSuccess("Appointment rescheduled successfully.");
      closeInlineForms();
      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || "Failed to reschedule appointment.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to reschedule appointment.",
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDateFilter("");
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Appointments</h3>
          <p className="text-muted mb-0">
            Daily schedule, doctor bookings, and patient appointments
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/appointments/calendar"
            className="btn btn-outline-secondary"
          >
            Calendar
          </Link>
          <Link
            to="/admin/erp/appointments/create"
            className="btn btn-outline-primary"
          >
            Book Appointment
          </Link>

          <button className="btn btn-primary" onClick={loadAll}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={loadAll}>
            Retry
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="alert alert-danger">{actionError}</div>
      ) : null}
      {actionSuccess ? (
        <div className="alert alert-success">{actionSuccess}</div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={applySearch}>
            <div className="col-12 col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="ID, patient, doctor, date, time, status, type, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div className="col-12 col-lg-1">
              <label className="form-label fw-semibold">Loaded</label>
              <div className="form-control bg-light">
                {meta?.total ?? rows.length}
              </div>
            </div>

            <div className="col-12 col-lg-1">
              <label className="form-label fw-semibold">Shown</label>
              <div className="form-control bg-light">{filteredRows.length}</div>
            </div>

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-outline-primary">
                Search
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Appointments List</h5>
        </div>
        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No appointments found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 110 }}>ID</th>
                    <th style={{ minWidth: 180 }}>Patient</th>
                    <th style={{ minWidth: 180 }}>Doctor</th>
                    <th style={{ minWidth: 130 }}>Date</th>
                    <th style={{ minWidth: 100 }}>Time</th>
                    <th style={{ minWidth: 140 }}>Type</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 220 }}>Notes</th>
                    <th style={{ minWidth: 360 }}>Actions</th>
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
                      onComplete={handleComplete}
                      onOpenReschedule={openRescheduleFormFor}
                      openRescheduleId={openRescheduleId}
                      rescheduleForm={rescheduleForm}
                      setRescheduleForm={setRescheduleForm}
                      onSubmitReschedule={submitReschedule}
                      onCloseInlineForms={closeInlineForms}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      formatAppointmentType={formatAppointmentType}
                      highlightAppointmentId={highlightAppointmentId}
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

function AppointmentRow({
  item,
  doctors,
  actingId,
  onCancel,
  onNoShow,
  onComplete,
  onOpenReschedule,
  openRescheduleId,
  rescheduleForm,
  setRescheduleForm,
  onSubmitReschedule,
  onCloseInlineForms,
  formatDate,
  formatTime,
  formatAppointmentType,
  highlightAppointmentId,
}) {
  const isRescheduleOpen = openRescheduleId === item.id;
  const isHighlighted =
    String(item.id) === String(highlightAppointmentId || "");

  const status = String(item.status || "").toLowerCase();
  const canComplete = status === "scheduled";
  const canCancel = status === "scheduled";
  const canNoShow = status === "scheduled";
  const canReschedule = ["scheduled", "cancelled", "no_show"].includes(status);

  return (
    <>
      <tr
        className={isHighlighted ? "table-warning" : ""}
        style={isHighlighted ? { boxShadow: "inset 4px 0 0 #ffc107" } : {}}
      >
        <td>
          <span className="fw-semibold">APT-{item.id}</span>
        </td>

        <td>
          <div className="fw-semibold">
            {item.patient?.id ? (
              <Link
                to={`/admin/erp/patients/${item.patient.id}/profile`}
                className="text-decoration-none"
              >
                {item.patient?.name || "-"}
              </Link>
            ) : (
              item.patient?.name || "-"
            )}
          </div>
          <div className="small text-muted">{item.patient?.email || "-"}</div>
        </td>

        <td>{item.doctor?.name || item.doctor_name || "-"}</td>
        <td>{formatDate(item.appointment_date)}</td>
        <td>{formatTime(item.appointment_time)}</td>
        <td>{formatAppointmentType(item.appointment_type)}</td>
        <td>
          <StatusBadge status={item.status} />
        </td>
        <td>{item.notes || "-"}</td>

        <td>
          <div className="d-flex flex-wrap gap-2">
            {item.patient?.id ? (
              <Link
                to={`/admin/erp/patients/${item.patient.id}/profile`}
                className="btn btn-sm btn-outline-primary"
              >
                Patient
              </Link>
            ) : null}

            <Link
              to={`/admin/erp/appointments/${item.id}/activity`}
              className="btn btn-sm btn-outline-secondary"
            >
              Activity
            </Link>

            {canCancel ? (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onCancel(item)}
                disabled={actingId === `/erp/appointments/${item.id}/cancel`}
              >
                Cancel
              </button>
            ) : null}

            {canNoShow ? (
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => onNoShow(item)}
                disabled={actingId === `/erp/appointments/${item.id}/no-show`}
              >
                No Show
              </button>
            ) : null}

            {canComplete ? (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => onComplete(item)}
                disabled={actingId === `complete-${item.id}`}
              >
                {actingId === `complete-${item.id}`
                  ? "Completing..."
                  : "Complete"}
              </button>
            ) : null}

            {canReschedule ? (
              <button
                className="btn btn-sm btn-outline-info"
                onClick={() => onOpenReschedule(item)}
              >
                Reschedule
              </button>
            ) : null}
          </div>
        </td>
      </tr>

      {isRescheduleOpen ? (
        <tr>
          <td colSpan="9" className="bg-light">
            <div className="p-3">
              <div className="fw-semibold mb-3">Reschedule Appointment</div>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Date</label>
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

                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Time</label>
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

                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Doctor</label>
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
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3 d-flex gap-2">
                  <button
                    className="btn btn-info text-white"
                    onClick={() => onSubmitReschedule(item.id)}
                    disabled={actingId === `reschedule-${item.id}`}
                    type="button"
                  >
                    {actingId === `reschedule-${item.id}`
                      ? "Saving..."
                      : "Confirm"}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={onCloseInlineForms}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["completed"].includes(value)) cls = "success";
  else if (["cancelled", "no_show"].includes(value)) cls = "danger";
  else if (["scheduled"].includes(value)) cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}
