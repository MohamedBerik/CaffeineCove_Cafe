import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetPatientId =
    searchParams.get("customer_id") || searchParams.get("patient_id") || "";
  const presetDoctorId = searchParams.get("doctor_id") || "";

  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = getTodayString();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [slotError, setSlotError] = useState("");

  const [form, setForm] = useState({
    patient_id: presetPatientId,
    doctor_id: presetDoctorId,
    appointment_date: "",
    appointment_time: "",
    notes: "",
  });

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    if (form.doctor_id && form.appointment_date) {
      loadSlots();
    } else {
      setSlots([]);
      setSlotError("");
    }
  }, [form.doctor_id, form.appointment_date]);

  const loadRefs = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const [patientsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/customers"),
        axios.get("/erp/doctors"),
      ]);

      const patientsPayload = patientsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const patientRows = Array.isArray(patientsPayload.data)
        ? patientsPayload.data
        : patientsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      setPatients(patientRows);
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load booking references.",
      );
    } finally {
      setLoadingRefs(false);
    }
  };

  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      setSlotError("");
      setSlots([]);

      if (!form.doctor_id || !form.appointment_date) {
        setSlotError("Please select doctor and date first.");
        return;
      }

      const res = await axios.get("/erp/appointments/available-slots", {
        params: {
          doctor_id: form.doctor_id,
          date: form.appointment_date,
        },
      });

      const payload = res.data || {};
      const slotRows = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.slots || payload.data || [];

      setSlots(Array.isArray(slotRows) ? slotRows : []);
    } catch (err) {
      setSlotError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load available slots.",
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "doctor_id" || name === "appointment_date"
        ? { appointment_time: "" }
        : {}),
    }));

    if (name === "doctor_id" || name === "appointment_date") {
      setSlots([]);
      setSlotError("");
    }
  };

  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(form.patient_id));
  }, [patients, form.patient_id]);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => String(d.id) === String(form.doctor_id));
  }, [doctors, form.doctor_id]);

  const normalizedSlots = useMemo(() => {
    return slots
      .map((slot) => {
        if (typeof slot === "string") {
          return {
            value: slot,
            label: slot,
            available: true,
          };
        }

        return {
          value: slot.time || slot.value || "",
          label: slot.label || slot.time || slot.value || "",
          available: slot.available ?? true,
        };
      })
      .filter((slot) => slot.value);
  }, [slots]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!form.patient_id) {
        setError("Please select a patient.");
        return;
      }

      if (!form.doctor_id) {
        setError("Please select a doctor.");
        return;
      }

      if (!form.appointment_date) {
        setError("Please select appointment date.");
        return;
      }

      if (!form.appointment_time) {
        setError("Please select appointment time.");
        return;
      }

      const payload = {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        appointment_type: "consultation",
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        notes: form.notes || null,
      };

      const res = await axios.post("/erp/appointments/book", payload);

      const createdAppointmentId =
        res?.data?.data?.id ||
        res?.data?.appointment_id ||
        res?.data?.data?.appointment?.id ||
        null;

      if (createdAppointmentId) {
        navigate(
          `/admin/erp/appointments?appointment_id=${createdAppointmentId}`,
        );
        return;
      }

      navigate("/admin/erp/appointments");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to book consultation.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to book consultation.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingRefs) {
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
          <h3 className="fw-bold mb-1">Book Consultation Appointment</h3>
          <p className="text-muted mb-0">
            Create a consultation appointment and continue the patient journey
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/appointments"
            className="btn btn-outline-secondary"
          >
            Back to Appointments
          </Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form className="row g-3" onSubmit={submit}>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Patient</label>
              <select
                className="form-select"
                name="patient_id"
                value={form.patient_id}
                onChange={handleChange}
                required
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                    {patient.patient_code ? ` (${patient.patient_code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Doctor</label>
              <select
                className="form-select"
                name="doctor_id"
                value={form.doctor_id}
                onChange={handleChange}
                required
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Appointment Type</label>
              <input
                type="text"
                className="form-control"
                value="Consultation"
                readOnly
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                name="appointment_date"
                value={form.appointment_date}
                onChange={handleChange}
                min={today}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Available Slots</label>
              <div className="d-grid">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={loadSlots}
                  disabled={
                    loadingSlots || !form.doctor_id || !form.appointment_date
                  }
                >
                  {loadingSlots ? "Loading Slots..." : "Reload Slots"}
                </button>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Time</label>
              <select
                className="form-select"
                name="appointment_time"
                value={form.appointment_time}
                onChange={handleChange}
                required
                disabled={!normalizedSlots.length}
              >
                <option value="">Select slot</option>
                {normalizedSlots.map((slot, index) => (
                  <option
                    key={`${slot.value}-${index}`}
                    value={slot.value}
                    disabled={slot.available === false}
                  >
                    {slot.label}
                    {slot.available === false ? " (Unavailable)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {slotError ? (
              <div className="col-12">
                <div className="alert alert-warning py-2 mb-0">{slotError}</div>
              </div>
            ) : null}

            <div className="col-12">
              <label className="form-label fw-semibold">Notes</label>
              <textarea
                className="form-control"
                rows="3"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes..."
              />
            </div>

            {(selectedPatient || selectedDoctor) && (
              <div className="col-12">
                <div className="alert alert-light border mb-0">
                  <div className="fw-semibold mb-1">Booking Summary</div>

                  <div>Type: Consultation</div>

                  {selectedPatient ? (
                    <div>
                      Patient: {selectedPatient.name}
                      {selectedPatient.email
                        ? ` — ${selectedPatient.email}`
                        : ""}
                    </div>
                  ) : null}

                  {selectedDoctor ? (
                    <div>Doctor: {selectedDoctor.name}</div>
                  ) : null}

                  {form.appointment_date ? (
                    <div>Date: {form.appointment_date}</div>
                  ) : null}

                  {form.appointment_time ? (
                    <div>Time: {form.appointment_time}</div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Booking..." : "Book Consultation"}
              </button>

              <Link
                to="/admin/erp/appointments"
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
