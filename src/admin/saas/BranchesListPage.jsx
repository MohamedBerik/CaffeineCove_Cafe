import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import "./BranchesListPage.css";

export default function BranchesListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/erp/branches");
      setBranches(res.data.data || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("Failed to load branches."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const toggleBranchStatus = async (item) => {
    const nextStatus = item.is_active ? 0 : 1;
    const ok = window.confirm(
      nextStatus
        ? t('Activate branch "{{name}}"?', { name: item.name })
        : t('Deactivate branch "{{name}}"?', { name: item.name }),
    );
    if (!ok) return;
    try {
      setActionError("");
      setActionSuccess("");
      await api.put(`/erp/branches/${item.id}`, { is_active: nextStatus });
      setActionSuccess(
        nextStatus ? t("Branch activated.") : t("Branch deactivated."),
      );
      await fetchBranches();
    } catch (err) {
      setActionError(err?.response?.data?.msg || t("Failed to update branch."));
    }
  };

  const deleteBranch = async (item) => {
    const ok = window.confirm(
      t('Are you sure you want to delete branch "{{name}}"?', {
        name: item.name,
      }),
    );
    if (!ok) return;
    try {
      setActionError("");
      setActionSuccess("");
      await api.delete(`/erp/branches/${item.id}`);
      setActionSuccess(t("Branch deleted successfully."));
      await fetchBranches();
    } catch (err) {
      setActionError(err?.response?.data?.msg || t("Failed to delete branch."));
    }
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
    <div className="branches-list-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Branches")}</h1>
          <p className="page-subtitle">{t("Manage clinic branches")}</p>
        </div>
        <div className="header-actions">
          <Link
            to="/admin/erp/branches/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {t("Add Branch")}
          </Link>
          <button className="btn btn-primary" onClick={fetchBranches}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {actionError && <div className="alert alert-danger">{actionError}</div>}
      {actionSuccess && (
        <div className="alert alert-success">{actionSuccess}</div>
      )}

      <div className="branches-card">
        <div className="branches-card-header">
          <i className="fas fa-building me-2"></i>
          <h5 className="mb-0">{t("Branches List")}</h5>
          <span className="branch-count">
            {branches.length} {t("branches")}
          </span>
        </div>
        <div className="branches-card-body">
          {branches.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-building empty-icon"></i>
              <p className="empty-text">{t("No branches found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="branches-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("Address")}</th>
                    <th>{t("Phone")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("ID")}>#{item.id}</td>
                      <td data-label={t("Name")}>{item.name}</td>
                      <td data-label={t("Address")}>{item.address || "-"}</td>
                      <td data-label={t("Phone")}>{item.phone || "-"}</td>
                      <td data-label={t("Status")}>
                        <span
                          className={`status-badge ${item.is_active ? "status-active" : "status-inactive"}`}
                        >
                          {item.is_active ? t("Active") : t("Inactive")}
                        </span>
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          {(user?.is_super_admin || user?.role === "admin") && (
                            <>
                              <Link
                                to={`/admin/erp/branches/${item.id}/edit`}
                                className="btn btn-sm btn-outline-primary"
                                title={t("Edit Branch")}
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                              <button
                                className={`btn btn-sm ${item.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                                onClick={() => toggleBranchStatus(item)}
                                title={
                                  item.is_active
                                    ? t("Deactivate")
                                    : t("Activate")
                                }
                              >
                                <i
                                  className={`fas ${item.is_active ? "fa-ban" : "fa-check-circle"}`}
                                ></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteBranch(item)}
                                title={t("Delete Branch")}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </>
                          )}
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
