import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./TreatmentPlansListPage.css";

export default function TreatmentPlansListPage() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/treatment-plans");
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
          t("Failed to load treatment plans."),
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const patientName = String(item.customer?.name || "").toLowerCase();
      const patientEmail = String(item.customer?.email || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();

      return (
        title.includes(q) ||
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        status.includes(q) ||
        notes.includes(q)
      );
    });
  }, [rows, search]);

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
    <div className="treatment-plans-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Treatment Plans")}</h1>
          <p className="page-subtitle">
            {t(
              "View treatment plans, balances, progress, and linked patient data",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/treatment-plans/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Create Treatment Plan")}
          </Link>

          <button className="btn btn-primary" onClick={loadPlans}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
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

      {/* Search Card */}
      <div className="search-card">
        <div className="search-card-header">
          <i className="fas fa-search me-2"></i>
          <h5 className="mb-0">{t("Search Plans")}</h5>
        </div>
        <div className="search-card-body">
          <div className="search-grid">
            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-filter me-1"></i>
                {t("Search")}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={t(
                  "Search by title, patient, email, status, or notes...",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-database me-1"></i>
                {t("Total Plans")}
              </label>
              <div className="total-badge">{meta?.total ?? rows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Table Card */}
      <div className="plans-card">
        <div className="plans-card-header">
          <i className="fas fa-notes-medical me-2"></i>
          <h5 className="mb-0">{t("Treatment Plans List")}</h5>
          <span className="plan-count">
            {filteredRows.length} {t("plans")}
          </span>
        </div>

        <div className="plans-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-folder-open empty-icon"></i>
              <p className="empty-text">{t("No treatment plans found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>{t("Title")}</th>
                    <th>{t("Patient")}</th>
                    <th>{t("Total Cost")}</th>
                    <th>{t("Total Paid")}</th>
                    <th>{t("Net Paid")}</th>
                    <th>{t("Remaining")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((plan) => (
                    <tr key={plan.id}>
                      <td data-label={t("Title")}>
                        <div className="plan-title">{plan.title || "-"}</div>
                        {plan.notes && (
                          <div className="plan-notes">{plan.notes}</div>
                        )}
                      </td>

                      <td data-label={t("Patient")}>
                        <div className="patient-info">
                          <div className="patient-name">
                            {plan.customer?.name || "-"}
                          </div>
                          {plan.customer?.email && (
                            <div className="patient-email">
                              {plan.customer?.email}
                            </div>
                          )}
                        </div>
                      </td>

                      <td data-label={t("Total Cost")} className="amount-cell">
                        <span className="amount-value">
                          {formatCurrency(plan.total_cost)}
                        </span>
                      </td>

                      <td data-label={t("Total Paid")} className="amount-cell">
                        <span className="amount-value">
                          {formatCurrency(plan.total_paid)}
                        </span>
                      </td>

                      <td data-label={t("Net Paid")} className="amount-cell">
                        <span className="amount-value net-paid">
                          {formatCurrency(plan.net_paid)}
                        </span>
                      </td>

                      <td data-label={t("Remaining")} className="amount-cell">
                        <span
                          className={`amount-value ${Number(plan.remaining) > 0 ? "remaining" : "paid"}`}
                        >
                          {formatCurrency(plan.remaining)}
                        </span>
                      </td>

                      <td data-label={t("Status")}>
                        <StatusBadge status={plan.status} t={t} />
                      </td>

                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          <Link
                            to={`/admin/erp/treatment-plans/${plan.id}`}
                            className="btn btn-sm btn-outline-primary"
                            title={t("View Plan")}
                          >
                            <i className="fas fa-eye"></i>
                            <span>{t("View")}</span>
                          </Link>

                          {plan.customer?.id && (
                            <Link
                              to={`/admin/erp/patients/${plan.customer.id}/profile`}
                              className="btn btn-sm btn-outline-secondary"
                              title={t("View Patient")}
                            >
                              <i className="fas fa-user"></i>
                              <span>{t("Patient")}</span>
                            </Link>
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

// StatusBadge Component
function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  } else if (value === "active") {
    variant = "warning";
    label = t("Active");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}
