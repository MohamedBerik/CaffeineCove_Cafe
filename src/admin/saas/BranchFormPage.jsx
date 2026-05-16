import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./BranchFormPage.css";

export default function BranchFormPage() {
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
    slug: "",
    address: "",
    phone: "",
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      loadBranch();
    }
  }, [id]);

  const loadBranch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/erp/branches/${id}`);
      const branch = res.data.data || res.data || {};
      setForm({
        name: branch.name || "",
        slug: branch.slug || "",
        address: branch.address || "",
        phone: branch.phone || "",
        is_active: branch.is_active !== false,
      });
    } catch (err) {
      setError(t("Failed to load branch."));
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
        slug: form.slug.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        is_active: form.is_active ? 1 : 0,
      };

      if (isEdit) {
        await api.put(`/erp/branches/${id}`, payload);
      } else {
        await api.post("/erp/branches", payload);
      }

      setSuccess(
        isEdit
          ? t("Branch updated successfully.")
          : t("Branch created successfully."),
      );
      if (!isEdit) {
        navigate("/admin/erp/branches");
      }
    } catch (err) {
      const msg = err?.response?.data?.msg || t("Failed to save branch.");
      setError(msg);
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
    <div className="branch-form-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Branch") : t("Add Branch")}
          </h1>
          <p className="page-subtitle">{t("Manage branch details")}</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/erp/branches" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Branches")}
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-card">
        <div className="form-card-header">
          <i className="fas fa-building me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Branch Details") : t("New Branch")}
          </h5>
        </div>
        <div className="form-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t("Name")} <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("e.g. Main Branch")}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Slug")}</label>
                <input
                  type="text"
                  className="form-control"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder={t("Optional")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Address")}</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t("Optional")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Phone")}</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("Optional")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Status")}</label>
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
                      {form.is_active ? t("Active") : t("Inactive")}
                    </label>
                  </div>
                </div>
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
                    {isEdit ? t("Save Changes") : t("Create Branch")}
                  </>
                )}
              </button>
              <Link
                to="/admin/erp/branches"
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
