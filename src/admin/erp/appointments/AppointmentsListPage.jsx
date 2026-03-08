import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentsListPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  const [openCompleteId, setOpenCompleteId] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    total: "",
    doctor_name: "",
    notes: "",
    treatment_plan_id: "",
  });

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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const patientName = String(item.patient?.name || "").toLowerCase();
      const patientEmail = String(item.patient?.email || "").toLowerCase();
      const doctorName = String(
        item.doctor?.name || item.doctor_name || "",
      ).toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();
      const date = String(item.appointment_date || "").toLowerCase();

      return (
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        doctorName.includes(q) ||
        status.includes(q) ||
        notes.includes(q) ||
        date.includes(q)
      );
    });
  }, [rows, search]);

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

  const openCompleteFormFor = (item) => {
    clearActionMessages();
    setOpenRescheduleId(null);
    setOpenCompleteId(item.id);
    setCompleteForm({
      total: "",
      doctor_name: item.doctor?.name || item.doctor_name || "",
      notes: item.notes || "",
      treatment_plan_id: "",
    });
  };

  const submitComplete = async (appointmentId) => {
    try {
      clearActionMessages();
      setActingId(`complete-${appointmentId}`);

      const payload = {
        total: Number(completeForm.total),
        doctor_name: completeForm.doctor_name || null,
        notes: completeForm.notes || null,
      };

      if (completeForm.treatment_plan_id) {
        payload.treatment_plan_id = Number(completeForm.treatment_plan_id);
      }

      await axios.post(`/erp/appointments/${appointmentId}/complete`, payload);

      setActionSuccess("Appointment completed successfully.");
      closeInlineForms();
      await loadAll();
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
    setOpenCompleteId(null);
    setOpenRescheduleId(item.id);
    setRescheduleForm({
      appointment_date: item.appointment_date || "",
      appointment_time: String(item.appointment_time || "").slice(0, 5) || "",
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
    setOpenCompleteId(null);
    setOpenRescheduleId(null);
    setCompleteForm({
      total: "",
      doctor_name: "",
      notes: "",
      treatment_plan_id: "",
    });
    setRescheduleForm({
      appointment_date: "",
      appointment_time: "",
      doctor_id: "",
    });
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
            <div className="col-12 col-lg-8">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Patient, doctor, date, status, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-lg-2">
              <label className="form-label fw-semibold">Total Loaded</label>
              <div className="form-control bg-light">
                {meta?.total ?? rows.length}
              </div>
            </div>
            <div className="col-12 col-lg-2">
              <button type="submit" className="btn btn-outline-primary w-100">
                Search
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
                    <th style={{ minWidth: 180 }}>Patient</th>
                    <th style={{ minWidth: 180 }}>Doctor</th>
                    <th style={{ minWidth: 130 }}>Date</th>
                    <th style={{ minWidth: 100 }}>Time</th>
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
                      onOpenComplete={openCompleteFormFor}
                      onOpenReschedule={openRescheduleFormFor}
                      openCompleteId={openCompleteId}
                      openRescheduleId={openRescheduleId}
                      completeForm={completeForm}
                      setCompleteForm={setCompleteForm}
                      rescheduleForm={rescheduleForm}
                      setRescheduleForm={setRescheduleForm}
                      onSubmitComplete={submitComplete}
                      onSubmitReschedule={submitReschedule}
                      onCloseInlineForms={closeInlineForms}
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
  onOpenComplete,
  onOpenReschedule,
  openCompleteId,
  openRescheduleId,
  completeForm,
  setCompleteForm,
  rescheduleForm,
  setRescheduleForm,
  onSubmitComplete,
  onSubmitReschedule,
  onCloseInlineForms,
}) {
  const isCompleteOpen = openCompleteId === item.id;
  const isRescheduleOpen = openRescheduleId === item.id;

  return (
    <>
      <tr>
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
        <td>{item.appointment_date || "-"}</td>
        <td>{String(item.appointment_time || "").slice(0, 5) || "-"}</td>
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

            {item.status !== "completed" ? (
              <>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onCancel(item)}
                  disabled={actingId === `/erp/appointments/${item.id}/cancel`}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-sm btn-outline-warning"
                  onClick={() => onNoShow(item)}
                  disabled={actingId === `/erp/appointments/${item.id}/no-show`}
                >
                  No Show
                </button>

                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => onOpenComplete(item)}
                >
                  Complete
                </button>

                <button
                  className="btn btn-sm btn-outline-info"
                  onClick={() => onOpenReschedule(item)}
                >
                  Reschedule
                </button>
              </>
            ) : null}
          </div>
        </td>
      </tr>

      {isCompleteOpen ? (
        <tr>
          <td colSpan="7" className="bg-light">
            <div className="p-3">
              <div className="fw-semibold mb-3">Complete Appointment</div>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Total</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    value={completeForm.total}
                    onChange={(e) =>
                      setCompleteForm((prev) => ({
                        ...prev,
                        total: e.target.value,
                      }))
                    }
                    placeholder="150"
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">Doctor Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={completeForm.doctor_name}
                    onChange={(e) =>
                      setCompleteForm((prev) => ({
                        ...prev,
                        doctor_name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold">
                    Treatment Plan ID
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={completeForm.treatment_plan_id}
                    onChange={(e) =>
                      setCompleteForm((prev) => ({
                        ...prev,
                        treatment_plan_id: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="col-12 col-md-3 d-flex gap-2">
                  <button
                    className="btn btn-success"
                    onClick={() => onSubmitComplete(item.id)}
                    disabled={actingId === `complete-${item.id}`}
                  >
                    {actingId === `complete-${item.id}`
                      ? "Completing..."
                      : "Confirm Complete"}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={onCloseInlineForms}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={completeForm.notes}
                    onChange={(e) =>
                      setCompleteForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}

      {isRescheduleOpen ? (
        <tr>
          <td colSpan="7" className="bg-light">
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
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}
