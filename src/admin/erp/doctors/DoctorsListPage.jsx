import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "../../DoctorsListPage.css";

export default function DoctorsListPage() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/doctors");
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
          t("Failed to load doctors."),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      const specialty = String(item.specialty || "").toLowerCase();
      const status = String(
        item.is_active === true || item.is_active === 1 ? "active" : "inactive",
      ).toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        specialty.includes(q) ||
        status.includes(q)
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
    <div className="doctors-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Doctors")}</h1>
          <p className="page-subtitle">
            {t("Manage doctors, working hours, and availability")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/doctors/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-user-md me-2"></i>
            {t("New Doctor")}
          </Link>

          <button className="btn btn-primary" onClick={loadDoctors}>
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
          <h5 className="mb-0">{t("Search Doctors")}</h5>
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
                placeholder={t("Name, email, phone, specialty...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-database me-1"></i>
                {t("Total Doctors")}
              </label>
              <div className="total-badge">{meta?.total ?? rows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Table Card */}
      <div className="doctors-card">
        <div className="doctors-card-header">
          <i className="fas fa-list me-2"></i>
          <h5 className="mb-0">{t("Doctors List")}</h5>
          <span className="doctor-count">
            {filteredRows.length} {t("doctors")}
          </span>
        </div>

        <div className="doctors-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-md empty-icon"></i>
              <p className="empty-text">{t("No doctors found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="doctors-table">
                <thead>
                  <tr>
                    <th>{t("Doctor")}</th>
                    <th>{t("Specialty")}</th>
                    <th>{t("Working Hours")}</th>
                    <th>{t("Slot Minutes")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((doctor) => (
                    <tr key={doctor.id}>
                      <td data-label={t("Doctor")}>
                        <div className="doctor-info">
                          <div className="doctor-name">
                            {doctor.name || "-"}
                          </div>
                          <div className="doctor-contact">
                            {doctor.email && <span>{doctor.email}</span>}
                            {doctor.phone && (
                              <>
                                <span className="separator">|</span>
                                <span>{doctor.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label={t("Specialty")}>
                        <span className="specialty-badge">
                          {doctor.specialty || "-"}
                        </span>
                      </td>
                      <td data-label={t("Working Hours")}>
                        {doctor.work_start && doctor.work_end ? (
                          <div className="working-hours">
                            <i className="fas fa-clock me-1"></i>
                            {doctor.work_start} → {doctor.work_end}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Slot Minutes")}>
                        {doctor.slot_minutes ? (
                          <span className="slot-minutes">
                            {doctor.slot_minutes} {t("min")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge
                          active={
                            doctor.is_active === true || doctor.is_active === 1
                          }
                          t={t}
                        />
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          <Link
                            to={`/admin/erp/doctors/${doctor.id}/availability`}
                            state={{ doctor }}
                            className="btn btn-sm btn-outline-primary"
                            title={t("Manage Availability")}
                          >
                            <i className="fas fa-calendar-alt"></i>
                            {/* <span>{t("Availability")}</span> */}
                          </Link>

                          <Link
                            to={`/admin/erp/doctors/${doctor.id}/edit`}
                            className="btn btn-sm btn-outline-warning"
                            title={t("Edit Doctor")}
                          >
                            <i className="fas fa-edit"></i>
                            {/* <span>{t("Edit")}</span> */}
                          </Link>

                          <Link
                            to={`/admin/erp/appointments/create?doctor_id=${doctor.id}`}
                            className="btn btn-sm btn-outline-success"
                            title={t("Book Appointment")}
                          >
                            <i className="fas fa-calendar-plus"></i>
                            {/* <span>{t("Book")}</span> */}
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
function StatusBadge({ active, t }) {
  return (
    <span
      className={`status-badge ${active ? "status-active" : "status-inactive"}`}
    >
      <i
        className={`fas fa-${active ? "check-circle" : "times-circle"} me-1`}
      ></i>
      {active ? t("Active") : t("Inactive")}
    </span>
  );
}
