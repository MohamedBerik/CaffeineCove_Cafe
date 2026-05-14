import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import "./SuppliersListPage.css";

export default function SuppliersListPage() {
  const { t } = useTranslation();
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
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const res = await api.get("/erp/suppliers");
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
          t("Failed to load suppliers."),
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
      const email = String(item.email || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      return (
        !q ||
        id.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });
  }, [rows, search]);

  const clearFilters = () => {
    setSearch("");
  };

  const deleteSupplier = async (item) => {
    const ok = window.confirm(
      t('Are you sure you want to delete supplier "{{name}}"?', {
        name: item.name,
      }),
    );
    if (!ok) return;

    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);

      await api.delete(`/erp/suppliers/${item.id}`);
      setActionSuccess(t("Supplier deleted successfully."));
      await loadSuppliers();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to delete supplier."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to delete supplier."),
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
    <div className="suppliers-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Suppliers")}</h1>
          <p className="page-subtitle">
            {t("Manage suppliers, contact information, and notes")}
          </p>
        </div>
        <div className="header-actions">
          <Link
            to="/admin/erp/suppliers/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Add Supplier")}
          </Link>
          <button className="btn btn-primary" onClick={loadSuppliers}>
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
                placeholder={t("ID, name, email, phone...")}
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

      {/* Suppliers Table */}
      <div className="suppliers-card">
        <div className="suppliers-card-header">
          <i className="fas fa-truck me-2"></i>
          <h5 className="mb-0">{t("Suppliers List")}</h5>
          <span className="supplier-count">
            {filteredRows.length} {t("suppliers")}
          </span>
        </div>

        <div className="suppliers-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-truck-loading empty-icon"></i>
              <p className="empty-text">{t("No suppliers found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="suppliers-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("Email")}</th>
                    <th>{t("Phone")}</th>
                    <th>{t("Contact Person")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("ID")}>
                        <span className="supplier-id">#{item.id}</span>
                      </td>
                      <td data-label={t("Name")}>
                        <div className="supplier-name">{item.name || "-"}</div>
                      </td>
                      <td data-label={t("Email")}>
                        {item.email ? (
                          <a
                            href={`mailto:${item.email}`}
                            className="supplier-email"
                          >
                            {item.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Phone")}>
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone}`}
                            className="supplier-phone"
                          >
                            {item.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Contact Person")}>
                        {item.contact_person || "-"}
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
                                to={`/admin/erp/suppliers/${item.id}/edit`}
                                className="btn btn-sm btn-outline-primary"
                                title={t("Edit Supplier")}
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteSupplier(item)}
                                disabled={actingId === item.id}
                                title={t("Delete Supplier")}
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
