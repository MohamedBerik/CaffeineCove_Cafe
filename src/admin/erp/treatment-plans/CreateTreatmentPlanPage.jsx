import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./CreateTreatmentPlanPage";

export default function CreateTreatmentPlanPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetCustomerId = searchParams.get("customer_id") || "";

  const [patients, setPatients] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    customer_id: presetCustomerId,
    title: "",
    notes: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const res = await axios.get("/erp/customers");
      const payload = res.data || {};

      const patientRows = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.data || [];

      setPatients(patientRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load patients."),
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

  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(form.customer_id));
  }, [patients, form.customer_id]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        customer_id: Number(form.customer_id),
        title: form.title,
        notes: form.notes || null,
      };

      const res = await axios.post("/erp/treatment-plans", payload);
      const created = res.data?.data;

      setSuccess(t("Treatment plan created successfully."));

      if (created?.id) {
        navigate(`/admin/erp/treatment-plans/${created.id}`);
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to create treatment plan."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to create treatment plan."),
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
    <div className="create-treatment-plan-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Create Treatment Plan")}</h1>
          <p className="page-subtitle">
            {t("Create a new treatment plan for a patient")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/treatment-plans"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Plans")}
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

      {/* Form Card */}
      <div className="form-card">
        <div className="form-card-header">
          <i className="fas fa-notes-medical me-2"></i>
          <h5 className="mb-0">{t("Treatment Plan Details")}</h5>
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

              {/* Title */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-heading me-2"></i>
                  {t("Title")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={t("e.g. Ahmed Dental Plan")}
                  required
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
                  placeholder={t("Optional notes...")}
                />
              </div>
            </div>

            {/* Info Alert */}
            <div className="info-alert">
              <i className="fas fa-info-circle me-2"></i>
              <div>
                <div className="info-title">{t("Plan Cost")}</div>
                <div className="info-text">
                  {t(
                    "Total cost will be calculated automatically after adding plan items.",
                  )}
                </div>
              </div>
            </div>

            {/* Selected Patient Summary */}
            {selectedPatient && (
              <div className="patient-summary">
                <div className="summary-header">
                  <i className="fas fa-user-circle me-2"></i>
                  <span className="fw-semibold">{t("Selected Patient")}</span>
                </div>
                <div className="summary-content">
                  <div className="patient-name">{selectedPatient.name}</div>
                  <div className="patient-contact">
                    {selectedPatient.email || "-"} |{" "}
                    {selectedPatient.phone || "-"}
                  </div>
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
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {t("Create Treatment Plan")}
                  </>
                )}
              </button>

              <Link
                to="/admin/erp/treatment-plans"
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
