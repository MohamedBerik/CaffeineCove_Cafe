import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintTreatmentPlansReportPage.css";

export default function PrintTreatmentPlansReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const queryParams = new URLSearchParams(location.search);
  const [filters] = useState({
    from: queryParams.get("from") || today,
    to: queryParams.get("to") || today,
    status: queryParams.get("status") || "",
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_plans: 0,
    total_cost: 0,
    total_paid: 0,
    total_remaining: 0,
    completion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "USD",
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
      const res = await axios.get("/erp/treatment-plans", { timeout: 30000 });
      const payload = res.data || {};

      let planRows = [];
      if (Array.isArray(payload.data)) planRows = payload.data;
      else if (payload.data?.data && Array.isArray(payload.data.data))
        planRows = payload.data.data;

      const filtered = planRows.filter((plan) => {
        const createdAt = plan.created_at
          ? String(plan.created_at).slice(0, 10)
          : "";
        if (filters.from && createdAt < filters.from) return false;
        if (filters.to && createdAt > filters.to) return false;
        if (filters.status && plan.status !== filters.status) return false;
        return true;
      });

      const normalized = filtered.map((plan) => ({
        id: plan.id,
        title: plan.title || "-",
        patient_name: plan.customer?.name || "-",
        patient_email: plan.customer?.email || "",
        total_cost: Number(plan.total_cost || 0),
        total_paid: Number(plan.total_paid || 0),
        net_paid: Number(plan.net_paid || 0),
        remaining: Number(plan.remaining || 0),
        status: plan.status || "-",
        created_at: plan.created_at || null,
      }));

      const totalPlans = normalized.length;
      const totalCost = normalized.reduce((s, p) => s + p.total_cost, 0);
      const totalPaid = normalized.reduce((s, p) => s + p.total_paid, 0);
      const totalRemaining = normalized.reduce((s, p) => s + p.remaining, 0);
      const completedCount = normalized.filter(
        (p) => p.status === "completed",
      ).length;
      const completionRate = totalPlans
        ? Math.round((completedCount / totalPlans) * 100)
        : 0;

      setRows(normalized);
      setSummary({
        total_plans: totalPlans,
        total_cost: totalCost,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        completion_rate: completionRate,
      });
    } catch (err) {
      setError(t("Failed to load treatment plans report."));
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
    <div className="print-treatment-plans-report-page">
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
        <h1 className="print-title">{t("Treatment Plans Report")}</h1>
        <p className="print-period">
          {t("Period")}: {formatDate(filters.from)} – {formatDate(filters.to)}
          {filters.status && ` | ${t(filters.status)}`}
        </p>

        <div className="print-summary-grid">
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Plans")}</span>
            <span className="summary-value">{summary.total_plans}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Cost")}</span>
            <span className="summary-value">
              {formatCurrency(summary.total_cost)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Paid")}</span>
            <span className="summary-value">
              {formatCurrency(summary.total_paid)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Remaining")}</span>
            <span className="summary-value">
              {formatCurrency(summary.total_remaining)}
            </span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Completion Rate")}</span>
            <span className="summary-value">{summary.completion_rate}%</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-muted">
            {t("No treatment plans found.")}
          </p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th>{t("Title")}</th>
                <th>{t("Patient")}</th>
                <th>{t("Total Cost")}</th>
                <th>{t("Total Paid")}</th>
                <th>{t("Net Paid")}</th>
                <th>{t("Remaining")}</th>
                <th>{t("Status")}</th>
                <th>{t("Created")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>
                    {row.patient_name}
                    {row.patient_email && <small> ({row.patient_email})</small>}
                  </td>
                  <td>{formatCurrency(row.total_cost)}</td>
                  <td>{formatCurrency(row.total_paid)}</td>
                  <td>{formatCurrency(row.net_paid)}</td>
                  <td>{formatCurrency(row.remaining)}</td>
                  <td>{row.status}</td>
                  <td>{formatDate(row.created_at)}</td>
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
