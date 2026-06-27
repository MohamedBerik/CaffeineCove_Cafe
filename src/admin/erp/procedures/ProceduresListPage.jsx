import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import "./ProceduresListPage.css";

export default function ProceduresListPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    loadProcedures();
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

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const loadProcedures = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const res = await axios.get("/erp/procedures");
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
          t("Failed to load procedures."),
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
      const price = String(item.default_price || "").toLowerCase();

      const activeValue =
        Number(item.is_active) === 1 || item.is_active === true
          ? "active"
          : "inactive";

      const matchesSearch =
        !q || id.includes(q) || name.includes(q) || price.includes(q);

      const matchesStatus = !statusFilter || activeValue === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const toggleProcedureStatus = async (item) => {
    const nextStatus =
      Number(item.is_active) === 1 || item.is_active === true ? 0 : 1;

    const confirmText =
      nextStatus === 1
        ? t('Activate procedure "{{name}}"?', { name: item.name })
        : t('Deactivate procedure "{{name}}"?', { name: item.name });

    const ok = window.confirm(confirmText);
    if (!ok) return;

    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);

      await axios.put(`/erp/procedures/${item.id}`, {
        name: item.name,
        default_price: Number(item.default_price || 0),
        is_active: nextStatus,
      });

      setActionSuccess(
        nextStatus === 1
          ? t("Procedure activated successfully.")
          : t("Procedure deactivated successfully."),
      );

      await loadProcedures();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to update procedure."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to update procedure."),
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
    <div className="procedures-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Procedures")}</h1>
          <p className="page-subtitle">
            {t("Manage clinic procedures, default prices, and active status")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/procedures/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Add Procedure")}
          </Link>

          <button className="btn btn-primary" onClick={loadProcedures}>
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
                placeholder={t("ID, procedure name, default price...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-tag me-1"></i>
                {t("Status")}
              </label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t("All Statuses")}</option>
                <option value="active">{t("Active")}</option>
                <option value="inactive">{t("Inactive")}</option>
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

      {/* Procedures Table */}
      <div className="procedures-card">
        <div className="procedures-card-header">
          <i className="fas fa-list me-2"></i>
          <h5 className="mb-0">{t("Procedures List")}</h5>
          <span className="procedure-count">
            {filteredRows.length} {t("procedures")}
          </span>
        </div>

        <div className="procedures-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-stethoscope empty-icon"></i>
              <p className="empty-text">{t("No procedures found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="procedures-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Procedure")}</th>
                    <th>{t("Default Price")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Created")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("ID")}>
                        <span className="procedure-id">#{item.id}</span>
                      </td>
                      <td data-label={t("Procedure")}>
                        <div className="procedure-name">{item.name || "-"}</div>
                      </td>
                      <td
                        data-label={t("Default Price")}
                        className="price-cell"
                      >
                        {formatCurrency(item.default_price)}
                      </td>
                      <td data-label={t("Status")}>
                        <ProcedureActiveBadge isActive={item.is_active} t={t} />
                      </td>
                      <td data-label={t("Created")}>
                        {formatDate(item.created_at)}
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          {/* ✅ إخفاء زر Edit إذا لم يملك الصلاحية */}
                          {(user?.is_super_admin ||
                            user?.role === "admin" ||
                            user?.permissions?.includes(
                              "procedures.manage",
                            )) && (
                            <Link
                              to={`/admin/erp/procedures/${item.id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                              title={t("Edit Procedure")}
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                          )}

                          {/* ✅ إخفاء زر Deactivate/Activate إذا لم يملك الصلاحية */}
                          {(user?.is_super_admin ||
                            user?.role === "admin" ||
                            user?.permissions?.includes(
                              "procedures.manage",
                            )) && (
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                Number(item.is_active) === 1 ||
                                item.is_active === true
                                  ? "btn-outline-warning"
                                  : "btn-outline-success"
                              }`}
                              onClick={() => toggleProcedureStatus(item)}
                              disabled={actingId === item.id}
                              title={
                                Number(item.is_active) === 1 ||
                                item.is_active === true
                                  ? t("Deactivate")
                                  : t("Activate")
                              }
                            >
                              {actingId === item.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1"></span>
                                  {t("Saving...")}
                                </>
                              ) : (
                                <>
                                  <i
                                    className={`fas ${
                                      Number(item.is_active) === 1 ||
                                      item.is_active === true
                                        ? "fa-ban"
                                        : "fa-check-circle"
                                    } me-1`}
                                  ></i>
                                </>
                              )}
                            </button>
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

// ProcedureActiveBadge Component
function ProcedureActiveBadge({ isActive, t }) {
  const active = Number(isActive) === 1 || isActive === true;

  return (
    <span
      className={`status-badge ${active ? "status-active" : "status-inactive"}`}
    >
      <i
        className={`fas fa-${active ? "check-circle" : "times-circle"} me-1`}
      ></i>
      {active ? t("Active") : t("Inactive")}
    </span>
  );
}
