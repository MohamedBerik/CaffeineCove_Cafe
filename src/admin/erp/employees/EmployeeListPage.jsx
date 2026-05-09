import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./EmployeeListPage.css"; // يعاد استخدام نفس التنسيق

export default function EmployeeListPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/employees");
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
          t("Failed to load employees."),
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
      const salary = String(item.salary || "").toLowerCase();
      const branch = String(item.branch?.name || "").toLowerCase();
      const status = String(
        item.is_active === true || item.is_active === 1 ? "active" : "inactive",
      ).toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        salary.includes(q) ||
        branch.includes(q) ||
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
          <h1 className="page-title">{t("Employees")}</h1>
          <p className="page-subtitle">{t("Manage receptionists and staff")}</p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/employees/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-user-plus me-2"></i>
            {t("New Employee")}
          </Link>

          <button className="btn btn-primary" onClick={loadEmployees}>
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
          <h5 className="mb-0">{t("Search Employees")}</h5>
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
                placeholder={t("Name, email, phone, salary...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-users me-1"></i>
                {t("Total Employees")}
              </label>
              <div className="total-badge">{meta?.total ?? rows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="doctors-card">
        <div className="doctors-card-header">
          <i className="fas fa-list me-2"></i>
          <h5 className="mb-0">{t("Employees List")}</h5>
          <span className="doctor-count">
            {filteredRows.length} {t("employees")}
          </span>
        </div>

        <div className="doctors-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-tie empty-icon"></i>
              <p className="empty-text">{t("No employees found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="doctors-table">
                <thead>
                  <tr>
                    <th>{t("Name")}</th>
                    <th>{t("Contact")}</th>
                    <th>{t("Salary")}</th>
                    <th>{t("Branch")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((emp) => (
                    <tr key={emp.id}>
                      <td data-label={t("Name")}>
                        <div className="doctor-name">{emp.name || "-"}</div>
                      </td>
                      <td data-label={t("Contact")}>
                        <div className="doctor-contact">
                          {emp.email && <span>{emp.email}</span>}
                          {emp.phone && (
                            <>
                              <span className="separator">|</span>
                              <span>{emp.phone}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td data-label={t("Salary")}>
                        {emp.salary != null
                          ? `EGP ${Number(emp.salary).toFixed(2)}`
                          : "-"}
                      </td>
                      <td data-label={t("Branch")}>
                        {emp.branch?.name || "-"}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge
                          active={emp.is_active === true || emp.is_active === 1}
                          t={t}
                        />
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          <Link
                            to={`/admin/erp/employees/${emp.id}/edit`}
                            className="btn btn-sm btn-outline-warning"
                            title={t("Edit Employee")}
                          >
                            <i className="fas fa-edit"></i>
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

// نفس مكون StatusBadge المستخدم في DoctorsListPage
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
