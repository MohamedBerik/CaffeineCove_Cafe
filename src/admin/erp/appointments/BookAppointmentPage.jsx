import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./BookAppointmentPage.css";

export default function BookAppointmentPage() {
  const { t, i18n } = useTranslation();
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
          t("Failed to load booking references."),
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
        setSlotError(t("Please select doctor and date first."));
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
          t("Failed to load available slots."),
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
        setError(t("Please select a patient."));
        return;
      }

      if (!form.doctor_id) {
        setError(t("Please select a doctor."));
        return;
      }

      if (!form.appointment_date) {
        setError(t("Please select appointment date."));
        return;
      }

      if (!form.appointment_time) {
        setError(t("Please select appointment time."));
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
        setError(firstError || t("Failed to book consultation."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to book consultation."),
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
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="book-appointment-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Book Consultation Appointment")}</h1>
          <p className="page-subtitle">
            {t(
              "Create a consultation appointment and continue the patient journey",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/appointments"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Appointments")}
          </Link>
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

      {/* Booking Form Card */}
      <div className="booking-card">
        <div className="booking-card-header">
          <i className="fas fa-calendar-plus me-2"></i>
          <h5 className="mb-0">{t("Appointment Details")}</h5>
        </div>

        <div className="booking-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              {/* Patient Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user me-2"></i>
                  {t("Patient")}
                  <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  name="patient_id"
                  value={form.patient_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t("Select patient")}</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                      {patient.patient_code ? ` (${patient.patient_code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user-md me-2"></i>
                  {t("Doctor")}
                  <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  name="doctor_id"
                  value={form.doctor_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t("Select doctor")}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Type (Read Only) */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag me-2"></i>
                  {t("Appointment Type")}
                </label>
                <div className="type-badge-display">
                  <i className="fas fa-stethoscope me-2"></i>
                  {t("Consultation")}
                </div>
              </div>

              {/* Date Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-calendar-day me-2"></i>
                  {t("Date")}
                  <span className="required-star">*</span>
                </label>
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

              {/* Slots Button */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-clock me-2"></i>
                  {t("Available Slots")}
                </label>
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={loadSlots}
                  disabled={
                    loadingSlots || !form.doctor_id || !form.appointment_date
                  }
                >
                  {loadingSlots ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t("Loading Slots...")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt me-2"></i>
                      {t("Reload Slots")}
                    </>
                  )}
                </button>
              </div>

              {/* Time Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-hourglass-half me-2"></i>
                  {t("Time")}
                  <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  name="appointment_time"
                  value={form.appointment_time}
                  onChange={handleChange}
                  required
                  disabled={!normalizedSlots.length}
                >
                  <option value="">{t("Select slot")}</option>
                  {normalizedSlots.map((slot, index) => (
                    <option
                      key={`${slot.value}-${index}`}
                      value={slot.value}
                      disabled={slot.available === false}
                      className={slot.available === false ? "text-muted" : ""}
                    >
                      {slot.label}
                      {slot.available === false ? ` (${t("Unavailable")})` : ""}
                    </option>
                  ))}
                </select>
                {normalizedSlots.length === 0 &&
                  form.doctor_id &&
                  form.appointment_date &&
                  !loadingSlots && (
                    <div className="form-hint warning">
                      <i className="fas fa-info-circle me-1"></i>
                      {t("No slots available for this date")}
                    </div>
                  )}
              </div>

              {/* Slot Error */}
              {slotError && (
                <div className="form-group full-width">
                  <div className="slot-error">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {slotError}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-pencil-alt me-2"></i>
                  {t("Notes")}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t("Optional notes...")}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {(selectedPatient ||
              selectedDoctor ||
              form.appointment_date ||
              form.appointment_time) && (
              <div className="booking-summary">
                <div className="summary-header">
                  <i className="fas fa-clipboard-list me-2"></i>
                  <span className="fw-semibold">{t("Booking Summary")}</span>
                </div>
                <div className="summary-content">
                  <div className="summary-item">
                    <span className="summary-label">{t("Type")}:</span>
                    <span className="summary-value">
                      <span className="type-consultation">
                        {t("Consultation")}
                      </span>
                    </span>
                  </div>
                  {selectedPatient && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Patient")}:</span>
                      <span className="summary-value">
                        {selectedPatient.name}
                        {selectedPatient.email && (
                          <span className="summary-detail">
                            {" "}
                            — {selectedPatient.email}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {selectedDoctor && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Doctor")}:</span>
                      <span className="summary-value">
                        {selectedDoctor.name}
                      </span>
                    </div>
                  )}
                  {form.appointment_date && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Date")}:</span>
                      <span className="summary-value">
                        {form.appointment_date}
                      </span>
                    </div>
                  )}
                  {form.appointment_time && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Time")}:</span>
                      <span className="summary-value">
                        {form.appointment_time}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t("Booking...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i>
                    {t("Book Consultation")}
                  </>
                )}
              </button>

              <Link
                to="/admin/erp/appointments"
                className="btn btn-outline-secondary btn-lg"
              >
                <i className="fas fa-times me-2"></i>
                {t("Cancel")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
