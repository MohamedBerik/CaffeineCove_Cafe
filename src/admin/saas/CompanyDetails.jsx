import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/axios";
import toast from "react-hot-toast";
import styles from "./CompanyDetails.module.css";

export default function CompanyDetails() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);

  // ========================= Queries =========================
  const {
    data: company,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const res = await api.get(`/saas/companies/${id}`);
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["company-stats", id],
    queryFn: async () => {
      const res = await api.get(`/saas/companies/${id}/stats`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  const { data: users } = useQuery({
    queryKey: ["company-users", id],
    queryFn: async () => {
      const res = await api.get(`/saas/companies/${id}/users`);
      return res.data.data;
    },
    enabled: Boolean(id) && activeTab === "users",
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["company-subscriptions", id],
    queryFn: async () => {
      const res = await api.get(`/saas/companies/${id}/subscriptions`);
      return res.data.data;
    },
    enabled: Boolean(id) && activeTab === "subscriptions",
  });

  const { data: activityLogs } = useQuery({
    queryKey: ["company-activity", id],
    queryFn: async () => {
      const res = await api.get(
        `/saas/activity-logs?company_id=${id}&limit=20`,
      );
      return res.data.data;
    },
    enabled: Boolean(id) && activeTab === "activity",
  });

  const handleExportClinic = async () => {
    setExporting(true);
    try {
      const res = await api.post(`/saas/companies/${id}/export`);
      const downloadUrl = res.data.download_url;

      if (!downloadUrl) {
        toast.error(t("Export failed. No file generated."));
        return;
      }

      const fileRes = await api.get(downloadUrl, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([fileRes.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = downloadUrl.split("file=")[1] || "clinic_export.zip";
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t("Export completed. Download started."));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("Export failed. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  // ========================= Mutations =========================
  const suspendMutation = useMutation({
    mutationFn: () => api.post(`/saas/companies/${id}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries(["company", id]);
      queryClient.invalidateQueries(["companies"]);
      toast.success(t("Company suspended successfully"));
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/saas/companies/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries(["company", id]);
      queryClient.invalidateQueries(["companies"]);
      toast.success(t("Company activated successfully"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/saas/companies/${id}`),
    onSuccess: () => {
      toast.success(t("Company deleted successfully"));
      navigate("/saas/companies");
    },
  });

  // ========================= Handlers =========================
  const handleSuspend = () => {
    if (window.confirm(t("Are you sure you want to suspend this company?"))) {
      suspendMutation.mutate();
    }
  };

  const handleActivate = () => {
    if (window.confirm(t("Are you sure you want to activate this company?"))) {
      activateMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        t(
          "Are you sure you want to delete this company? This action cannot be undone.",
        ),
      )
    ) {
      deleteMutation.mutate();
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

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className={styles.companyDetailsLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>{t("Loading company details...")}</p>
      </div>
    );
  }

  // ========================= Error State =========================
  if (error) {
    return (
      <div className={styles.companyDetailsError}>
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{t("Something went wrong")}</h3>
        <p>{error.message}</p>
        <button className={styles.btnRetry} onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  if (!company) return null;

  // ========================= UI =========================
  return (
    <div className={styles.companyDetailsContainer}>
      {/* Header */}
      <div className={styles.detailsHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.btnBack}
            onClick={() => navigate("/admin/companies")}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className={styles.companyTitle}>
            <h1>{company.name}</h1>
            <span className={styles.companySlug}>{company.slug}</span>
          </div>
          <StatusBadge status={company.status} t={t} />
        </div>
        <div className={styles.headerActions}>
          <Link to={`/admin/companies/${id}/edit`} className={styles.btnEdit}>
            <i className="fas fa-edit"></i>
            {t("Edit")}
          </Link>
          <button
            className={`btn btn-outline-info`}
            onClick={handleExportClinic}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {t("Exporting...")}
              </>
            ) : (
              <>
                <i className="fas fa-download me-2"></i>
                {t("Export Clinic Data")}
              </>
            )}
          </button>
          {company.status === "suspended" ? (
            <button className={styles.btnActivate} onClick={handleActivate}>
              <i className="fas fa-check-circle"></i>
              {t("Activate")}
            </button>
          ) : (
            <button className={styles.btnSuspend} onClick={handleSuspend}>
              <i className="fas fa-pause-circle"></i>
              {t("Suspend")}
            </button>
          )}
          <button className={styles.btnDelete} onClick={handleDelete}>
            <i className="fas fa-trash"></i>
            {t("Delete")}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title={t("Total Users")}
          value={stats?.total_users || 0}
          icon="fas fa-users"
          color="primary"
        />
        <StatCard
          title={t("Total Patients")}
          value={stats?.total_patients || 0}
          icon="fas fa-user-injured"
          color="info"
        />
        <StatCard
          title={t("Total Appointments")}
          value={stats?.total_appointments || 0}
          icon="fas fa-calendar-check"
          color="success"
        />
        <StatCard
          title={t("Total Revenue")}
          value={formatCurrency(stats?.total_revenue || 0)}
          icon="fas fa-dollar-sign"
          color="warning"
        />
        <StatCard
          title={t("MRR")}
          value={formatCurrency(stats?.mrr || 0)}
          icon="fas fa-chart-line"
          color="dark"
        />
        <StatCard
          title={t("Outstanding Invoices")}
          value={formatCurrency(stats?.outstanding || 0)}
          icon="fas fa-file-invoice"
          color="danger"
        />
      </div>

      {/* Company Info */}
      <div className={styles.infoCard}>
        <h3>{t("Company Information")}</h3>
        <div className={styles.infoGrid}>
          <InfoItem
            icon="fas fa-envelope"
            label={t("Email")}
            value={company.email || "-"}
          />
          <InfoItem
            icon="fas fa-phone"
            label={t("Phone")}
            value={company.phone || "-"}
          />
          <InfoItem
            icon="fas fa-map-marker-alt"
            label={t("Address")}
            value={company.address || "-"}
          />
          <InfoItem
            icon="fas fa-user-tie"
            label={t("Contact Person")}
            value={company.contact_person || "-"}
          />
          <InfoItem
            icon="fas fa-calendar"
            label={t("Created")}
            value={formatDate(company.created_at)}
          />
          <InfoItem
            icon="fas fa-calendar-alt"
            label={t("Trial Ends")}
            value={formatDate(company.trial_ends_at) || "-"}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.detailsTabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <i className="fas fa-chart-bar"></i>
          {t("Overview")}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "users" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <i className="fas fa-users"></i>
          {t("Users")}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "subscriptions" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("subscriptions")}
        >
          <i className="fas fa-credit-card"></i>
          {t("Subscriptions")}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "activity" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          <i className="fas fa-history"></i>
          {t("Activity Logs")}
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "overview" && (
          <OverviewTab
            company={company}
            stats={stats}
            t={t}
            formatCurrency={formatCurrency}
          />
        )}
        {activeTab === "users" && <UsersTab users={users} t={t} />}
        {activeTab === "subscriptions" && (
          <SubscriptionsTab
            subscriptions={subscriptions}
            t={t}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        )}
        {activeTab === "activity" && (
          <ActivityTab
            logs={activityLogs}
            t={t}
            formatDateTime={formatDateTime}
          />
        )}
      </div>
    </div>
  );
}

// ========================= Sub-Components =========================

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ backgroundColor: colors.bg }}>
        <i className={icon} style={{ color: colors.text }}></i>
      </div>
      <div className={styles.statContent}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{title}</span>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className={styles.infoItem}>
      <i className={icon}></i>
      <div className={styles.infoContent}>
        <span className={styles.infoLabel}>{label}</span>
        <span className={styles.infoValue}>{value}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const statusMap = {
    active: { label: "Active", class: "success" },
    trial: { label: "Trial", class: "warning" },
    suspended: { label: "Suspended", class: "danger" },
    cancelled: { label: "Cancelled", class: "secondary" },
  };
  const info = statusMap[status] || { label: status, class: "secondary" };
  return (
    <span
      className={`${styles.statusBadge} ${styles[`status${info.class.charAt(0).toUpperCase() + info.class.slice(1)}`]}`}
    >
      <span className={styles.statusDot}></span>
      {t(info.label)}
    </span>
  );
}

function OverviewTab({ company, stats, t, formatCurrency }) {
  return (
    <div className={styles.overviewTab}>
      <div className={styles.overviewSection}>
        <h4>{t("Recent Performance")}</h4>
        <div className={styles.performanceGrid}>
          <div className={styles.performanceItem}>
            <span className={styles.performanceLabel}>
              {t("Appointments This Month")}
            </span>
            <span className={styles.performanceValue}>
              {stats?.appointments_this_month || 0}
            </span>
          </div>
          <div className={styles.performanceItem}>
            <span className={styles.performanceLabel}>
              {t("Revenue This Month")}
            </span>
            <span className={styles.performanceValue}>
              {formatCurrency(stats?.revenue_this_month || 0)}
            </span>
          </div>
          <div className={styles.performanceItem}>
            <span className={styles.performanceLabel}>
              {t("New Patients This Month")}
            </span>
            <span className={styles.performanceValue}>
              {stats?.new_patients_this_month || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users, t }) {
  if (!users || users.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <i className="fas fa-users"></i>
        <p>{t("No users found")}</p>
      </div>
    );
  }

  return (
    <div className={styles.usersTab}>
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>{t("Name")}</th>
            <th>{t("Email")}</th>
            <th>{t("Role")}</th>
            <th>{t("Status")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td data-label={t("Name")}>{user.name}</td>
              <td data-label={t("Email")}>{user.email}</td>
              <td data-label={t("Role")}>{user.role}</td>
              <td>
                <span
                  className={`${styles.userStatus} ${user.status === 1 ? styles.userStatusActive : styles.userStatusInactive}`}
                >
                  {user.status === 1 ? t("Active") : t("Inactive")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionsTab({ subscriptions, t, formatDate, formatCurrency }) {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <i className="fas fa-credit-card"></i>
        <p>{t("No subscriptions found")}</p>
      </div>
    );
  }

  return (
    <div className={styles.subscriptionsTab}>
      <div className={styles.subscriptionsTableWrapper}>
        <table className={styles.subscriptionsTable}>
          <thead>
            <tr>
              <th>{t("Plan")}</th>
              <th>{t("Amount")}</th>
              <th>{t("Status")}</th>
              <th>{t("Start Date")}</th>
              <th>{t("End Date")}</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td data-label={t("Plan")}>{sub.plan?.name || "-"}</td>
                <td data-label={t("Amount")}>{formatCurrency(sub.amount)}</td>
                <td data-label={t("Status")}>
                  <StatusBadge status={sub.status} t={t} />
                </td>
                <td data-label={t("Start Date")}>
                  {formatDate(sub.starts_at)}
                </td>
                <td data-label={t("End Date")}>{formatDate(sub.ends_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTab({ logs, t, formatDateTime }) {
  if (!logs || logs.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <i className="fas fa-history"></i>
        <p>{t("No activity logs found")}</p>
      </div>
    );
  }

  const getActivityIcon = (action) => {
    const icons = {
      created: "fa-plus-circle",
      updated: "fa-edit",
      deleted: "fa-trash",
      suspended: "fa-pause-circle",
      activated: "fa-check-circle",
    };
    return icons[action] || "fa-info-circle";
  };

  return (
    <div className={styles.activityTab}>
      <div className={styles.activityList}>
        {logs.map((log) => (
          <div key={log.id} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <i className={`fas ${getActivityIcon(log.action)}`}></i>
            </div>
            <div className={styles.activityContent}>
              <span className={styles.activityAction}>{t(log.action)}</span>
              <span className={styles.activityUser}>
                {log.user?.name || "System"}
              </span>
            </div>
            <div className={styles.activityTime}>
              {formatDateTime(log.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
