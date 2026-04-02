import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./InvoicesList.css";

export default function InvoicesList() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/erp/invoices");
      const payload = res.data || {};

      const rowsData = extractInvoiceRows(payload);
      const metaData = extractMeta(payload, rowsData);

      setRows(rowsData);
      setMeta(metaData);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load invoices."),
      );
    } finally {
      setLoading(false);
    }
  };

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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const number = String(item.number || item.id || "").toLowerCase();
      const customerName = String(item.customer?.name || "").toLowerCase();
      const customerEmail = String(item.customer?.email || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const issuedAt = String(
        item.issued_at || item.created_at || "",
      ).toLowerCase();

      return (
        number.includes(q) ||
        customerName.includes(q) ||
        customerEmail.includes(q) ||
        status.includes(q) ||
        issuedAt.includes(q)
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
    <div className="invoices-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Invoices")}</h1>
          <p className="page-subtitle">
            {t("Review invoice balances, payment status, and customer billing")}
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={loadInvoices}>
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
          <h5 className="mb-0">{t("Search Invoices")}</h5>
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
                placeholder={t("Invoice number, customer, email, status...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-database me-1"></i>
                {t("Total Invoices")}
              </label>
              <div className="total-badge">{meta?.total ?? rows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="invoices-card">
        <div className="invoices-card-header">
          <i className="fas fa-file-invoice me-2"></i>
          <h5 className="mb-0">{t("Invoices List")}</h5>
          <span className="invoice-count">
            {filteredRows.length} {t("invoices")}
          </span>
        </div>

        <div className="invoices-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-file-invoice empty-icon"></i>
              <p className="empty-text">{t("No invoices found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>{t("Invoice")}</th>
                    <th>{t("Customer")}</th>
                    <th>{t("Total")}</th>
                    <th>{t("Paid")}</th>
                    <th>{t("Remaining")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Issued")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((inv, index) => {
                    const invoiceId =
                      inv.id ?? inv.invoice_id ?? inv.invoice?.id ?? null;
                    const total = Number(inv.total || 0);
                    const totalPaid = Number(
                      inv.net_paid ?? inv.total_paid ?? 0,
                    );
                    const remaining =
                      inv.remaining != null
                        ? Number(inv.remaining)
                        : Math.max(total - totalPaid, 0);
                    const remainingClass = remaining > 0 ? "remaining" : "paid";

                    return (
                      <tr key={invoiceId ?? inv.number ?? index}>
                        <td data-label={t("Invoice")}>
                          <div className="invoice-number">
                            {invoiceId ? (
                              <Link
                                to={`/admin/erp/invoices/${invoiceId}`}
                                className="invoice-link"
                              >
                                {inv.number || `#${invoiceId}`}
                              </Link>
                            ) : (
                              inv.number || "-"
                            )}
                          </div>
                          <div className="invoice-id">
                            {t("ID")}: {invoiceId ?? "-"}
                          </div>
                        </td>

                        <td data-label={t("Customer")}>
                          <div className="customer-name">
                            {inv.customer?.name || "-"}
                          </div>
                          <div className="customer-email">
                            {inv.customer?.email || "-"}
                          </div>
                        </td>

                        <td data-label={t("Total")} className="amount-cell">
                          {formatCurrency(total)}
                        </td>

                        <td data-label={t("Paid")} className="amount-cell paid">
                          {formatCurrency(totalPaid)}
                        </td>

                        <td
                          data-label={t("Remaining")}
                          className={`amount-cell ${remainingClass}`}
                        >
                          {formatCurrency(remaining)}
                        </td>

                        <td data-label={t("Status")}>
                          <StatusBadge status={inv.status} t={t} />
                        </td>

                        <td data-label={t("Issued")}>
                          {formatDate(inv.issued_at || inv.created_at)}
                        </td>

                        <td data-label={t("Actions")}>
                          <div className="action-buttons">
                            {invoiceId && (
                              <Link
                                to={`/admin/erp/invoices/${invoiceId}`}
                                className="btn btn-sm btn-outline-primary"
                                title={t("View Invoice")}
                              >
                                <i className="fas fa-eye"></i>
                                <span>{t("View")}</span>
                              </Link>
                            )}

                            {inv.customer_id && (
                              <Link
                                to={`/admin/erp/patients/${inv.customer_id}/profile`}
                                className="btn btn-sm btn-outline-secondary"
                                title={t("View Patient")}
                              >
                                <i className="fas fa-user"></i>
                                <span>{t("Patient")}</span>
                              </Link>
                            )}

                            {inv.treatment_plan_id && (
                              <Link
                                to={`/admin/erp/treatment-plans/${inv.treatment_plan_id}`}
                                className="btn btn-sm btn-outline-info"
                                title={t("View Treatment Plan")}
                              >
                                <i className="fas fa-notes-medical"></i>
                                <span>{t("Plan")}</span>
                              </Link>
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

// Helper Functions
function extractInvoiceRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  if (Array.isArray(payload.invoices)) return payload.invoices;
  if (Array.isArray(payload.invoices?.data)) return payload.invoices.data;
  return [];
}

function extractMeta(payload, rowsData) {
  return (
    payload.meta ||
    payload.data?.meta ||
    payload.invoices?.meta || {
      total: rowsData.length,
    }
  );
}

// StatusBadge Component
function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "paid") {
    variant = "success";
    label = t("Paid");
  } else if (value === "unpaid" || value === "cancelled") {
    variant = "danger";
    label = t(value === "cancelled" ? "Cancelled" : "Unpaid");
  } else if (value === "partially_paid") {
    variant = "warning";
    label = t("Partially Paid");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}
