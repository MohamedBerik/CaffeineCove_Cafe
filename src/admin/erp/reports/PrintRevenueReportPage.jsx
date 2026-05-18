import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintRevenueReportPage.css";

export default function PrintRevenueReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const queryParams = new URLSearchParams(location.search);
  const [filters] = useState({
    from: queryParams.get("from") || today,
    to: queryParams.get("to") || today,
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

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString(
        i18n.language === "ar" ? "ar-EG" : "en-US",
        { year: "numeric", month: "short", day: "2-digit" },
      );
    } catch {
      return value;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/invoices", { timeout: 30000 });
      const payload = res.data || {};

      let invoiceRows = [];
      if (Array.isArray(payload.data)) invoiceRows = payload.data;
      else if (payload.data?.data && Array.isArray(payload.data.data))
        invoiceRows = payload.data.data;
      else if (Array.isArray(payload.invoices)) invoiceRows = payload.invoices;
      else if (Array.isArray(payload)) invoiceRows = payload;
      else invoiceRows = [];

      // تطبيق الفلاتر حسب التاريخ
      const filtered = invoiceRows.filter((item) => {
        const rawDate = item.issued_at || item.created_at;
        const dateOnly = rawDate ? String(rawDate).slice(0, 10) : "";
        if (filters.from && dateOnly && dateOnly < filters.from) return false;
        if (filters.to && dateOnly && dateOnly > filters.to) return false;
        return true;
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

      const totalInvoiced = normalized.reduce((s, i) => s + i.total, 0);
      const grossPaid = normalized.reduce((s, i) => s + i.gross_paid, 0);
      const refunded = normalized.reduce((s, i) => s + i.refunded, 0);
      const netPaid = normalized.reduce((s, i) => s + i.net_paid, 0);
      const remaining = normalized.reduce((s, i) => s + i.remaining, 0);

      setRows(normalized);
      setSummary({
        total_invoiced: totalInvoiced,
        gross_paid: grossPaid,
        refunded,
        net_paid: netPaid,
        remaining,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message || t("Failed to load revenue report."),
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="print-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="print-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>{t("Go Back")}</button>
      </div>
    );
  }

  return (
    <div className="print-revenue-report-page">
      <div className="no-print print-actions">
        <button className="btn btn-primary me-2" onClick={() => window.print()}>
          <i className="fas fa-print me-2"></i>
          {t("Print")}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left me-2"></i>
          {t("Back")}
        </button>
      </div>

      <div className="print-content">
        <h1 className="print-title">{t("Revenue Report")}</h1>
        <p className="print-period">
          {t("Period")}: {formatDate(filters.from)} – {formatDate(filters.to)}
        </p>

        {/* Summary Cards */}
        <div className="print-summary-grid">
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Invoiced")}</span>
            <span className="summary-value">
              {formatCurrency(summary.total_invoiced)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Gross Paid")}</span>
            <span className="summary-value">
              {formatCurrency(summary.gross_paid)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Refunded")}</span>
            <span className="summary-value">
              {formatCurrency(summary.refunded)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Net Paid")}</span>
            <span className="summary-value">
              {formatCurrency(summary.net_paid)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Remaining")}</span>
            <span className="summary-value">
              {formatCurrency(summary.remaining)}
            </span>
          </div>
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <p className="text-center text-muted">
            {t("No revenue rows found.")}
          </p>
        ) : (
          <table className="print-table">
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
                  <td>{row.number}</td>
                  <td>{row.customer_name}</td>
                  <td>{formatCurrency(row.total)}</td>
                  <td>{formatCurrency(row.gross_paid)}</td>
                  <td>{formatCurrency(row.refunded)}</td>
                  <td>{formatCurrency(row.net_paid)}</td>
                  <td>{formatCurrency(row.remaining)}</td>
                  <td>{row.status}</td>
                  <td>{formatDate(row.issued_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="print-footer">
          {t("Generated on")}: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
