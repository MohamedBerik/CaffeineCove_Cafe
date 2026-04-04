import { useEffect, useMemo, useState } from "react";
import axios from "../../services/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ErpDashboardHome.css";

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [hiddenAlerts, setHiddenAlerts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    loadDashboard();
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good Morning");
    if (hour < 18) return t("Good Afternoon");
    return t("Good Evening");
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("/erp/dashboard");
      setData(res.data?.data ?? null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load ERP dashboard."),
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
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

  // دالة لتنسيق الوقت فقط
  const formatTime = (value) => {
    if (!value) return "-";
    try {
      // إذا كان الوقت كامل (مثلاً 13:00:00)
      return String(value).slice(0, 5);
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-animation">
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring"></div>
        </div>
        <p>{t("Loading dashboard...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{t("Something went wrong")}</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={loadDashboard}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-empty">
        <i className="fas fa-chart-line"></i>
        <h3>{t("No Data Available")}</h3>
        <p>{t("No dashboard data available.")}</p>
      </div>
    );
  }

  const kpis = data.kpis || {};
  const recentAppointments = data.recent_appointments || [];
  const recentInvoices = data.recent_invoices || [];
  const recentPayments = data.recent_payments || [];
  const reminderStats = data.reminders?.stats || {};
  const failedReminders = data.reminders?.failed_recent || [];
  const alerts = data.reminders?.alerts || [];

  const visibleAlerts = alerts.filter((a) => !hiddenAlerts.includes(a.id));
  // حساب إجماليات سريعة
  const totalRevenue = (kpis.today_revenue || 0) + (kpis.month_revenue || 0);
  const completionRate = kpis.today_appointments_count
    ? Math.round(
        (kpis.completed_today_count / kpis.today_appointments_count) * 100,
      )
    : 0;

  const acknowledge = async (id) => {
    try {
      await axios.post(`/alerts/${id}/ack`);

      setData((prev) => ({
        ...prev,
        reminders: {
          ...prev.reminders,
          alerts: prev.reminders.alerts.filter((a) => a.id !== id),
        },
      }));
    } catch (e) {
      console.error("Failed to acknowledge alert");
    }
  };

  const loadActivityLogs = async () => {
    try {
      const res = await axios.get("/activity-logs?limit=5");
      setActivityLogs(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadActivityLogs();
    setGreeting(getGreeting());
  }, []);

  const formatLog = (log) => {
    const type = log.subject_type;
    const action = log.action;

    if (type === "Appointment") {
      if (action === "created") return t("New appointment created");
      if (action === "updated") return t("Appointment updated");
      if (action === "deleted") return t("Appointment deleted");
    }

    if (type === "Invoice") {
      if (action === "created") return t("New invoice created");
      if (action === "paid") return t("Invoice paid");
    }

    if (type === "Payment") {
      return t("New payment recorded");
    }

    if (type === "Customer") {
      return t("Customer updated");
    }

    return `${type} ${action}`;
  };

  return (
    <div className="erp-dashboard">
      {/* Welcome Header with Greeting */}
      <div className="welcome-header">
        <div className="welcome-content">
          <div className="greeting-badge">
            <i className="fas fa-sun"></i>
            <span>{greeting}</span>
          </div>
          <h1 className="welcome-title">{t("Welcome to ERP Dashboard")}</h1>
          <p className="welcome-subtitle">
            {t("Here's what's happening with your clinic today")}
          </p>
        </div>
        <div className="date-badge">
          <i className="fas fa-calendar-alt"></i>
          <span>{formatDate(new Date())}</span>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-container">
          {visibleAlerts.map((alert, index) => (
            <div key={index} className={`alert-card alert-${alert.type}`}>
              <i
                className={`fas ${alert.type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}`}
              ></i>
              <span className={`alert-priority priority-${alert.priority}`}>
                {alert.priority}
              </span>
              <span>
                {t(alert.message)}{" "}
                {alert.meta?.count ? `(${alert.meta.count})` : ""}
              </span>

              <small className="alert-time">{formatDateTime(alert.time)}</small>
              <button
                className="alert-close"
                onClick={() => setHiddenAlerts([...hiddenAlerts, alert.id])}
              >
                <i className="fas fa-times"></i>
              </button>
              <button
                className="alert-ack"
                onClick={() => acknowledge(alert.id)}
              >
                <i className="fas fa-check"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="stat-icon primary">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.today_appointments_count ?? 0}
            </span>
            <span className="stat-label">{t("Appointments Today")}</span>
          </div>
          <div className="stat-trend up">
            <i className="fas fa-arrow-up"></i>
            <span>{completionRate}%</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon success">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
            <span className="stat-label">{t("Total Revenue")}</span>
          </div>
          {/* <div className="stat-trend up">
            <i className="fas fa-arrow-up"></i>
            <span>+12%</span>
          </div> */}
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon warning">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{reminderStats.pending ?? 0}</span>
            <span className="stat-label">{t("Pending Reminders")}</span>
          </div>
          {/* <div className="stat-trend down">
            <i className="fas fa-arrow-down"></i>
            <span>-5%</span>
          </div> */}
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon info">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.total_patients ?? 0}</span>
            <span className="stat-label">{t("Total Patients")}</span>
          </div>
          {/* <div className="stat-trend up">
            <i className="fas fa-arrow-up"></i>
            <span>+8%</span>
          </div> */}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="section-header">
        <h2>{t("Key Performance Indicators")}</h2>
        <p>{t("Monitor your clinic's performance at a glance")}</p>
      </div>

      <div className="kpis-grid">
        <KpiCard
          title={t("Appointments Today")}
          value={kpis.today_appointments_count ?? 0}
          icon="fas fa-calendar-day"
          color="primary"
          link="/admin/erp/appointments/calendar"
          // trend="+12%"
        />
        <KpiCard
          title={t("Scheduled Today")}
          value={kpis.scheduled_today_count ?? 0}
          icon="fas fa-clock"
          color="info"
          // trend="+5%"
        />
        <KpiCard
          title={t("Completed Today")}
          value={kpis.completed_today_count ?? 0}
          icon="fas fa-check-circle"
          color="success"
          // trend="+8%"
        />
        <KpiCard
          title={t("Cancelled / No Show")}
          value={`${kpis.cancelled_today_count ?? 0} / ${kpis.no_show_today_count ?? 0}`}
          icon="fas fa-times-circle"
          color="danger"
          // trend="-3%"
        />
        <KpiCard
          title={t("Unpaid Invoices")}
          value={kpis.unpaid_invoices_count ?? 0}
          icon="fas fa-file-invoice"
          color="warning"
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Partially Paid")}
          value={kpis.partially_paid_invoices_count ?? 0}
          icon="fas fa-receipt"
          color="secondary"
        />
        <KpiCard
          title={t("Today Revenue")}
          value={formatCurrency(kpis.today_revenue)}
          icon="fas fa-money-bill-wave"
          color="success"
        />
        <KpiCard
          title={t("Month Revenue")}
          value={formatCurrency(kpis.month_revenue)}
          icon="fas fa-chart-line"
          color="dark"
        />
        <KpiCard
          title={t("Customer Credit Balance")}
          value={formatCurrency(kpis.credit_balance_total)}
          icon="fas fa-wallet"
          color="primary"
          link="/admin/erp/patients"
        />
        <KpiCard
          title={t("Paid Invoices")}
          value={kpis.paid_invoices_count ?? 0}
          icon="fas fa-check-double"
          color="success"
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Reminders Pending")}
          value={reminderStats.pending ?? 0}
          icon="fas fa-hourglass-half"
          color="warning"
        />
        <KpiCard
          title={t("Reminders Failed")}
          value={reminderStats.failed ?? 0}
          icon="fas fa-exclamation-triangle"
          color="danger"
        />
        <KpiCard
          title={t("Reminders Sent")}
          value={reminderStats.sent ?? 0}
          icon="fas fa-paper-plane"
          color="success"
        />
      </div>

      {/* Tables Section */}
      <div className="section-header">
        <h2>{t("Recent Activity")}</h2>
        <p>{t("Latest updates from your clinic")}</p>
      </div>

      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-history"></i>
            <h5 className="card-title">{t("Activity Logs")}</h5>
          </div>
        </div>

        <div className="card-body-custom">
          {activityLogs.length === 0 ? (
            <EmptyState text={t("No activity yet.")} />
          ) : (
            <ul className="activity-list">
              {activityLogs.map((log) => (
                <li key={log.id} className="activity-item">
                  <div className="activity-text">{formatLog(log)}</div>
                  <small className="activity-time">
                    {formatDateTime(log.created_at)}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="tables-grid">
        {/* Recent Appointments Table */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-calendar-alt"></i>
              <h5 className="card-title">{t("Recent Appointments")}</h5>
            </div>
            <Link to="/admin/erp/appointments/calendar" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div className="card-body-custom">
            {recentAppointments.length === 0 ? (
              <EmptyState text={t("No recent appointments.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Patient")}</th>
                      <th>{t("Doctor")}</th>
                      <th>{t("Date")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Patient")}>
                          {item.patient?.id ? (
                            <Link
                              to={`/admin/erp/patients/${item.patient.id}/profile`}
                              className="patient-link"
                            >
                              {item.patient?.name || "-"}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td data-label={t("Doctor")}>
                          {item.doctor?.name || item.doctor_name || "-"}
                        </td>
                        <td data-label={t("Date")}>
                          {formatDate(item.appointment_date)}{" "}
                          {formatTime(item.appointment_time)}
                        </td>
                        <td data-label={t("Status")}>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-file-invoice"></i>
              <h5 className="card-title">{t("Recent Invoices")}</h5>
            </div>
            <Link to="/admin/erp/invoices" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div className="card-body-custom">
            {recentInvoices.length === 0 ? (
              <EmptyState text={t("No recent invoices.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Number")}</th>
                      <th>{t("Total")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Issued")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Number")}>
                          <Link
                            to={`/admin/erp/invoices/${item.id}`}
                            className="invoice-link"
                          >
                            {item.number}
                          </Link>
                        </td>
                        <td data-label={t("Total")} className="fw-semibold">
                          {formatCurrency(item.total)}
                        </td>
                        <td data-label={t("Status")}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td data-label={t("Issued")}>
                          {formatDate(item.issued_at || item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="dashboard-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-credit-card"></i>
              <h5 className="card-title">{t("Recent Payments")}</h5>
            </div>
            <Link to="/admin/erp/invoices" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div className="card-body-custom">
            {recentPayments.length === 0 ? (
              <EmptyState text={t("No recent payments.")} />
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Invoice")}</th>
                      <th>{t("Applied")}</th>
                      <th>{t("Method")}</th>
                      <th>{t("Paid At")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Invoice")}>
                          <Link
                            to={`/admin/erp/invoices/${item.invoice_id}`}
                            className="invoice-link"
                          >
                            #{item.invoice_id}
                          </Link>
                        </td>
                        <td
                          data-label={t("Applied")}
                          className="fw-semibold text-success"
                        >
                          {formatCurrency(item.applied_amount)}
                        </td>
                        <td
                          data-label={t("Method")}
                          className="text-capitalize"
                        >
                          {item.method || "-"}
                        </td>
                        <td data-label={t("Paid At")}>
                          {formatDateTime(item.paid_at || item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Failed Reminders Table */}
        {failedReminders.length > 0 && (
          <div className="dashboard-card warning-card">
            <div className="card-header-custom">
              <div className="card-title-wrapper">
                <i className="fas fa-bell-slash"></i>
                <h5 className="card-title">{t("Failed Reminders")}</h5>
              </div>
            </div>

            <div className="card-body-custom">
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t("Appointment")}</th>
                      <th>{t("Doctor")}</th>
                      <th>{t("Date")}</th>
                      <th>{t("Retries")}</th>
                      <th>{t("Last Attempt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedReminders.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t("Appointment")}>#{item.id}</td>
                        <td data-label={t("Doctor")}>
                          {item.doctor_name || "-"}
                        </td>
                        <td data-label={t("Date")}>
                          {formatDate(item.appointment_date)}
                        </td>
                        <td
                          data-label={t("Retries")}
                          className="text-danger fw-bold"
                        >
                          {item.reminder_retry_count}
                        </td>
                        <td data-label={t("Last Attempt")}>
                          {formatDateTime(item.reminder_last_attempt_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// KpiCard Component - Premium Design
function KpiCard({ title, value, icon, color = "primary", link, trend }) {
  const colorMap = {
    primary: {
      bg: "rgba(26, 35, 126, 0.1)",
      text: "#1a237e",
      border: "#1a237e",
    },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4", border: "#03a9f4" },
    success: {
      bg: "rgba(76, 175, 80, 0.1)",
      text: "#4caf50",
      border: "#4caf50",
    },
    danger: {
      bg: "rgba(244, 67, 54, 0.1)",
      text: "#f44336",
      border: "#f44336",
    },
    warning: {
      bg: "rgba(255, 152, 0, 0.1)",
      text: "#ff9800",
      border: "#ff9800",
    },
    secondary: {
      bg: "rgba(108, 117, 125, 0.1)",
      text: "#6c757d",
      border: "#6c757d",
    },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529", border: "#212529" },
  };

  const colors = colorMap[color] || colorMap.primary;

  const cardContent = (
    <div className={`kpi-card premium-card ${link ? "clickable" : ""}`}>
      <div className="kpi-card-header">
        <div
          className="kpi-icon-wrapper"
          style={{ backgroundColor: colors.bg }}
        >
          <i className={icon} style={{ color: colors.text }}></i>
        </div>
        {trend && (
          <div
            className={`kpi-trend ${trend.includes("+") ? "positive" : "negative"}`}
          >
            <i
              className={`fas fa-arrow-${trend.includes("+") ? "up" : "down"}`}
            ></i>
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="kpi-card-body">
        <span className="kpi-value">{value}</span>
        <span className="kpi-title">{title}</span>
      </div>
    </div>
  );

  if (!link) return cardContent;

  return (
    <Link to={link} className="kpi-link-wrapper">
      {cardContent}
    </Link>
  );
}

// EmptyState Component
function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <i className="fas fa-inbox empty-icon"></i>
      <p className="empty-text">{text}</p>
    </div>
  );
}

// StatusBadge Component - Improved
function StatusBadge({ status }) {
  const statusMap = {
    paid: { label: "Paid", class: "success" },
    completed: { label: "Completed", class: "success" },
    unpaid: { label: "Unpaid", class: "danger" },
    cancelled: { label: "Cancelled", class: "danger" },
    no_show: { label: "No Show", class: "danger" },
    partially_paid: { label: "Partially Paid", class: "warning" },
    scheduled: { label: "Scheduled", class: "warning" },
    in_progress: { label: "In Progress", class: "info" },
    pending: { label: "Pending", class: "secondary" },
  };

  const value = String(status || "").toLowerCase();
  const statusInfo = statusMap[value] || { label: status, class: "secondary" };
  const { t } = useTranslation();

  return (
    <span className={`status-badge status-${statusInfo.class}`}>
      <span className="status-dot"></span>
      {t(statusInfo.label)}
    </span>
  );
}
