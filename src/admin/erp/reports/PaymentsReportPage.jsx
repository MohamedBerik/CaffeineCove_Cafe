import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";
import { useTranslation } from "react-i18next";
import "./PaymentsReportPage.css";

export default function PaymentsReportPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_payments: 0,
    count: 0,
    average: 0,
    total_refunded: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n?.language === "ar" ? "ar-EG" : "en-US";
    try {
      return new Intl.NumberFormat(lang, {
        style: "currency",
        currency: "EGP",
        minimumFractionDigits: 2,
      }).format(Number(value || 0));
    } catch {
      return `$${Number(value || 0).toFixed(2)}`;
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n?.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/payments", { timeout: 30000 });
      const payload = res.data || {};

      let paymentRows = [];
      if (Array.isArray(payload.data)) {
        paymentRows = payload.data;
      } else if (payload.data?.data && Array.isArray(payload.data.data)) {
        paymentRows = payload.data.data;
      } else if (Array.isArray(payload)) {
        paymentRows = payload;
      }

      // فلترة حسب paid_at
      const filtered = paymentRows.filter((p) => {
        const date = p.paid_at ? String(p.paid_at).slice(0, 10) : "";
        if (filters.from && date < filters.from) return false;
        if (filters.to && date > filters.to) return false;
        return true;
      });

      const normalized = filtered.map((p) => ({
        id: p.id,
        invoice_id: p.invoice_id,
        invoice_number: p.invoice?.number || `#${p.invoice_id}`,
        customer_name: p.invoice?.customer?.name || p.customer?.name || "-",
        amount: Number(p.amount || 0),
        applied_amount: Number(p.applied_amount || 0),
        method: p.method || "-",
        paid_at: p.paid_at || p.created_at,
      }));

      const totalPayments = normalized.reduce((s, r) => s + r.amount, 0);
      const count = normalized.length;
      const average = count ? totalPayments / count : 0;
      // يمكننا أيضاً جلب إجمالي المسترجع من API المدفوعات إذا وجد، هنا سنتركه 0 كمثال
      const totalRefunded = 0; // يمكن استبداله لاحقاً

      setRows(normalized);
      setSummary({
        total_payments: totalPayments,
        count,
        average,
        total_refunded: totalRefunded,
      });
    } catch (err) {
      let message = t("Failed to load payments report.");
      if (err.response?.data?.message) message = err.response.data.message;
      else if (err.response?.data?.msg) message = err.response.data.msg;
      setError(message);
      setRows([]);
      setSummary({
        total_payments: 0,
        count: 0,
        average: 0,
        total_refunded: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    await loadReport();
  };

  const exportRows = () => {
    const csvRows = rows.map((r) => ({
      payment_id: r.id,
      invoice: r.invoice_number,
      customer: r.customer_name,
      amount: r.amount,
      applied: r.applied_amount,
      method: r.method,
      date: r.paid_at,
    }));
    exportToCsv("payments-report.csv", csvRows);
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
    <div className="payments-report-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Payments Report")}</h1>
          <p className="page-subtitle">
            {t("Overview of all received payments")}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Reports")}
          </Link>

          <Link
            to={`/admin/erp/reports/payments/print?from=${filters.from}&to=${filters.to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark"
          >
            <i className="fas fa-print me-2"></i>
            {t("Print")}
          </Link>

          <button className="btn btn-outline-success" onClick={exportRows}>
            <i className="fas fa-file-csv me-2"></i>
            {t("Export CSV")}
          </button>

          <button className="btn btn-primary" onClick={loadReport}>
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

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Filters")}</h5>
        </div>
        <div className="filters-card-body">
          <form onSubmit={applyFilters}>
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">
                  <i className="fas fa-calendar-alt me-1"></i>
                  {t("From Date")}
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="from"
                  value={filters.from}
                  onChange={handleChange}
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
                  name="to"
                  value={filters.to}
                  onChange={handleChange}
                />
              </div>
              <div className="filter-actions">
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-search me-2"></i>
                  {t("Apply Filters")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <ReportCard
          title={t("Total Payments")}
          value={formatCurrency(summary.total_payments)}
          color="primary"
          icon="fas fa-money-bill-wave"
        />
        <ReportCard
          title={t("Number of Payments")}
          value={summary.count}
          color="info"
          icon="fas fa-receipt"
        />
        <ReportCard
          title={t("Average Payment")}
          value={formatCurrency(summary.average)}
          color="success"
          icon="fas fa-calculator"
        />
        <ReportCard
          title={t("Total Refunded")}
          value={formatCurrency(summary.total_refunded)}
          color="danger"
          icon="fas fa-undo-alt"
        />
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-card-header">
          <i className="fas fa-table me-2"></i>
          <h5 className="mb-0">{t("Payment Rows")}</h5>
          <span className="row-count">
            {rows.length} {t("payments")}
          </span>
        </div>
        <div className="table-card-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-credit-card empty-icon"></i>
              <p className="empty-text">{t("No payments found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>{t("Payment ID")}</th>
                    <th>{t("Invoice")}</th>
                    <th>{t("Customer")}</th>
                    <th>{t("Amount")}</th>
                    <th>{t("Applied")}</th>
                    <th>{t("Method")}</th>
                    <th>{t("Date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t("Payment ID")}>#{row.id}</td>
                      <td data-label={t("Invoice")}>
                        <Link
                          to={`/admin/erp/invoices/${row.invoice_id}`}
                          className="invoice-link"
                        >
                          {row.invoice_number}
                        </Link>
                      </td>
                      <td data-label={t("Customer")}>{row.customer_name}</td>
                      <td data-label={t("Amount")} className="amount-cell">
                        {formatCurrency(row.amount)}
                      </td>
                      <td
                        data-label={t("Applied")}
                        className="amount-cell success"
                      >
                        {formatCurrency(row.applied_amount)}
                      </td>
                      <td data-label={t("Method")} className="text-capitalize">
                        {t(row.method)}
                      </td>
                      <td data-label={t("Date")}>{formatDate(row.paid_at)}</td>
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

function ReportCard({ title, value, color = "primary", icon }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="report-card">
      <div
        className="report-icon"
        style={{ backgroundColor: c.bg, color: c.text }}
      >
        <i className={icon}></i>
      </div>
      <div className="report-content">
        <div className="report-title">{title}</div>
        <div className="report-value" style={{ color: c.text }}>
          {value}
        </div>
      </div>
    </div>
  );
}
