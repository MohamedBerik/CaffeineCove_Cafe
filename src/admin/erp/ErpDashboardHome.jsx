import { useEffect, useState, useRef, useCallback } from "react";
import axios from "../../services/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ErpDashboardHome.css";
// import useAlertsSocket from "../../hooks/useAlertsSocket";

// ثوابت خارج المكون
const PRIORITY_MAP = { high: 3, medium: 2, low: 1 };

// دالة مساعدة لحساب hash بسيط للـ data (بدل JSON.stringify)
const getDataHash = (data) => {
  if (!data) return "";
  const alerts = data.reminders?.alerts || [];
  const kpis = data.kpis || {};
  return (
    alerts.map((a) => `${a.id}-${a.priority}`).join("|") +
    `-${kpis.today_appointments_count}-${kpis.today_revenue}`
  );
};

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [hiddenAlerts, setHiddenAlerts] = useState(new Set());
  const [activityLogs, setActivityLogs] = useState([]);
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());

  const isFetching = useRef(false);
  const pollingTimeout = useRef(null);
  const intervalTime = useRef(15000);
  const dataRef = useRef(null);
  const isMounted = useRef(true);
  const dataHashRef = useRef("");
  const acknowledgingRef = useRef(new Set());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good Morning");
    if (hour < 18) return t("Good Afternoon");
    return t("Good Evening");
  };

  const loadDashboard = async (silent = false) => {
    console.log("=== loadDashboard ===", {
      silent,
      isMounted: isMounted.current,
    });

    try {
      if (!silent) setLoading(true);

      console.log("Fetching /erp/dashboard...");
      const res = await axios.get("/erp/dashboard");
      console.log("Response status:", res.status);
      console.log("Response data:", res.data);

      let newData = res.data?.data ?? null;
      console.log("Extracted newData:", newData);

      if (newData?.reminders?.alerts) {
        console.log(
          "Processing alerts, count:",
          newData.reminders.alerts.length,
        );
        const processedAlerts = newData.reminders.alerts
          .filter(
            (a, index, self) => index === self.findIndex((x) => x.id === a.id),
          )
          .sort(
            (a, b) =>
              (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0),
          )
          .slice(0, 10);

        newData = {
          ...newData,
          reminders: {
            ...(newData.reminders || {}),
            alerts: processedAlerts,
          },
        };
        console.log("Processed alerts count:", processedAlerts.length);
      }

      if (isMounted.current) {
        console.log("Setting data...");
        setData(newData);
        dataRef.current = newData;
        dataHashRef.current = getDataHash(newData);
        console.log("Data set successfully");
      }

      return newData;
    } catch (err) {
      console.error("ERROR in loadDashboard:", err);
      console.error("Error response:", err?.response);

      if (!silent && isMounted.current) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load ERP dashboard.");
        console.error("Setting error message:", errorMsg);
        setError(errorMsg);
      }
      return null;
    } finally {
      if (!silent && isMounted.current) {
        console.log("Setting loading to false");
        setLoading(false);
      }
    }
  };

  const acknowledge = async (id) => {
    if (acknowledgingRef.current.has(id)) return;
    acknowledgingRef.current.add(id);

    setAcknowledgingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await axios.post(`/alerts/${id}/ack`);

      setData((prev) => {
        if (!prev) return prev;

        const alerts = prev.reminders?.alerts ?? [];
        const updated = {
          ...prev,
          reminders: {
            ...(prev.reminders || {}),
            alerts: alerts.filter((a) => a.id !== id),
          },
        };
        dataRef.current = updated;
        dataHashRef.current = getDataHash(updated);
        return updated;
      });
    } catch (e) {
      console.error("Failed to acknowledge alert", e);
    } finally {
      setAcknowledgingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const loadActivityLogs = async () => {
    console.log("=== loadActivityLogs ===");
    if (!isMounted.current) return;

    try {
      console.log("Fetching /erp/activity-logs?limit=5...");
      const res = await axios.get("/erp/activity-logs?limit=5");
      console.log("Activity logs response:", res.status, res.data);

      if (isMounted.current) {
        setActivityLogs(res.data?.data || []);
        console.log("Activity logs set, count:", res.data?.data?.length);
      }
    } catch (e) {
      console.error("Error loading activity logs:", e);
      setActivityLogs([]);
    }
  };

  const startPolling = useCallback(() => {
    console.log("startPolling called");

    const poll = async () => {
      if (isFetching.current) {
        console.log("Poll: already fetching, waiting...");
        pollingTimeout.current = setTimeout(poll, intervalTime.current);
        return;
      }

      isFetching.current = true;
      console.log("Poll: fetching data...");

      if (document.visibilityState === "visible") {
        const prevHash = dataHashRef.current;
        console.log("Poll: prevHash:", prevHash);

        const newDashboardData = await loadDashboard(true);
        await loadActivityLogs();

        const newHash = getDataHash(newDashboardData);
        console.log("Poll: newHash:", newHash);

        if (prevHash === newHash) {
          intervalTime.current = Math.min(intervalTime.current + 5000, 60000);
          console.log(
            "Poll: No changes, interval increased to:",
            intervalTime.current,
          );
        } else {
          intervalTime.current = 15000;
          console.log(
            "Poll: Changes detected, interval reset to:",
            intervalTime.current,
          );
        }
      }

      isFetching.current = false;
      pollingTimeout.current = setTimeout(poll, intervalTime.current);
    };

    poll();
  }, [loadDashboard, loadActivityLogs]);

  const handleNewAlert = useCallback((newAlert) => {
    console.log("New alert received:", newAlert);
    setData((prev) => {
      if (!prev) return prev;

      const currentAlerts = prev.reminders?.alerts || [];

      let updatedAlerts = [
        newAlert,
        ...currentAlerts.filter((a) => a.id !== newAlert.id),
      ];

      updatedAlerts = updatedAlerts
        .sort(
          (a, b) =>
            (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0),
        )
        .slice(0, 10);

      const updated = {
        ...prev,
        reminders: {
          ...(prev.reminders || {}),
          alerts: updatedAlerts,
        },
      };
      dataRef.current = updated;
      dataHashRef.current = getDataHash(updated);
      return updated;
    });
  }, []);

  // useAlertsSocket(handleNewAlert); // معلق مؤقتاً

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

  useEffect(() => {
    console.log("=== useEffect INITIALIZATION ===");

    const init = async () => {
      console.log("Init: loading dashboard...");
      await loadDashboard();
      console.log("Init: dashboard loaded");

      console.log("Init: loading activity logs...");
      await loadActivityLogs();
      console.log("Init: activity logs loaded");

      console.log("Init: setting greeting...");
      setGreeting(getGreeting());

      console.log("Init: starting polling...");
      startPolling();
      console.log("Init: polling started");
    };

    init();

    const greetingInterval = setInterval(() => {
      console.log("Updating greeting...");
      setGreeting(getGreeting());
    }, 60000);

    return () => {
      console.log("=== CLEANUP ===");
      isMounted.current = false;
      clearInterval(greetingInterval);

      if (pollingTimeout.current) {
        clearTimeout(pollingTimeout.current);
      }
    };
  }, [startPolling]);

  // ========================= Helpers =========================
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

  const formatTime = (value) => {
    if (!value) return "-";
    try {
      return String(value).slice(0, 5);
    } catch {
      return value;
    }
  };

  // ========================= UI =========================
  console.log(
    "UI Render - loading:",
    loading,
    "error:",
    error,
    "hasData:",
    !!data,
  );

  if (loading) {
    console.log("Showing loading screen");
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
    console.log("Showing error screen:", error);
    return (
      <div className="dashboard-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{t("Something went wrong")}</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={() => loadDashboard()}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  if (!data) {
    console.log("Showing no data screen");
    return (
      <div className="dashboard-empty">
        <i className="fas fa-chart-line"></i>
        <h3>{t("No Data Available")}</h3>
        <p>{t("No dashboard data available.")}</p>
      </div>
    );
  }

  console.log("Showing dashboard with data");
  const kpis = data.kpis || {};
  const recentAppointments = data.recent_appointments || [];
  const recentInvoices = data.recent_invoices || [];
  const recentPayments = data.recent_payments || [];
  const reminderStats = data.reminders?.stats || {};
  const failedReminders = data.reminders?.failed_recent || [];
  const alerts = data.reminders?.alerts || [];

  const visibleAlerts = alerts.filter((a) => !hiddenAlerts.has(a.id));
  const totalRevenue = (kpis.today_revenue || 0) + (kpis.month_revenue || 0);
  const completionRate = kpis.today_appointments_count
    ? Math.round(
        (kpis.completed_today_count / kpis.today_appointments_count) * 100,
      )
    : 0;

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
          {visibleAlerts.map((alert) => (
            <div key={alert.id} className={`alert-card alert-${alert.type}`}>
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
                onClick={() =>
                  setHiddenAlerts((prev) => {
                    const next = new Set(prev);
                    next.add(alert.id);
                    return next;
                  })
                }
              >
                <i className="fas fa-times"></i>
              </button>
              <button
                className="alert-ack"
                disabled={acknowledgingIds.has(alert.id)}
                onClick={() => acknowledge(alert.id)}
              >
                {acknowledgingIds.has(alert.id) ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-check"></i>
                )}
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
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon warning">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{reminderStats.pending ?? 0}</span>
            <span className="stat-label">{t("Pending Reminders")}</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon info">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.total_patients ?? 0}</span>
            <span className="stat-label">{t("Total Patients")}</span>
          </div>
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
        />
        <KpiCard
          title={t("Scheduled Today")}
          value={kpis.scheduled_today_count ?? 0}
          icon="fas fa-clock"
          color="info"
        />
        <KpiCard
          title={t("Completed Today")}
          value={kpis.completed_today_count ?? 0}
          icon="fas fa-check-circle"
          color="success"
        />
        <KpiCard
          title={t("Cancelled / No Show")}
          value={`${kpis.cancelled_today_count ?? 0} / ${kpis.no_show_today_count ?? 0}`}
          icon="fas fa-times-circle"
          color="danger"
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

// KpiCard Component
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

// StatusBadge Component
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
