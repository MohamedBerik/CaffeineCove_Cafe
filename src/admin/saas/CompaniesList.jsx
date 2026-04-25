import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../services/axios";
import toast from "react-hot-toast";
import "./CompaniesList.css";

export default function CompaniesList() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  // ========================= Queries =========================
  const {
    data: companiesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "companies",
      page,
      search,
      statusFilter,
      sortField,
      sortDirection,
    ],
    queryFn: async () => {
      const res = await api.get("/saas/companies", {
        params: {
          page,
          search,
          status: statusFilter,
          sort_field: sortField,
          sort_direction: sortDirection,
          per_page: 15,
        },
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  // ========================= Mutations =========================
  const suspendMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/companies/${id}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries(["companies"]);
      toast.success(t("Company suspended successfully"));
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/companies/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries(["companies"]);
      toast.success(t("Company activated successfully"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["companies"]);
      toast.success(t("Company deleted successfully"));
    },
  });

  // ========================= Handlers =========================
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSuspend = (id, name) => {
    if (
      window.confirm(t("Are you sure you want to suspend {{name}}?", { name }))
    ) {
      suspendMutation.mutate(id);
    }
  };

  const handleActivate = (id, name) => {
    if (
      window.confirm(t("Are you sure you want to activate {{name}}?", { name }))
    ) {
      activateMutation.mutate(id);
    }
  };

  const handleDelete = (id, name) => {
    if (
      window.confirm(
        t(
          "Are you sure you want to delete {{name}}? This action cannot be undone.",
          { name },
        ),
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "fa-sort";
    return sortDirection === "asc" ? "fa-sort-up" : "fa-sort-down";
  };

  const companies = companiesData?.data || [];
  const meta = companiesData?.meta || {};

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="companies-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading companies...")}</p>
      </div>
    );
  }

  // ========================= Error State =========================
  if (error) {
    return (
      <div className="companies-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{t("Something went wrong")}</h3>
        <p>{error.message}</p>
        <button className="btn-retry" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="companies-list-container">
      {/* Header */}
      <div className="companies-header">
        <div className="header-title">
          <h1>{t("Companies")}</h1>
          <p>{t("Manage all clinics on your platform")}</p>
        </div>
        <Link to="/admin/companies/create" className="btn-add-company">
          <i className="fas fa-plus"></i>
          {t("Add New Company")}
        </Link>
      </div>

      {/* Filters */}
      <div className="companies-filters">
        <div className="search-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={t("Search by name or slug...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-wrapper">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("All Status")}</option>
            <option value="active">{t("Active")}</option>
            <option value="trial">{t("Trial")}</option>
            <option value="suspended">{t("Suspended")}</option>
            <option value="cancelled">{t("Cancelled")}</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Refresh")}
        </button>
      </div>

      {/* Table */}
      <div className="companies-table-wrapper">
        <table className="companies-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                {t("Company")}
                <i className={`fas ${getSortIcon("name")}`}></i>
              </th>
              <th onClick={() => handleSort("slug")}>
                {t("Slug")}
                <i className={`fas ${getSortIcon("slug")}`}></i>
              </th>
              <th onClick={() => handleSort("status")}>
                {t("Status")}
                <i className={`fas ${getSortIcon("status")}`}></i>
              </th>
              <th onClick={() => handleSort("created_at")}>
                {t("Created")}
                <i className={`fas ${getSortIcon("created_at")}`}></i>
              </th>
              <th>{t("Trial Ends")}</th>
              <th>{t("Users")}</th>
              <th className="text-center">{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-table">
                  <i className="fas fa-building"></i>
                  <p>{t("No companies found")}</p>
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <Link
                      to={`/admin/companies/${company.id}`}
                      className="company-name"
                    >
                      {company.name}
                    </Link>
                  </td>
                  <td className="company-slug">{company.slug}</td>
                  <td>
                    <StatusBadge status={company.status} t={t} />
                  </td>
                  <td>{formatDate(company.created_at)}</td>
                  <td>
                    {company.trial_ends_at ? (
                      <TrialBadge date={company.trial_ends_at} t={t} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{company.users_count || 0}</td>
                  <td>
                    <div className="actions-wrapper">
                      <Link
                        to={`/admin/companies/${company.id}`}
                        className="btn-action view"
                        title={t("View")}
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <Link
                        to={`/admin/companies/${company.id}/edit`}
                        className="btn-action edit"
                        title={t("Edit")}
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      {company.status === "suspended" ? (
                        <button
                          className="btn-action activate"
                          onClick={() =>
                            handleActivate(company.id, company.name)
                          }
                          title={t("Activate")}
                        >
                          <i className="fas fa-check-circle"></i>
                        </button>
                      ) : (
                        <button
                          className="btn-action suspend"
                          onClick={() =>
                            handleSuspend(company.id, company.name)
                          }
                          title={t("Suspend")}
                        >
                          <i className="fas fa-pause-circle"></i>
                        </button>
                      )}
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(company.id, company.name)}
                        title={t("Delete")}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="companies-pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <span className="pagination-info">
            {t("Page {{current}} of {{total}}", {
              current: meta.current_page,
              total: meta.last_page,
            })}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === meta.last_page}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

// ========================= Sub-Components =========================

function StatusBadge({ status, t }) {
  const statusMap = {
    active: { label: "Active", class: "success" },
    trial: { label: "Trial", class: "warning" },
    suspended: { label: "Suspended", class: "danger" },
    cancelled: { label: "Cancelled", class: "secondary" },
  };
  const info = statusMap[status] || { label: status, class: "secondary" };
  return (
    <span className={`status-badge status-${info.class}`}>
      <span className="status-dot"></span>
      {t(info.label)}
    </span>
  );
}

function TrialBadge({ date, t }) {
  const trialEnd = new Date(date);
  const today = new Date();
  const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));

  let badgeClass = "success";
  if (daysLeft <= 0) badgeClass = "danger";
  else if (daysLeft <= 7) badgeClass = "warning";

  return (
    <span className={`trial-badge ${badgeClass}`}>
      <i className="fas fa-clock"></i>
      {daysLeft > 0
        ? t("{{days}} days left", { days: daysLeft })
        : t("Expired")}
    </span>
  );
}
