import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentCalendarPage() {
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
          "Failed to load appointment calendar.",
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

    if (type === "consultation") return "Consultation";
    if (type === "treatment") return "Treatment";

    return "-";
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

  const formatDateLabel = (value) => {
    if (!value) return "-";

    try {
      return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
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
          <h3 className="fw-bold mb-1">Appointment Calendar</h3>
          <p className="text-muted mb-0">
            Daily clinic schedule by date and doctor
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/appointments/create"
            className="btn btn-outline-success"
          >
            Book Appointment
          </Link>

          <button className="btn btn-primary" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Doctor</label>
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-5">
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => changeDay(-1)}
                >
                  Previous Day
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedDate(todayStr)}
                >
                  Today
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => changeDay(1)}
                >
                  Next Day
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="small text-muted">Selected Day</div>
            <div className="fw-semibold">{formatDateLabel(selectedDate)}</div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Daily Schedule</h5>
          <span className="badge bg-light text-dark">
            {visibleAppointments.length} appointments
          </span>
        </div>

        <div className="card-body">
          {visibleAppointments.length === 0 ? (
            <div className="text-muted">
              No appointments scheduled for this selection.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {hours.map((hour) => {
                const items = groupedByHour[hour] || [];

                return (
                  <div key={hour} className="row g-3 align-items-start">
                    <div className="col-12 col-md-2">
                      <div className="fw-bold text-muted">{hour}</div>
                    </div>

                    <div className="col-12 col-md-10">
                      {items.length === 0 ? (
                        <div className="text-muted small border rounded p-3 bg-light">
                          No appointments
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="border rounded p-3 bg-light"
                            >
                              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                                <div>
                                  <div className="fw-bold">
                                    {item.patient?.name || "Unknown Patient"}
                                  </div>

                                  <div className="small text-muted">
                                    {normalizeTime(item.appointment_time)} |{" "}
                                    {item.doctor?.name ||
                                      item.doctor_name ||
                                      "-"}
                                  </div>
                                </div>

                                <div className="d-flex flex-column gap-2 align-items-end">
                                  <StatusBadge status={item.status} />
                                  <AppointmentTypeBadge
                                    type={item.appointment_type}
                                  />
                                </div>
                              </div>

                              <div className="mt-2 small">
                                <div>
                                  <strong>Email:</strong>{" "}
                                  {item.patient?.email || "-"}
                                </div>

                                <div>
                                  <strong>Type:</strong>{" "}
                                  {formatAppointmentType(item.appointment_type)}
                                </div>

                                <div>
                                  <strong>Notes:</strong> {item.notes || "-"}
                                </div>

                                {item.clinical_notes ? (
                                  <div>
                                    <strong>Clinical Notes:</strong>{" "}
                                    {item.clinical_notes}
                                  </div>
                                ) : null}

                                {item.diagnosis ? (
                                  <div>
                                    <strong>Diagnosis:</strong> {item.diagnosis}
                                  </div>
                                ) : null}

                                {item.next_step ? (
                                  <div>
                                    <strong>Next Step:</strong> {item.next_step}
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-3 d-flex flex-wrap gap-2">
                                {item.patient?.id ? (
                                  <Link
                                    to={`/admin/erp/patients/${item.patient.id}/profile`}
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    Patient
                                  </Link>
                                ) : null}

                                {item.treatment_plan_id ? (
                                  <Link
                                    to={`/admin/erp/treatment-plans/${item.treatment_plan_id}`}
                                    className="btn btn-sm btn-outline-info"
                                  >
                                    Treatment Plan
                                  </Link>
                                ) : null}

                                {item.invoice_id ? (
                                  <Link
                                    to={`/admin/erp/invoices/${item.invoice_id}`}
                                    className="btn btn-sm btn-outline-success"
                                  >
                                    Invoice
                                  </Link>
                                ) : null}

                                <Link
                                  to={`/admin/erp/appointments/${item.id}/activity`}
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  Activity
                                </Link>
                              </div>
                            </div>
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

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["completed"].includes(value)) cls = "success";
  else if (["cancelled", "no_show"].includes(value)) cls = "danger";
  else if (["scheduled"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status || "-"}</span>;
}

function AppointmentTypeBadge({ type }) {
  const value = String(type || "").toLowerCase();

  let cls = "secondary";
  let label = type || "-";

  if (value === "consultation") {
    cls = "primary";
    label = "Consultation";
  } else if (value === "treatment") {
    cls = "info text-dark";
    label = "Treatment";
  }

  return <span className={`badge bg-${cls}`}>{label}</span>;
}
