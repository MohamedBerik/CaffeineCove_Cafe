import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintPatientsReportPage.css";

export default function PrintPatientsReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const queryParams = new URLSearchParams(location.search);
  const [filters] = useState({
    from: queryParams.get("from") || today,
    to: queryParams.get("to") || today,
    gender: queryParams.get("gender") || "",
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    male: 0,
    female: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

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
      const res = await axios.get("/erp/customers", { timeout: 30000 });
      const payload = res.data || {};

      let patientRows = [];
      if (Array.isArray(payload.data)) {
        patientRows = payload.data;
      } else if (payload.data?.data && Array.isArray(payload.data.data)) {
        patientRows = payload.data.data;
      }

      const filtered = patientRows.filter((p) => {
        const createdAt = p.created_at ? String(p.created_at).slice(0, 10) : "";
        if (filters.from && createdAt < filters.from) return false;
        if (filters.to && createdAt > filters.to) return false;
        if (filters.gender && p.gender !== filters.gender) return false;
        return true;
      });

      const normalized = filtered.map((p) => ({
        id: p.id,
        patient_code: p.patient_code || "-",
        name: p.name || "-",
        email: p.email || "-",
        phone: p.phone || "-",
        gender_label: p.gender_label || p.gender || "-",
        date_of_birth: p.date_of_birth || null,
        age: p.age,
        status: p.status === "1" ? "active" : "inactive",
        status_label: p.status === "1" ? t("Active") : t("Inactive"),
        created_at: p.created_at || null,
      }));

      const total = normalized.length;
      const active = normalized.filter((p) => p.status === "active").length;
      const inactive = total - active;
      const male = normalized.filter((p) => p.gender === "male").length;
      const female = normalized.filter((p) => p.gender === "female").length;

      setRows(normalized);
      setSummary({ total, active, inactive, male, female });
    } catch (err) {
      setError(t("Failed to load patients report."));
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
    <div className="print-patients-report-page">
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
        <h1 className="print-title">{t("Patients Report")}</h1>
        <p className="print-period">
          {t("Period")}: {formatDate(filters.from)} – {formatDate(filters.to)}
          {filters.gender && ` | ${t(filters.gender)}`}
        </p>

        <div className="print-summary-grid">
          <div className="print-summary-card">
            <span className="summary-label">{t("Total Patients")}</span>
            <span className="summary-value">{summary.total}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Active")}</span>
            <span className="summary-value">{summary.active}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Inactive")}</span>
            <span className="summary-value">{summary.inactive}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Male")}</span>
            <span className="summary-value">{summary.male}</span>
          </div>
          <div className="print-summary-card">
            <span className="summary-label">{t("Female")}</span>
            <span className="summary-value">{summary.female}</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-muted">{t("No patients found.")}</p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th>{t("Code")}</th>
                <th>{t("Name")}</th>
                <th>{t("Email")}</th>
                <th>{t("Phone")}</th>
                <th>{t("Gender")}</th>
                <th>{t("Date of Birth")}</th>
                <th>{t("Age")}</th>
                <th>{t("Status")}</th>
                <th>{t("Created")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.patient_code}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.gender_label}</td>
                  <td>{formatDate(row.date_of_birth)}</td>
                  <td>{row.age ?? "-"}</td>
                  <td>{row.status_label}</td>
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
