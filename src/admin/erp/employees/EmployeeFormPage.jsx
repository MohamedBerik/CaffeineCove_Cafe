import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./EmployeeFormPage.css";

export default function EmployeeFormPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    salary: "",
    branch_id: "",
    is_active: true,
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // جلب قائمة الفروع
    axios
      .get("/branches")
      .then((res) => {
        setBranches(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setBranches([]));

    if (isEdit) {
      loadEmployee();
    }
  }, [id]);

  const normalizeEmployee = (data) => ({
    name: data?.name || "",
    email: data?.email || "",
    phone: data?.phone || "",
    salary: data?.salary != null ? String(data.salary) : "",
    branch_id:
      data?.branch_id !== null && data?.branch_id !== undefined
        ? String(data.branch_id)
        : "",
    is_active:
      data?.is_active === true ||
      data?.is_active === 1 ||
      String(data?.is_active) === "1",
    password: "", // لا نملأ كلمة المرور في التعديل
  });

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/employees/${id}`);
      const payload = res.data || {};
      const data = payload.data || payload;

      setForm(normalizeEmployee(data));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load employee."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
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
        salary: Number(form.salary || 0),
        branch_id: form.branch_id || undefined,
        is_active: form.is_active ? 1 : 0,
        password: form.password || undefined,
      };

      if (isEdit) {
        await axios.put(`/erp/employees/${id}`, payload);
      } else {
        await axios.post("/erp/employees", payload);
      }

      navigate("/admin/erp/employees");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save employee."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save employee."),
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
            {isEdit ? t("Edit Employee") : t("Create Employee")}
          </h1>
          <p className="page-subtitle">
            {t("Manage employee profile and branch assignment")}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/admin/erp/employees")}
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Employees")}
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
          <i className="fas fa-user-tie me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Employee Information") : t("New Employee")}
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
                  placeholder={t("Enter full name")}
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
                  type="email"
                  className="form-control"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("employee@clinic.com")}
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

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock me-2"></i>
                  {t("Password")}
                  {!isEdit && <span className="required-star">*</span>}
                </label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t("Min. 6 characters")}
                  required={!isEdit}
                />
              </div>

              {/* Salary */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-money-bill-wave me-2"></i>
                  {t("Salary")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              {/* Branch */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-building me-2"></i>
                  {t("Branch")}
                </label>
                <select
                  className="form-select"
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                >
                  <option value="">{t("Select branch")}</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status */}
              <div className="form-group full-width">
                <div className="checkbox-group">
                  <input
                    id="employee-active"
                    type="checkbox"
                    className="form-check-input"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  <label htmlFor="employee-active" className="form-check-label">
                    <i className="fas fa-check-circle me-1"></i>
                    {t("Active employee")}
                  </label>
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
                    {isEdit ? t("Update Employee") : t("Create Employee")}
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-lg"
                onClick={() => navigate("/admin/erp/employees")}
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
