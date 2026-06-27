import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import "./SuppliesListPage.css";

export default function SuppliesListPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    loadSupplies();
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const loadSupplies = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");
      const res = await axios.get("/erp/supplies");
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
          t("Failed to load supplies."),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) => {
      const id = String(item.id || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const sku = String(item.sku || "").toLowerCase();
      const cost = String(item.unit_cost || "").toLowerCase();
      return (
        !q ||
        id.includes(q) ||
        name.includes(q) ||
        sku.includes(q) ||
        cost.includes(q)
      );
    });
  }, [rows, search]);

  const clearFilters = () => setSearch("");

  const deleteSupply = async (item) => {
    const ok = window.confirm(
      t('Are you sure you want to delete "{{name}}"?', { name: item.name }),
    );
    if (!ok) return;
    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);
      await axios.delete(`/erp/supplies/${item.id}`);
      setActionSuccess(t("Supply deleted successfully."));
      await loadSupplies();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to delete supply."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to delete supply."),
        );
      }
    } finally {
      setActingId(null);
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
    <div className="supplies-list-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Supplies")}</h1>
          <p className="page-subtitle">
            {t("Manage clinic supplies and stock")}
          </p>
        </div>
        <div className="header-actions">
          <Link
            to="/admin/erp/supplies/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Add Supply")}
          </Link>
          <button className="btn btn-primary" onClick={loadSupplies}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
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
                placeholder={t("ID, name, SKU, unit cost...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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

      <div className="supplies-card">
        <div className="supplies-card-header">
          <i className="fas fa-boxes me-2"></i>
          <h5 className="mb-0">{t("Supplies List")}</h5>
          <span className="supply-count">
            {filteredRows.length} {t("supplies")}
          </span>
        </div>
        <div className="supplies-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open empty-icon"></i>
              <p className="empty-text">{t("No supplies found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="supplies-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("SKU")}</th>
                    <th>{t("Unit Cost")}</th>
                    <th>{t("In Stock")}</th>
                    <th>{t("Supplier")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("ID")}>
                        <span className="supply-id">#{item.id}</span>
                      </td>
                      <td data-label={t("Name")}>
                        <div className="supply-name">{item.name || "-"}</div>
                      </td>
                      <td data-label={t("SKU")}>
                        <code>{item.sku || "-"}</code>
                      </td>
                      <td data-label={t("Unit Cost")} className="price-cell">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td data-label={t("In Stock")}>
                        {item.stock_quantity ?? 0}
                      </td>
                      <td data-label={t("Supplier")}>
                        {item.supplier?.name || "-"}
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          {(user?.is_super_admin ||
                            user?.role === "admin" ||
                            user?.permissions?.includes(
                              "inventory.manage",
                            )) && (
                            <>
                              <Link
                                to={`/admin/erp/supplies/${item.id}/edit`}
                                className="btn btn-sm btn-outline-primary"
                                title={t("Edit Supply")}
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteSupply(item)}
                                disabled={actingId === item.id}
                                title={t("Delete Supply")}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
