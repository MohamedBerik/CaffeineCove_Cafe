import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintPaymentsReportPage.css";

export default function PrintPaymentsReportPage() {
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
    total_payments: 0,
    count: 0,
    average: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

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
      const res = await axios.get("/erp/payments", { timeout: 30000 });
      const payload = res.data || {};

      let paymentRows = [];
      if (Array.isArray(payload.data)) paymentRows = payload.data;
      else if (payload.data?.data && Array.isArray(payload.data.data))
        paymentRows = payload.data.data;
      else if (Array.isArray(payload)) paymentRows = payload;

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

      const total = normalized.reduce((s, r) => s + r.amount, 0);
      const count = normalized.length;
      const avg = count ? total / count : 0;

      setRows(normalized);
      setSummary({ total_payments: total, count, average: avg });
    } catch (err) {
      setError(t("Failed to load payments report."));
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="print-loading">
        <div className="spinner-border text-primary" />
      </div>
    );
  if (error)
    return (
      <div className="print-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>{t("Go Back")}</button>
      </div>
    );

  return (
    <div className="print-payments-report-page">
      <div className="no-print print-actions">
        <button className="btn btn-primary me-2" onClick={() => window.print()}>
          <i className="fas fa-print me-2" />
          {t("Print")}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left me-2" />
          {t("Back")}
        </button>
      </div>

      <div className="print-content">
        <h1 className="print-title">{t("Payments Report")}</h1>
        <p className="print-period">
          {t("Period")}: {formatDate(filters.from)} – {formatDate(filters.to)}
        </p>

        <div className="print-summary-grid">
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Payments")}</span>
            <span className="summary-value">
              {formatCurrency(summary.total_payments)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Number of Payments")}</span>
            <span className="summary-value">{summary.count}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Average Payment")}</span>
            <span className="summary-value">
              {formatCurrency(summary.average)}
            </span>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-muted">{t("No payments found.")}</p>
        ) : (
          <table className="print-table">
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
                  <td>#{row.id}</td>
                  <td>{row.invoice_number}</td>
                  <td>{row.customer_name}</td>
                  <td>{formatCurrency(row.amount)}</td>
                  <td>{formatCurrency(row.applied_amount)}</td>
                  <td>{t(row.method)}</td>
                  <td>{formatDate(row.paid_at)}</td>
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
