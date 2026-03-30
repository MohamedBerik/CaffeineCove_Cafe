import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./SupplierStatement.css";

const SupplierStatement = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [entries, setEntries] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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

  const fetchStatement = async () => {
    try {
      setLoading(true);

      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get(`/erp/suppliers/${id}/statement`, { params });

      setSupplier(res.data.supplier);
      setEntries(res.data.entries);
      setOpeningBalance(res.data.opening_balance);
      setClosingBalance(res.data.closing_balance);
    } catch (e) {
      console.error(e);
      notifyError(t("Failed to load supplier statement"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id]);

  const handleFilter = () => {
    fetchStatement();
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    fetchStatement();
  };

  if (loading) {
    return (
      <div className="supplier-statement-page">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t("Loading...")}</span>
          </div>
          <p className="loading-text">{t("Loading statement...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-statement-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Supplier Statement")}</h1>
          <div className="supplier-info">
            <strong>{supplier?.name}</strong>
            {supplier?.phone && <span> | {supplier.phone}</span>}
            {supplier?.email && <span> | {supplier.email}</span>}
          </div>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/suppliers" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Suppliers")}
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Date Range Filter")}</h5>
        </div>
        <div className="filters-card-body">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-calendar-alt me-1"></i>
                {t("From Date")}
              </label>
              <input
                type="date"
                className="form-control"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-calendar-alt me-1"></i>
                {t("To Date")}
              </label>
              <input
                type="date"
                className="form-control"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button className="btn btn-primary" onClick={handleFilter}>
                <i className="fas fa-search me-2"></i>
                {t("Apply Filters")}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleReset}
              >
                <i className="fas fa-undo me-2"></i>
                {t("Reset")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div
            className="summary-icon"
            style={{
              backgroundColor: "rgba(26, 35, 126, 0.1)",
              color: "#1a237e",
            }}
          >
            <i className="fas fa-wallet"></i>
          </div>
          <div className="summary-content">
            <div className="summary-title">{t("Opening Balance")}</div>
            <div className="summary-value">
              {formatCurrency(openingBalance)}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div
            className="summary-icon"
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              color: "#4caf50",
            }}
          >
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="summary-content">
            <div className="summary-title">{t("Closing Balance")}</div>
            <div className="summary-value">
              {formatCurrency(closingBalance)}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div
            className="summary-icon"
            style={{
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              color: "#2196f3",
            }}
          >
            <i className="fas fa-list"></i>
          </div>
          <div className="summary-content">
            <div className="summary-title">{t("Total Entries")}</div>
            <div className="summary-value">{entries.length}</div>
          </div>
        </div>
      </div>

      {/* Period Info */}
      {(from || to) && (
        <div className="period-info">
          <i className="fas fa-calendar-alt me-2"></i>
          <span>
            {t("Period")}: {from ? formatDate(from) : t("All")} →{" "}
            {to ? formatDate(to) : t("Today")}
          </span>
        </div>
      )}

      {/* Statement Entries */}
      <div className="entries-card">
        <div className="entries-card-header">
          <i className="fas fa-list-ul me-2"></i>
          <h5 className="mb-0">{t("Statement Entries")}</h5>
          <span className="entry-count">
            {entries.length} {t("entries")}
          </span>
        </div>

        <div className="entries-card-body">
          {/* Opening Balance */}
          <div className="entry-section opening">
            <div className="entry-header">
              <div className="entry-type-badge opening-badge">
                <i className="fas fa-sign-in-alt me-1"></i>
                {t("Opening Balance")}
              </div>
              <div className="entry-amount opening-amount">
                {formatCurrency(openingBalance)}
              </div>
            </div>
          </div>

          {/* Entries List */}
          {entries.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox empty-icon"></i>
              <p className="empty-text">{t("No entries in this period")}</p>
            </div>
          ) : (
            <div className="entries-list">
              {entries.map((row, index) => (
                <div key={row.id || index} className="entry-item">
                  <div className="entry-date-section">
                    <span className="entry-date">
                      {formatDate(row.entry_date)}
                    </span>
                    <span className={`entry-type-badge ${row.type}`}>
                      {t(
                        row.type === "purchase_order"
                          ? "Purchase Order"
                          : row.type === "payment"
                            ? "Payment"
                            : row.type === "refund"
                              ? "Refund"
                              : row.type,
                      )}
                    </span>
                  </div>

                  <div className="entry-description-section">
                    <div className="entry-description">
                      {row.description || "-"}
                    </div>
                    <div className="entry-meta">
                      {row.purchase_order_id && (
                        <span className="meta-link">
                          <i className="fas fa-truck"></i>
                          {t("PO")} #{row.purchase_order_id}
                        </span>
                      )}
                      {row.supplier_payment_id && (
                        <span className="meta-link">
                          <i className="fas fa-credit-card"></i>
                          {t("Payment")} #{row.supplier_payment_id}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="entry-amounts-section">
                    {Number(row.debit) > 0 && (
                      <div className="amount-item debit">
                        <span className="amount-label">{t("Debit")}</span>
                        <span className="amount-value">
                          {formatCurrency(row.debit)}
                        </span>
                      </div>
                    )}

                    {Number(row.credit) > 0 && (
                      <div className="amount-item credit">
                        <span className="amount-label">{t("Credit")}</span>
                        <span className="amount-value">
                          {formatCurrency(row.credit)}
                        </span>
                      </div>
                    )}

                    <div className="amount-item balance">
                      <span className="amount-label">{t("Balance")}</span>
                      <span className="amount-value">
                        {formatCurrency(row.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Closing Balance */}
          <div className="entry-section closing">
            <div className="entry-header">
              <div className="entry-type-badge closing-badge">
                <i className="fas fa-sign-out-alt me-1"></i>
                {t("Closing Balance")}
              </div>
              <div className="entry-amount closing-amount">
                {formatCurrency(closingBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatement;
