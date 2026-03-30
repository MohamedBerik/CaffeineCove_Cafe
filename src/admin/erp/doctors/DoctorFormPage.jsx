import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./DoctorFormPage.css";

export default function DoctorFormPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    work_start: "",
    work_end: "",
    slot_minutes: "30",
    is_active: true,
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadDoctor();
    }
  }, [id]);

  const normalizeDoctor = (data) => {
    return {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      specialty: data?.specialty || "",
      work_start: data?.work_start || "",
      work_end: data?.work_end || "",
      slot_minutes:
        data?.slot_minutes != null ? String(data.slot_minutes) : "30",
      is_active:
        data?.is_active === true ||
        data?.is_active === 1 ||
        String(data?.is_active) === "1",
    };
  };

  const loadDoctor = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/doctors/${id}`);
      const payload = res.data || {};
      const data = payload.data || payload;

      setForm(normalizeDoctor(data));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load doctor."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        specialty: form.specialty || null,
        work_start: form.work_start || null,
        work_end: form.work_end || null,
        slot_minutes: Number(form.slot_minutes || 30),
        is_active: form.is_active ? 1 : 0,
      };

      if (isEdit) {
        await axios.put(`/erp/doctors/${id}`, payload);
      } else {
        await axios.post("/erp/doctors", payload);
      }

      navigate("/admin/erp/doctors");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save doctor."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save doctor."),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: 320 }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-form-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Doctor") : t("Create Doctor")}
          </h1>
          <p className="page-subtitle">
            {t("Manage doctor profile, hours, and booking slot settings")}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/admin/erp/doctors")}
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Doctors")}
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

      {/* Form Card */}
      <div className="form-card">
        <div className="form-card-header">
          <i className="fas fa-user-md me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Doctor Information") : t("New Doctor")}
          </h5>
        </div>

        <div className="form-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user me-2"></i>
                  {t("Full Name")}
                  <span className="required-star">*</span>
                </label>
                <input
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("Dr. John Doe")}
                  required
                />
              </div>

              {/* Specialty */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-stethoscope me-2"></i>
                  {t("Specialty")}
                </label>
                <input
                  className="form-control"
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder={t("Dentist / Orthodontist / Surgeon...")}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-envelope me-2"></i>
                  {t("Email Address")}
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("doctor@clinic.com")}
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-phone me-2"></i>
                  {t("Phone Number")}
                </label>
                <input
                  className="form-control"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("+1234567890")}
                />
              </div>

              {/* Work Start */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-clock me-2"></i>
                  {t("Work Start")}
                </label>
                <input
                  type="time"
                  className="form-control"
                  name="work_start"
                  value={form.work_start}
                  onChange={handleChange}
                />
              </div>

              {/* Work End */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-clock me-2"></i>
                  {t("Work End")}
                </label>
                <input
                  type="time"
                  className="form-control"
                  name="work_end"
                  value={form.work_end}
                  onChange={handleChange}
                />
              </div>

              {/* Slot Minutes */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-hourglass-half me-2"></i>
                  {t("Slot Duration")}
                  <span className="helper-text">({t("minutes")})</span>
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  className="form-control"
                  name="slot_minutes"
                  value={form.slot_minutes}
                  onChange={handleChange}
                />
              </div>

              {/* Active Status */}
              <div className="form-group full-width">
                <div className="checkbox-group">
                  <input
                    id="doctor-active"
                    type="checkbox"
                    className="form-check-input"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  <label htmlFor="doctor-active" className="form-check-label">
                    <i className="fas fa-check-circle me-1"></i>
                    {t("Active doctor")}
                  </label>
                  <div className="helper-text">
                    {t("Active doctors can be booked for appointments")}
                  </div>
                </div>
              </div>
            </div>

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
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {isEdit ? t("Update Doctor") : t("Create Doctor")}
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-lg"
                onClick={() => navigate("/admin/erp/doctors")}
                disabled={saving}
              >
                <i className="fas fa-times me-2"></i>
                {t("Cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
