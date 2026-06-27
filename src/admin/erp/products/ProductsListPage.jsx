import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import "./ProductsListPage.css";

export default function ProductsListPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  // تستخدم للفلترة الإضافية
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatNumber = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang).format(Number(value || 0));
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const res = await axios.get("/erp/products");
      const payload = res.data || {};

      const rowsData = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.data || [];

      setRows(rowsData);
      setMeta(payload.meta || payload.data?.meta || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load products."),
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
      // فشل تحميل الفئات ليس خطأً حرجًا
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // البحث التفاعلي يعمل تلقائياً، لكن يمكن إضافة Submit حقيقي هنا
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((item) => {
      const id = String(item.id || "").toLowerCase();
      const titleEn = String(item.title_en || "").toLowerCase();
      const titleAr = String(item.title_ar || "").toLowerCase();
      const price = String(item.unit_price || "").toLowerCase();

      // حالة المخزون
      const stockQty = Number(item.stock_quantity || 0);
      let stockStatus = "in_stock";
      if (stockQty <= 0) stockStatus = "out_of_stock";
      else if (stockQty <= 10) stockStatus = "low_stock";

      const matchesSearch =
        !q ||
        id.includes(q) ||
        titleEn.includes(q) ||
        titleAr.includes(q) ||
        price.includes(q);

      const matchesStock = !stockFilter || stockStatus === stockFilter;
      const matchesCategory =
        !categoryFilter || String(item.category_id) === categoryFilter;

      return matchesSearch && matchesStock && matchesCategory;
    });
  }, [rows, search, stockFilter, categoryFilter]);

  const clearFilters = () => {
    setSearch("");
    setStockFilter("");
    setCategoryFilter("");
  };

  const deleteProduct = async (item) => {
    const ok = window.confirm(
      t('Are you sure you want to delete "{{title}}"?', {
        title: item.title || item.title_en || item.id,
      }),
    );
    if (!ok) return;

    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);

      await axios.delete(`/erp/products/${item.id}`);

      setActionSuccess(t("Product deleted successfully."));
      await loadProducts();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to delete product."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to delete product."),
        );
      }
    } finally {
      setActingId(null);
    }
  };

  const getTitle = (item) => {
    return item.title || item.title_en || `#${item.id}`;
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
    <div className="products-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Products")}</h1>
          <p className="page-subtitle">
            {t("Manage products, prices, stock levels, and categories")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/products/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Add Product")}
          </Link>

          <button className="btn btn-primary" onClick={loadProducts}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
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

      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {actionError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError("")}
          ></button>
        </div>
      )}

      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {actionSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionSuccess("")}
          ></button>
        </div>
      )}

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Filters")}</h5>
        </div>
        <div className="filters-card-body">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-search me-1"></i>
                {t("Search")}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={t("ID, product name, price...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-boxes me-1"></i>
                {t("Stock Status")}
              </label>
              <select
                className="form-select"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="">{t("All")}</option>
                <option value="in_stock">{t("In Stock")}</option>
                <option value="low_stock">{t("Low Stock (<=10)")}</option>
                <option value="out_of_stock">{t("Out of Stock")}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-tag me-1"></i>
                {t("Category")}
              </label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">{t("All Categories")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || cat.title || `#${cat.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-database me-1"></i>
                {t("Total Loaded")}
              </label>
              <div className="filter-badge">{meta?.total ?? rows.length}</div>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-eye me-1"></i>
                {t("Filtered")}
              </label>
              <div className="filter-badge">{filteredRows.length}</div>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                <i className="fas fa-eraser me-2"></i>
                {t("Clear Filters")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-card">
        <div className="products-card-header">
          <i className="fas fa-box me-2"></i>
          <h5 className="mb-0">{t("Products List")}</h5>
          <span className="product-count">
            {filteredRows.length} {t("products")}
          </span>
        </div>

        <div className="products-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open empty-icon"></i>
              <p className="empty-text">{t("No products found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Product")}</th>
                    <th>{t("Price")}</th>
                    <th>{t("In Stock")}</th>
                    <th>{t("Total Value")}</th>
                    <th>{t("Category")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => {
                    const totalValue =
                      Number(item.unit_price || 0) *
                      Number(item.stock_quantity || 0);
                    const categoryName =
                      item.category?.name ||
                      item.category?.title ||
                      `#${item.category_id || "-"}`;

                    return (
                      <tr key={item.id}>
                        <td data-label={t("ID")}>
                          <span className="product-id">#{item.id}</span>
                        </td>
                        <td data-label={t("Product")}>
                          <div className="product-name-cell">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={getTitle(item)}
                                className="product-thumb"
                              />
                            )}
                            <div>
                              <div className="product-name">
                                {getTitle(item)}
                              </div>
                              {item.title_ar && (
                                <div className="product-name-ar">
                                  {item.title_ar}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td data-label={t("Price")} className="price-cell">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td data-label={t("In Stock")}>
                          <StockBadge
                            quantity={Number(item.stock_quantity || 0)}
                            value={formatNumber(item.stock_quantity)}
                            t={t}
                          />
                        </td>
                        <td
                          data-label={t("Total Value")}
                          className="price-cell"
                        >
                          {formatCurrency(totalValue)}
                        </td>
                        <td data-label={t("Category")}>{categoryName}</td>
                        <td data-label={t("Actions")}>
                          <div className="action-buttons">
                            {(user?.is_super_admin ||
                              user?.role === "admin" ||
                              user?.permissions?.includes(
                                "products.manage",
                              )) && (
                              <>
                                <Link
                                  to={`/admin/erp/products/${item.id}/edit`}
                                  className="btn btn-sm btn-outline-primary"
                                  title={t("Edit Product")}
                                >
                                  <i className="fas fa-edit"></i>
                                </Link>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteProduct(item)}
                                  disabled={actingId === item.id}
                                  title={t("Delete Product")}
                                >
                                  {actingId === item.id ? (
                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                  ) : (
                                    <i className="fas fa-trash-alt"></i>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// StockBadge Component
function StockBadge({ quantity, value, t }) {
  let cls = "stock-in-stock";
  let label = t("In Stock");
  if (quantity <= 0) {
    cls = "stock-out";
    label = t("Out of Stock");
  } else if (quantity <= 10) {
    cls = "stock-low";
    label = t("Low Stock");
  }

  return (
    <span className={`stock-badge ${cls}`}>
      {value} ({label})
    </span>
  );
}
