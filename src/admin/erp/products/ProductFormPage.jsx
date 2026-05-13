import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./ProductFormPage.css";

export default function ProductFormPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title_en: "",
    title_ar: "",
    description_en: "",
    description_ar: "",
    unit_price: "",
    category_id: "",
    quantity: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await axios.get(`/erp/products/${id}`);
      const payload = res.data || {};
      const product = payload.data || payload || {};

      setForm({
        title_en: product.title_en || "",
        title_ar: product.title_ar || "",
        description_en: product.description_en || "",
        description_ar: product.description_ar || "",
        unit_price:
          product.unit_price != null ? String(product.unit_price) : "",
        category_id:
          product.category_id != null ? String(product.category_id) : "",
        quantity: product.quantity != null ? String(product.quantity) : "",
      });

      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load product."),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get("/erp/categories");
      const payload = res.data || {};
      setCategories(
        Array.isArray(payload.data) ? payload.data : payload.data?.data || [],
      );
    } catch {
      // لا شيء
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = new FormData();
      payload.append("title_en", form.title_en.trim());
      payload.append("title_ar", form.title_ar.trim());
      payload.append("description_en", form.description_en || "");
      payload.append("description_ar", form.description_ar || "");
      payload.append("unit_price", form.unit_price);
      payload.append("category_id", form.category_id);
      payload.append("quantity", form.quantity || "0");

      if (imageFile) {
        payload.append("product_image", imageFile);
      }

      // لاحظ أن الـ API للـ update يطلب old_id في البودي (حسب الكنترولر الحالي)
      // قد نعدل الكنترولر ليكون RESTful أكثر لاحقًا
      if (isEdit) {
        payload.append("old_id", id);
        await axios.put(`/erp/products/update`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("/erp/products", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(
        isEdit
          ? t("Product updated successfully.")
          : t("Product created successfully."),
      );

      if (!isEdit) {
        navigate(`/admin/erp/products`);
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to save product."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save product."),
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
    <div className="product-form-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {isEdit ? t("Edit Product") : t("Add Product")}
          </h1>
          <p className="page-subtitle">
            {t("Manage product details, pricing, stock, and image")}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/products" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Products")}
          </Link>

          {isEdit && (
            <button className="btn btn-outline-primary" onClick={loadProduct}>
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
          <i className="fas fa-box me-2"></i>
          <h5 className="mb-0">
            {isEdit ? t("Product Details") : t("New Product")}
          </h5>
        </div>

        <div className="form-card-body">
          <form onSubmit={submit}>
            <div className="form-grid">
              {/* Title EN */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag me-2"></i>
                  {t("Product Name (English)")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title_en"
                  value={form.title_en}
                  onChange={handleChange}
                  placeholder={t("e.g. Composite Filling Kit")}
                  required
                />
              </div>

              {/* Title AR */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag me-2"></i>
                  {t("Product Name (Arabic)")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title_ar"
                  value={form.title_ar}
                  onChange={handleChange}
                  placeholder={t("e.g. عدة حشوة تجميلية")}
                  required
                />
              </div>

              {/* Price */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-dollar-sign me-2"></i>
                  {t("Unit Price")}
                  <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  name="unit_price"
                  value={form.unit_price}
                  onChange={handleChange}
                  placeholder="99.99"
                  required
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-list me-2"></i>
                  {t("Category")}
                  <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t("-- Select Category --")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.title_en || `#${cat.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-cubes me-2"></i>
                  {t("Quantity In Stock")}
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              {/* Image */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-image me-2"></i>
                  {t("Product Image")}
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="image-preview-wrapper">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger image-remove-btn"
                      onClick={clearImage}
                      title={t("Remove Image")}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Descriptions */}
            <div className="form-grid mt-3">
              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-align-left me-2"></i>
                  {t("Description (English)")}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="description_en"
                  value={form.description_en}
                  onChange={handleChange}
                  placeholder={t("Optional English description...")}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">
                  <i className="fas fa-align-right me-2"></i>
                  {t("Description (Arabic)")}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="description_ar"
                  value={form.description_ar}
                  onChange={handleChange}
                  placeholder={t("Optional Arabic description...")}
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
                    {isEdit ? t("Saving...") : t("Creating...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {isEdit ? t("Save Changes") : t("Create Product")}
                  </>
                )}
              </button>

              <Link
                to="/admin/erp/products"
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
