import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./SupplierFormPage.css";

export default function SupplierFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contact_person: "",
    notes: "",
  });

  useEffect(() => {
    if (isEdit) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.get(`/erp/suppliers/${id}`);
      const payload = res.data || {};
      const supplier = payload.data || payload || {};

      setForm({
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        contact_person: supplier.contact_person || "",
        notes: supplier.notes || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load supplier."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || null,
        contact_person: form.contact_person.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        await api.put(`/erp/suppliers/${id}`, payload);
      } else {
        await api.post("/erp/suppliers", payload);
      }

      setSuccess(
        isEdit
          ? t("Supplier updated successfully.")
          : t("Supplier created successfully."),
      );

      if (!isEdit) {
        navigate("/admin/erp/suppliers");
      } else {
        await loadSupplier(); // إعادة تحميل البيانات بعد التعديل
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save supplier."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save supplier."),
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
    <div className="supplier-form-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Supplier") : t("Add Supplier")}
          </h1>
          <p className="page-subtitle">
            {t("Manage supplier details and contact information")}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/erp/suppliers" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Suppliers")}
          </Link>
        </div>
      </div>

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

      <div className="form-card">
        <div className="form-card-header">
          <i className="fas fa-truck me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Supplier Details") : t("New Supplier")}
          </h5>
        </div>
        <div className="form-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-building me-2"></i>
                  {t("Supplier Name")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("e.g. Medical Supplies Co.")}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-envelope me-2"></i>
                  {t("Email")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supplier@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-phone me-2"></i>
                  {t("Phone")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user-tie me-2"></i>
                  {t("Contact Person")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="contact_person"
                  value={form.contact_person}
                  onChange={handleChange}
                  placeholder={t("Optional")}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {t("Address")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t("Optional")}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-sticky-note me-2"></i>
                  {t("Notes")}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t("Optional internal notes...")}
                />
              </div>
            </div>

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
                    {isEdit ? t("Save Changes") : t("Create Supplier")}
                  </>
                )}
              </button>
              <Link
                to="/admin/erp/suppliers"
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
