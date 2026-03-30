import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./CreateDentalRecordPage";

export default function CreateDentalRecordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetCustomerId = searchParams.get("customer_id") || "";
  const presetAppointmentId = searchParams.get("appointment_id") || "";
  const presetDoctorId = searchParams.get("doctor_id") || "";

  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdRecord, setCreatedRecord] = useState(null);

  const [form, setForm] = useState({
    customer_id: presetCustomerId,
    appointment_id: presetAppointmentId,
    doctor_id: presetDoctorId,
    procedure_id: "",
    tooth_number: "",
    surface: "",
    notes: "",
  });

  useEffect(() => {
    loadRefs();
  }, []);

  const loadRefs = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const [patientsRes, proceduresRes, doctorsRes] = await Promise.all([
        axios.get("/erp/customers"),
        axios.get("/erp/procedures", {
          params: { is_active: true },
        }),
        axios.get("/erp/doctors"),
      ]);

      const patientsPayload = patientsRes.data || {};
      const proceduresPayload = proceduresRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const patientRows = Array.isArray(patientsPayload.data)
        ? patientsPayload.data
        : patientsPayload.data?.data || [];

      const procedureRowsRaw = Array.isArray(proceduresPayload.data)
        ? proceduresPayload.data
        : proceduresPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      const activeProcedureRows = procedureRowsRaw.filter(
        (p) => Number(p.is_active) === 1 || p.is_active === true,
      );

      setPatients(patientRows);
      setProcedures(activeProcedureRows);
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load reference data."),
      );
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(form.customer_id));
  }, [patients, form.customer_id]);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => String(d.id) === String(form.doctor_id));
  }, [doctors, form.doctor_id]);

  const selectedProcedure = useMemo(() => {
    return procedures.find((p) => String(p.id) === String(form.procedure_id));
  }, [procedures, form.procedure_id]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setCreatedRecord(null);

      const payload = {
        customer_id: Number(form.customer_id),
        tooth_number: form.tooth_number,
        status: "planned",
        surface: form.surface || null,
        notes: form.notes || null,
      };

      if (form.appointment_id) {
        payload.appointment_id = Number(form.appointment_id);
      }

      if (form.procedure_id) {
        payload.procedure_id = Number(form.procedure_id);
      }

      if (form.doctor_id) {
        payload.doctor_id = Number(form.doctor_id);
      }

      const res = await axios.post("/erp/dental-records", payload);
      const created = res.data?.data || null;

      if (created?.id) {
        navigate(`/admin/erp/dental-records?record_id=${created.id}`);
        return;
      }

      navigate("/admin/erp/dental-records");
      return;
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to create dental record."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to create dental record."),
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
    <div className="create-dental-record-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Create Dental Record")}</h1>
          <p className="page-subtitle">
            {t(
              "Add a clinical dental record for a patient before treatment planning",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/dental-records"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Dental Records")}
          </Link>
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

      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* Appointment Link Info */}
      {presetAppointmentId && (
        <div className="info-banner">
          <i className="fas fa-link me-2"></i>
          {t("This record is linked to appointment")} #{presetAppointmentId}
        </div>
      )}

      {/* Success Next Step Banner */}
      {createdRecord && (
        <div className="success-banner">
          <div className="banner-content">
            <div>
              <div className="banner-title">
                <i className="fas fa-check-circle me-2"></i>
                {t("Next Step")}
              </div>
              <div className="banner-text">
                {t(
                  "You can now create a treatment plan directly for this patient.",
                )}
              </div>
            </div>

            <div className="banner-actions">
              <Link
                to={`/admin/erp/treatment-plans/create?customer_id=${form.customer_id}`}
                className="btn btn-primary"
              >
                <i className="fas fa-notes-medical me-2"></i>
                {t("Create Treatment Plan")}
              </Link>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/admin/erp/dental-records")}
              >
                <i className="fas fa-list me-2"></i>
                {t("Go to Dental Records")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="form-card">
        <div className="form-card-header">
          <i className="fas fa-tooth me-2"></i>
          <h5 className="mb-0">{t("Dental Record Details")}</h5>
        </div>

        <div className="form-card-body">
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
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  required
                  disabled={Boolean(createdRecord)}
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
                </label>
                <select
                  className="form-select"
                  name="doctor_id"
                  value={form.doctor_id}
                  onChange={handleChange}
                  disabled={Boolean(createdRecord)}
                >
                  <option value="">{t("Select doctor")}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Procedure Selection */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-stethoscope me-2"></i>
                  {t("Procedure")}
                </label>
                <select
                  className="form-select"
                  name="procedure_id"
                  value={form.procedure_id}
                  onChange={handleChange}
                  disabled={Boolean(createdRecord)}
                >
                  <option value="">{t("Select procedure")}</option>
                  {procedures.map((procedure) => (
                    <option key={procedure.id} value={procedure.id}>
                      {procedure.name}
                      {procedure.default_price != null
                        ? ` (${formatCurrency(procedure.default_price)})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tooth Number */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tooth me-2"></i>
                  {t("Tooth Number")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="tooth_number"
                  value={form.tooth_number}
                  onChange={handleChange}
                  placeholder={t("e.g., 16, 24, 36")}
                  required
                  disabled={Boolean(createdRecord)}
                />
              </div>

              {/* Surface */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-layer-group me-2"></i>
                  {t("Surface")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="surface"
                  value={form.surface}
                  onChange={handleChange}
                  placeholder={t("occlusal, mesial, distal, buccal, lingual")}
                  disabled={Boolean(createdRecord)}
                />
              </div>

              {/* Notes */}
              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-pencil-alt me-2"></i>
                  {t("Notes")}
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t(
                    "Clinical findings, diagnosis, and observations...",
                  )}
                  disabled={Boolean(createdRecord)}
                />
              </div>
            </div>

            {/* Record Summary */}
            {(selectedPatient ||
              selectedDoctor ||
              selectedProcedure ||
              form.tooth_number ||
              form.surface) && (
              <div className="record-summary">
                <div className="summary-header">
                  <i className="fas fa-clipboard-list me-2"></i>
                  <span className="fw-semibold">{t("Record Summary")}</span>
                </div>
                <div className="summary-content">
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
                  {selectedProcedure && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Procedure")}:</span>
                      <span className="summary-value">
                        {selectedProcedure.name}
                        {selectedProcedure.default_price != null && (
                          <span className="summary-detail">
                            {" "}
                            — {formatCurrency(selectedProcedure.default_price)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {form.tooth_number && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Tooth")}:</span>
                      <span className="summary-value">{form.tooth_number}</span>
                    </div>
                  )}
                  {form.surface && (
                    <div className="summary-item">
                      <span className="summary-label">{t("Surface")}:</span>
                      <span className="summary-value">{form.surface}</span>
                    </div>
                  )}
                  {form.appointment_id && (
                    <div className="summary-item">
                      <span className="summary-label">
                        {t("Linked Appointment")}:
                      </span>
                      <span className="summary-value">
                        #{form.appointment_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              {!createdRecord && (
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t("Saving...")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      {t("Create Dental Record")}
                    </>
                  )}
                </button>
              )}

              <Link
                to="/admin/erp/dental-records"
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
