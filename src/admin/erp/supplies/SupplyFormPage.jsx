import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./SupplyFormPage.css";

export default function SupplyFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit_cost: "",
    stock_quantity: "0",
    category_id: "",
    supplier_id: "",
  });

  useEffect(() => {
    loadDependencies();
    if (isEdit) loadSupply();
  }, [id]);

  const loadSupply = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const res = await axios.get(`/erp/supplies/${id}`);
      const payload = res.data || {};
      const supply = payload.data || payload || {};
      setForm({
        name: supply.name || "",
        sku: supply.sku || "",
        unit_cost: supply.unit_cost != null ? String(supply.unit_cost) : "",
        stock_quantity:
          supply.stock_quantity != null ? String(supply.stock_quantity) : "0",
        category_id:
          supply.category_id != null ? String(supply.category_id) : "",
        supplier_id:
          supply.supplier_id != null ? String(supply.supplier_id) : "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load supply."),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [supRes, catRes] = await Promise.all([
        axios.get("/erp/suppliers"),
        axios.get("/erp/categories"),
      ]);
      const extractArray = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (payload?.data && Array.isArray(payload.data)) return payload.data;
        if (payload?.data?.data && Array.isArray(payload.data.data))
          return payload.data.data;
        return [];
      };
      setSuppliers(extractArray(supRes.data));
      setCategories(extractArray(catRes.data));
    } catch {
      // silently fail
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
        sku: form.sku.trim() || null,
        unit_cost: Number(form.unit_cost),
        stock_quantity: Number(form.stock_quantity) || 0,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
      };

      if (isEdit) {
        await axios.put(`/erp/supplies/${id}`, payload);
      } else {
        await axios.post("/erp/supplies", payload);
      }

      setSuccess(
        isEdit
          ? t("Supply updated successfully.")
          : t("Supply created successfully."),
      );

      if (!isEdit) {
        navigate("/admin/erp/supplies");
      } else {
        await loadSupply();
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save supply."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save supply."),
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
    <div className="supply-form-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Supply") : t("Add Supply")}
          </h1>
          <p className="page-subtitle">
            {t("Manage supply details, cost, and stock")}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/erp/supplies" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Supplies")}
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
          <i className="fas fa-boxes me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Supply Details") : t("New Supply")}
          </h5>
        </div>
        <div className="form-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag me-2"></i>
                  {t("Name")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("e.g. Dental Composite")}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-barcode me-2"></i>
                  {t("SKU")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder={t("Optional")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-dollar-sign me-2"></i>
                  {t("Unit Cost")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  name="unit_cost"
                  value={form.unit_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-cubes me-2"></i>
                  {t("Stock Quantity")}
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="stock_quantity"
                  value={form.stock_quantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-list me-2"></i>
                  {t("Category")}
                </label>
                <select
                  className="form-select"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">{t("-- Select Category --")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.title_en || `#${cat.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-truck me-2"></i>
                  {t("Supplier")}
                </label>
                <select
                  className="form-select"
                  name="supplier_id"
                  value={form.supplier_id}
                  onChange={handleChange}
                >
                  <option value="">{t("-- Select Supplier --")}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
                    {isEdit ? t("Save Changes") : t("Create Supply")}
                  </>
                )}
              </button>
              <Link
                to="/admin/erp/supplies"
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
