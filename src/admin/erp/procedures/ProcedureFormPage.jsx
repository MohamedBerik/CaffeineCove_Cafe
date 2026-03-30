import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./ProcedureFormPage.css";

export default function ProcedureFormPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    default_price: "",
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      loadProcedure();
    }
  }, [id]);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const loadProcedure = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await axios.get(`/erp/procedures/${id}`);
      const payload = res.data || {};
      const procedure = payload.data || payload || {};

      setForm({
        name: procedure.name || "",
        default_price:
          procedure.default_price != null
            ? String(procedure.default_price)
            : "",
        is_active:
          Number(procedure.is_active) === 1 || procedure.is_active === true,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load procedure."),
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
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        default_price: Number(form.default_price || 0),
        is_active: form.is_active ? 1 : 0,
      };

      let res;
      if (isEdit) {
        res = await axios.put(`/erp/procedures/${id}`, payload);
      } else {
        res = await axios.post("/erp/procedures", payload);
      }

      const saved = res?.data?.data || null;

      setSuccess(
        isEdit
          ? t("Procedure updated successfully.")
          : t("Procedure created successfully."),
      );

      if (!isEdit && saved?.id) {
        navigate(`/admin/erp/procedures/${saved.id}/edit`);
        return;
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save procedure."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save procedure."),
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
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="procedure-form-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Procedure") : t("Add Procedure")}
          </h1>
          <p className="page-subtitle">
            {t("Manage procedure name, default price, and active status")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/procedures"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Procedures")}
          </Link>

          {isEdit && (
            <button className="btn btn-outline-primary" onClick={loadProcedure}>
              <i className="fas fa-sync-alt me-2"></i>
              {t("Refresh")}
            </button>
          )}
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
          <i className="fas fa-stethoscope me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Procedure Details") : t("New Procedure")}
          </h5>
        </div>

        <div className="form-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              {/* Procedure Name */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag me-2"></i>
                  {t("Procedure Name")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("e.g. Root Canal")}
                  required
                />
              </div>

              {/* Default Price */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-dollar-sign me-2"></i>
                  {t("Default Price")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  name="default_price"
                  value={form.default_price}
                  onChange={handleChange}
                  placeholder="1200"
                  required
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-toggle-on me-2"></i>
                  {t("Status")}
                </label>
                <div className="status-toggle">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      <span
                        className={`status-text ${form.is_active ? "active" : "inactive"}`}
                      >
                        <i
                          className={`fas fa-${form.is_active ? "check-circle" : "times-circle"} me-1`}
                        ></i>
                        {form.is_active ? t("Active") : t("Inactive")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="info-note">
              <i className="fas fa-info-circle me-2"></i>
              <div>
                <div className="note-title">{t("Notes")}</div>
                <div className="note-text">
                  {t(
                    "Default Price is used when adding this procedure to a treatment plan. Existing treatment plan items keep their saved price and will not be changed automatically.",
                  )}
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
                    {isEdit ? t("Saving...") : t("Creating...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {isEdit ? t("Save Changes") : t("Create Procedure")}
                  </>
                )}
              </button>

              <Link
                to="/admin/erp/procedures"
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
