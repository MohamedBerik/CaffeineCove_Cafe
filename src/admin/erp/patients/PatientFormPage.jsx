import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PatientFormPage.css";

export default function PatientFormPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    date_of_birth: "",
    notes: "",
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadPatient();
    }
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return value.split("T")[0];
    } catch {
      return value;
    }
  };

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/customers/${id}`);
      const data = res.data?.data || res.data || {};

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        address: data.address || "",
        date_of_birth: formatDate(data.date_of_birth),
        notes: data.notes || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load patient."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (isEdit) {
        await axios.put(`/erp/customers/${id}`, form);
        navigate(`/admin/erp/patients/${id}/profile`);
        return;
      }

      const res = await axios.post("/erp/customers", form);
      const saved = res.data?.data || res.data;

      if (saved?.id) {
        navigate(`/admin/erp/patients/${saved.id}/profile`);
      } else {
        navigate("/admin/erp/patients");
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save patient."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save patient."),
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
    <div className="patient-form-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Patient") : t("Create Patient")}
          </h1>
          <p className="page-subtitle">
            {isEdit
              ? t("Update patient basic information")
              : t("Create a new patient profile")}
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/admin/erp/patients")}
          >
            <i className="fas fa-users me-2"></i>
            {t("Patients")}
          </button>

          {isEdit && (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate(`/admin/erp/patients/${id}/profile`)}
            >
              <i className="fas fa-user me-2"></i>
              {t("Profile")}
            </button>
          )}
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
          <i className="fas fa-user-plus me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Edit Patient Information") : t("Patient Information")}
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
                  placeholder={t("Enter patient full name")}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-envelope me-2"></i>
                  {t("Email Address")}
                </label>
                <input
                  className="form-control"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("patient@example.com")}
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

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-venus-mars me-2"></i>
                  {t("Gender")}
                </label>
                <select
                  className="form-select"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">{t("Select gender")}</option>
                  <option value="male">{t("Male")}</option>
                  <option value="female">{t("Female")}</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-birthday-cake me-2"></i>
                  {t("Date of Birth")}
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                />
              </div>

              {/* Address */}
              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {t("Address")}
                </label>
                <input
                  className="form-control"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t("Street, city, postal code")}
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
                  rows="3"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t("Additional notes about the patient...")}
                />
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
                    {isEdit ? t("Update Patient") : t("Create Patient")}
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-lg"
                onClick={() => navigate("/admin/erp/patients")}
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
