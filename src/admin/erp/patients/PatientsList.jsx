import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PatientsList.css";

export default function PatientsList() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/customers");
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
          t("Failed to load patients."),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const patientCode = String(item.patient_code || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        patientCode.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        status.includes(q)
      );
    });
  }, [rows, search]);

  const normalizeStatus = (value) => {
    if (String(value) === "1") return "active";
    if (String(value) === "0") return "inactive";
    return String(value || "-");
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "300px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-list-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Patients")}</h1>
          <p className="page-subtitle">
            {t("Manage patients, open profile, timeline, and statement")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/patients/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-user-plus me-2"></i>
            {t("New Patient")}
          </Link>

          <button className="btn btn-primary" onClick={loadPatients}>
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
          <h5 className="mb-0">{t("Search Patients")}</h5>
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
                  "Search by code, name, email, phone, or status...",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-database me-1"></i>
                {t("Total Patients")}
              </label>
              <div className="total-badge">{meta?.total ?? rows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="patients-card">
        <div className="patients-card-header">
          <i className="fas fa-users me-2"></i>
          <h5 className="mb-0">{t("Patients List")}</h5>
          <span className="patient-count">
            {filteredRows.length} {t("patients")}
          </span>
        </div>

        <div className="patients-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-slash empty-icon"></i>
              <p className="empty-text">{t("No patients found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>{t("Code")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("Email")}</th>
                    <th>{t("Phone")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((patient) => (
                    <tr key={patient.id}>
                      <td data-label={t("Code")}>
                        <span className="patient-code">
                          {patient.patient_code || "-"}
                        </span>
                      </td>
                      <td data-label={t("Name")}>
                        <div className="patient-name">
                          {patient.name || "-"}
                        </div>
                      </td>
                      <td data-label={t("Email")}>
                        {patient.email ? (
                          <a
                            href={`mailto:${patient.email}`}
                            className="email-link"
                          >
                            {patient.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Phone")}>
                        {patient.phone ? (
                          <a
                            href={`tel:${patient.phone}`}
                            className="phone-link"
                          >
                            {patient.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge
                          status={normalizeStatus(patient.status)}
                          t={t}
                        />
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          <Link
                            to={`/admin/erp/patients/${patient.id}/profile`}
                            className="btn btn-sm btn-outline-primary"
                            title={t("View Profile")}
                          >
                            <i className="fas fa-user"></i>
                            {/* <span>{t("Profile")}</span> */}
                          </Link>

                          <Link
                            to={`/admin/erp/patients/${patient.id}/edit`}
                            className="btn btn-sm btn-outline-warning"
                            title={t("Edit Patient")}
                          >
                            <i className="fas fa-edit"></i>
                            {/* <span>{t("Edit")}</span> */}
                          </Link>

                          <Link
                            to={`/admin/erp/patients/${patient.id}/timeline`}
                            className="btn btn-sm btn-outline-info"
                            title={t("View Timeline")}
                          >
                            <i className="fas fa-history"></i>
                            {/* <span>{t("Timeline")}</span> */}
                          </Link>

                          <Link
                            to={`/admin/erp/patients/${patient.id}/statement`}
                            className="btn btn-sm btn-outline-success"
                            title={t("View Statement")}
                          >
                            <i className="fas fa-file-invoice"></i>
                            {/* <span>{t("Statement")}</span> */}
                          </Link>
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

  if (value === "active") {
    variant = "success";
    label = t("Active");
  }
  if (value === "inactive") {
    variant = "danger";
    label = t("Inactive");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}
