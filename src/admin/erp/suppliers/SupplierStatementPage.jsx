import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./SupplierStatementPage.css";

export default function SupplierStatementPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchStatement = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await axios.get(`/erp/suppliers/${id}/statement`, { params });
      setData(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load supplier statement."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id, fromDate, toDate]);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
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

  const supplier = data?.supplier || {};
  const entries = data?.entries || [];
  const openingBalance = data?.opening_balance || 0;
  const closingBalance = data?.closing_balance || 0;

  return (
    <div className="supplier-statement-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">
            {t("Supplier Statement")}: {supplier.name}
          </h1>
          <p className="page-subtitle">{t("Account movements and balance")}</p>
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

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Date Range")}</h5>
        </div>
        <div className="filters-card-body">
          <div className="date-filters">
            <div className="filter-group">
              <label className="filter-label">{t("From")}</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">{t("To")}</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                <i className="fas fa-eraser me-2"></i>
                {t("Clear")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">{t("Opening Balance")}</div>
          <div className="kpi-value">{formatCurrency(openingBalance)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">{t("Closing Balance")}</div>
          <div className="kpi-value">{formatCurrency(closingBalance)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">{t("Supplier")}</div>
          <div className="kpi-value">{supplier.name}</div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="entries-card">
        <div className="entries-card-header">
          <i className="fas fa-list-ul me-2"></i>
          <h5 className="mb-0">{t("Account Movements")}</h5>
          <span className="entry-count">
            {entries.length} {t("entries")}
          </span>
        </div>
        <div className="entries-card-body">
          {entries.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox empty-icon"></i>
              <p className="empty-text">{t("No entries found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="entries-table">
                <thead>
                  <tr>
                    <th>{t("Date")}</th>
                    <th>{t("Description")}</th>
                    <th>{t("Type")}</th>
                    <th>{t("Debit")}</th>
                    <th>{t("Credit")}</th>
                    <th>{t("Balance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td data-label={t("Date")}>
                        {formatDate(entry.entry_date)}
                      </td>
                      <td data-label={t("Description")}>{entry.description}</td>
                      <td data-label={t("Type")}>
                        <span className={`entry-type-badge ${entry.type}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td data-label={t("Debit")} className="text-end">
                        {formatCurrency(entry.debit)}
                      </td>
                      <td data-label={t("Credit")} className="text-end">
                        {formatCurrency(entry.credit)}
                      </td>
                      <td
                        data-label={t("Balance")}
                        className="text-end fw-bold"
                      >
                        {formatCurrency(entry.balance)}
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
