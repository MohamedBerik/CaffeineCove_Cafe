import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";
import { useTranslation } from "react-i18next";
import "./RevenueReportPage.css";

export default function RevenueReportPage() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_invoiced: 0,
    gross_paid: 0,
    refunded: 0,
    net_paid: 0,
    remaining: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCurrency = (value) => {
    const lang = i18n?.language === "ar" ? "ar-EG" : "en-US";
    try {
      return new Intl.NumberFormat(lang, {
        style: "currency",
        currency: "EGP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    } catch (err) {
      console.error("FormatCurrency error:", err);
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
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadRevenueReport = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/invoices", {
        timeout: 30000,
      });

      const payload = res.data || {};

      // استخراج الفواتير من مصادر مختلفة
      let invoiceRows = [];

      if (Array.isArray(payload.data)) {
        invoiceRows = payload.data;
      } else if (payload.data?.data && Array.isArray(payload.data.data)) {
        invoiceRows = payload.data.data;
      } else if (Array.isArray(payload.invoices)) {
        invoiceRows = payload.invoices;
      } else if (Array.isArray(payload)) {
        invoiceRows = payload;
      } else {
        invoiceRows = [];
      }

      // تطبيق الفلاتر حسب التاريخ
      const filtered = invoiceRows.filter((item) => {
        const rawDate = item.issued_at || item.created_at;
        const dateOnly = rawDate ? String(rawDate).slice(0, 10) : "";

        let fromValid = true;
        let toValid = true;

        if (filters.from && dateOnly) {
          fromValid = dateOnly >= filters.from;
        }
        if (filters.to && dateOnly) {
          toValid = dateOnly <= filters.to;
        }

        return fromValid && toValid;
      });

      // تطبيع البيانات
      const normalized = filtered.map((item) => {
        const total = Number(item.total || 0);
        const grossPaid = Number(
          item.total_paid ?? item.gross_paid ?? item.net_paid ?? 0,
        );
        const refunded = Number(item.total_refunded ?? item.refunded ?? 0);
        const netPaid =
          item.net_paid != null
            ? Number(item.net_paid)
            : Math.max(grossPaid - refunded, 0);
        const remaining =
          item.remaining != null
            ? Number(item.remaining)
            : Math.max(total - netPaid, 0);

        return {
          id: item.id,
          number: item.number || `#${item.id}`,
          customer_name: item.customer?.name || "-",
          total,
          gross_paid: grossPaid,
          refunded,
          net_paid: netPaid,
          remaining,
          status: item.status || "-",
          issued_at: item.issued_at || item.created_at || null,
        };
      });

      // حساب الإجماليات
      const totalInvoiced = normalized.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      const grossPaid = normalized.reduce(
        (sum, item) => sum + item.gross_paid,
        0,
      );
      const refunded = normalized.reduce((sum, item) => sum + item.refunded, 0);
      const netPaid = normalized.reduce((sum, item) => sum + item.net_paid, 0);
      const remaining = normalized.reduce(
        (sum, item) => sum + item.remaining,
        0,
      );

      // تحديث الحالة
      setRows(normalized);
      setSummary({
        total_invoiced: totalInvoiced,
        gross_paid: grossPaid,
        refunded: refunded,
        net_paid: netPaid,
        remaining: remaining,
      });
    } catch (err) {
      console.error("Revenue Report Error:", err);

      let errorMessage = t("Failed to load revenue report.");

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message === "Network Error") {
        errorMessage = t("Network error. Please check your connection.");
      } else if (err.code === "ECONNABORTED" || err.name === "AbortError") {
        errorMessage = t("Request timeout. Please try again.");
      }

      setError(errorMessage);

      // تعيين قيم افتراضية في حالة الخطأ
      setRows([]);
      setSummary({
        total_invoiced: 0,
        gross_paid: 0,
        refunded: 0,
        net_paid: 0,
        remaining: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    console.log("Apply filters clicked");
    await loadRevenueReport();
  };

  const exportHint = useMemo(() => {
    return `${t("Range")}: ${filters.from || "-"} → ${filters.to || "-"}`;
  }, [filters, t]);

  const exportRows = () => {
    console.log("Exporting rows:", rows.length);
    const csvRows = rows.map((row) => ({
      invoice_number: row.number,
      customer_name: row.customer_name,
      invoiced: row.total,
      gross_paid: row.gross_paid,
      refunded: row.refunded,
      net_paid: row.net_paid,
      remaining: row.remaining,
      status: row.status,
      issued_at: row.issued_at,
    }));
    exportToCsv("revenue-report.csv", csvRows);
  };

  const printReport = () => {
    window.print();
  };

  // useEffect للتحميل الأولي
  useEffect(() => {
    console.log("useEffect: تحميل التقرير لأول مرة");
    loadRevenueReport();
  }, []);

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
    <div className="revenue-report-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Revenue Report")}</h1>
          <p className="page-subtitle">
            {t(
              "Revenue analysis based on invoices, payments, refunds, and balances",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Reports")}
          </Link>

          <Link
            to={`/admin/erp/reports/revenue/print?from=${filters.from}&to=${filters.to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark"
          >
            <i className="fas fa-print me-2"></i>
            {t("Print")}
          </Link>

          <button className="btn btn-primary" onClick={loadRevenueReport}>
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

      {/* Filters Card */}
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
          title={t("Total Invoiced")}
          value={formatCurrency(summary.total_invoiced)}
          color="primary"
          icon="fas fa-file-invoice"
        />
        <ReportCard
          title={t("Gross Paid")}
          value={formatCurrency(summary.gross_paid)}
          color="success"
          icon="fas fa-money-bill-wave"
        />
        <ReportCard
          title={t("Refunded")}
          value={formatCurrency(summary.refunded)}
          color="danger"
          icon="fas fa-undo-alt"
        />
        <ReportCard
          title={t("Net Paid")}
          value={formatCurrency(summary.net_paid)}
          color="info"
          icon="fas fa-check-circle"
        />
        <ReportCard
          title={t("Remaining")}
          value={formatCurrency(summary.remaining)}
          color="warning"
          icon="fas fa-hourglass-half"
        />
      </div>

      {/* Report Summary Info */}
      <div className="info-card">
        <div className="info-card-header">
          <i className="fas fa-info-circle me-2"></i>
          <h5 className="mb-0">{t("Report Summary")}</h5>
          <span className="report-badge">{exportHint}</span>
        </div>
        <div className="info-card-body">
          <p className="info-text">
            {t(
              "This report is currently derived from the invoices listing response. It is ready to be switched later to a dedicated revenue-report API without changing the UI structure.",
            )}
          </p>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="table-card">
        <div className="table-card-header">
          <i className="fas fa-table me-2"></i>
          <h5 className="mb-0">{t("Revenue Rows")}</h5>
          <span className="row-count">
            {rows.length} {t("invoices")}
          </span>
        </div>

        <div className="table-card-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-chart-line empty-icon"></i>
              <p className="empty-text">{t("No revenue rows found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>{t("Invoice")}</th>
                    <th>{t("Customer")}</th>
                    <th>{t("Invoiced")}</th>
                    <th>{t("Gross Paid")}</th>
                    <th>{t("Refunded")}</th>
                    <th>{t("Net Paid")}</th>
                    <th>{t("Remaining")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Issued")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td data-label={t("Invoice")}>
                        <Link
                          to={`/admin/erp/invoices/${row.id}`}
                          className="invoice-link"
                        >
                          {row.number}
                        </Link>
                      </td>
                      <td data-label={t("Customer")}>{row.customer_name}</td>
                      <td data-label={t("Invoiced")} className="amount-cell">
                        {formatCurrency(row.total)}
                      </td>
                      <td
                        data-label={t("Gross Paid")}
                        className="amount-cell success"
                      >
                        {formatCurrency(row.gross_paid)}
                      </td>
                      <td
                        data-label={t("Refunded")}
                        className="amount-cell danger"
                      >
                        {formatCurrency(row.refunded)}
                      </td>
                      <td
                        data-label={t("Net Paid")}
                        className="amount-cell info"
                      >
                        {formatCurrency(row.net_paid)}
                      </td>
                      <td
                        data-label={t("Remaining")}
                        className={`amount-cell ${row.remaining > 0 ? "warning" : "success"}`}
                      >
                        {formatCurrency(row.remaining)}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge status={row.status} t={t} />
                      </td>
                      <td data-label={t("Issued")}>
                        {formatDate(row.issued_at)}
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

// ReportCard Component
function ReportCard({ title, value, color = "primary", icon }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    secondary: { bg: "rgba(108, 117, 125, 0.1)", text: "#6c757d" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="revenue-report-card">
      <div
        className="report-icon"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <i className={icon}></i>
      </div>
      <div className="revenue-report-content">
        <div className="report-title">{title}</div>
        <div className="revenue-report-value" style={{ color: colors.text }}>
          {value}
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
