import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "../../services/axios";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import "./ErpDashboardHome.css";
import useAlertsSocket from "../../hooks/useAlertsSocket";
import { useAlertActions } from "../../context/AlertContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ثوابت خارج المكون
const PRIORITY_MAP = { high: 3, medium: 2, low: 1 };
const getAnomalyColor = (priority) => {
  switch (priority) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    default:
      return "#eab308";
  }
};

export default function ErpDashboardHome() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { addAlert, markAllAsRead } = useAlertActions();
  const navigate = useNavigate();

  // ========================= State =========================
  const [greeting, setGreeting] = useState("");
  const [hiddenAlerts, setHiddenAlerts] = useState(new Set());
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());
  const [focusRange, setFocusRange] = useState(null);
  const [range, setRange] = useState("day");
  const [showComparison, setShowComparison] = useState(() => {
    // Load from localStorage (optional)
    const saved = localStorage.getItem("showComparison");
    return saved === "true";
  });
  // ========================= Refs =========================
  const acknowledgingRef = useRef(new Set());
  const buffer = useRef([]);
  const chartRef = useRef(null);

  // ========================= Queries =========================
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard", range, "compare"], // ✅ إضافة compare للـ queryKey
    queryFn: async () => {
      const res = await axios.get(`/erp/dashboard?range=${range}&compare=true`);
      let newData = res.data?.data ?? null;

      if (newData?.reminders?.alerts) {
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
      }

      return newData;
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: async () => {
      const res = await axios.get("/erp/activity-logs?limit=5");
      return res.data?.data || [];
    },
    refetchInterval: 30000,
  });

  // ========================= Mutations =========================
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => axios.post(`/erp/alerts/${id}/ack`),
    onMutate: async (id) => {
      await queryClient.cancelQueries(["dashboard"]);
      const prev = queryClient.getQueryData(["dashboard"]);
      queryClient.setQueryData(["dashboard"], (old) => {
        if (!old) return old;
        return {
          ...old,
          reminders: {
            ...old.reminders,
            alerts: old.reminders?.alerts?.filter((a) => a.id !== id) || [],
          },
        };
      });
      return { prev };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["dashboard"], context.prev);
      console.error("Failed to acknowledge alert", err);
    },
  });

  // ========================= Handlers =========================
  const acknowledge = (id) => {
    if (acknowledgingRef.current.has(id)) return;
    acknowledgingRef.current.add(id);

    setAcknowledgingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    acknowledgeMutation.mutate(id, {
      onSettled: () => {
        setAcknowledgingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        acknowledgingRef.current.delete(id);
      },
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Good Morning");
    if (hour < 18) return t("Good Afternoon");
    return t("Good Evening");
  };

  const playSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {});
  };

  // ========================= Socket Handlers =========================
  const handleNewAlert = useCallback(
    (newAlert) => {
      if (document.visibilityState === "visible") playSound();
      addAlert(newAlert);

      queryClient.setQueryData(["dashboard"], (old) => {
        if (!old) return old;
        const currentAlerts = old.reminders?.alerts || [];
        let updatedAlerts = [
          newAlert,
          ...currentAlerts.filter((a) => a.id !== newAlert.id),
        ]
          .sort(
            (a, b) =>
              (PRIORITY_MAP[b.priority] || 0) - (PRIORITY_MAP[a.priority] || 0),
          )
          .slice(0, 10);

        return {
          ...old,
          reminders: {
            ...old.reminders,
            alerts: updatedAlerts,
          },
        };
      });

      toast.custom((t) => (
        <div className="custom-toast">
          <strong>{newAlert.priority.toUpperCase()}</strong>
          <p>{newAlert.message}</p>
        </div>
      ));
    },
    [addAlert, queryClient],
  );

  const handleDashboardEvent = useCallback(
    (event) => {
      if (range !== "day") return;
      queryClient.setQueryData(["dashboard", "day"], (old) => {
        if (!old) return old;
        const kpis = { ...old.kpis };

        switch (event.type) {
          case "appointment_created":
            kpis.today_appointments_count =
              (kpis.today_appointments_count || 0) + 1;
            kpis.scheduled_today_count = (kpis.scheduled_today_count || 0) + 1;
            break;
          case "appointment_completed":
            kpis.completed_today_count = (kpis.completed_today_count || 0) + 1;
            kpis.scheduled_today_count = Math.max(
              0,
              (kpis.scheduled_today_count || 0) - 1,
            );
            break;
          case "appointment_cancelled":
            kpis.cancelled_today_count = (kpis.cancelled_today_count || 0) + 1;
            kpis.scheduled_today_count = Math.max(
              0,
              (kpis.scheduled_today_count || 0) - 1,
            );
            break;
          case "appointment_no_show":
            kpis.no_show_today_count = (kpis.no_show_today_count || 0) + 1;
            kpis.scheduled_today_count = Math.max(
              0,
              (kpis.scheduled_today_count || 0) - 1,
            );
            break;
          case "payment_created":
            kpis.today_revenue =
              (kpis.today_revenue || 0) + (event.data?.today_revenue || 0);
            kpis.month_revenue =
              (kpis.month_revenue || 0) + (event.data?.month_revenue || 0);
            break;
          case "invoice_paid":
            kpis.paid_invoices_count = (kpis.paid_invoices_count || 0) + 1;
            kpis.unpaid_invoices_count = Math.max(
              0,
              (kpis.unpaid_invoices_count || 0) - 1,
            );
            break;
          default:
            return old;
        }
        return { ...old, kpis };
      });
    },
    [queryClient, range], // ✅ أضف range هنا
  );

  const handleNewInsight = useCallback(
    (insight) => {
      if (insight.priority === "high") {
        playSound();
        toast.custom((toastInstance) => (
          <div className="custom-toast toast-high">
            <strong>🔔 {t("Smart Insight")}</strong>
            <p>{t(insight.message)}</p>
          </div>
        ));
      }
      queryClient.setQueryData(["dashboard"], (old) => {
        if (!old) return old;
        return {
          ...old,
          insights: [insight, ...(old.insights || [])].slice(0, 5),
        };
      });
    },
    [queryClient, t],
  );

  const flushUpdates = useCallback(() => {
    if (buffer.current.length === 0) return;
    queryClient.setQueryData(["dashboard"], (old) => {
      if (!old) return old;
      const kpis = { ...old.kpis };
      let totalRevenue = 0;
      buffer.current.forEach((event) => {
        if (event.type === "payment_created") {
          totalRevenue += event.data?.today_revenue || 0;
        }
      });
      if (totalRevenue > 0) {
        kpis.today_revenue = (kpis.today_revenue || 0) + totalRevenue;
        kpis.month_revenue = (kpis.month_revenue || 0) + totalRevenue;
      }
      return { ...old, kpis };
    });
    buffer.current = [];
  }, [queryClient]);

  // ========================= Effects =========================
  useEffect(() => {
    if (focusRange && chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusRange]);

  useEffect(() => {
    const interval = setInterval(flushUpdates, 2000);
    return () => clearInterval(interval);
  }, [flushUpdates]);

  useEffect(() => {
    setGreeting(getGreeting());
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(greetingInterval);
  }, []);

  useEffect(() => {
    localStorage.setItem("showComparison", showComparison);
  }, [showComparison]);

  // ========================= Socket =========================
  useAlertsSocket((payload) => {
    if (payload.type === "insight" || payload.insight) {
      handleNewInsight(payload.insight || payload);
    }
    if (payload.alert || payload.type === "alert") {
      handleNewAlert(payload.alert || payload.data);
    }
    if (
      payload.type === "appointment_created" ||
      payload.type === "appointment_completed" ||
      payload.type === "appointment_cancelled" ||
      payload.type === "appointment_no_show" ||
      payload.type === "payment_created" ||
      payload.type === "invoice_paid"
    ) {
      handleDashboardEvent(payload);
    }
  });

  // ========================= Memoized Values (قبل الـ early returns) =========================
  const revenueAnomalyPoints = useMemo(() => {
    const insights = dashboard?.insights || [];
    return insights
      .filter((i) => i.category === "revenue" && i.point)
      .map((i) => ({ ...i.point, message: i.message, priority: i.priority }));
  }, [dashboard]);

  const appointmentsAnomalyPoints = useMemo(() => {
    const insights = dashboard?.insights || [];
    return insights
      .filter((i) => i.category === "appointments" && i.point)
      .map((i) => ({ ...i.point, message: i.message, priority: i.priority }));
  }, [dashboard]);

  // ========================= Memoized Values =========================

  const revenueChartData = useMemo(() => {
    // الـ API بيرجع array فيها current و previous جاهزة
    const revenueData = dashboard?.charts?.revenue || [];

    // حولها للشكل المطلوب للـ chart
    return revenueData.map((item) => ({
      label: item.label,
      value: item.current, // current هو اللي يظهر كـ value
      date: item.label,
      anomaly: null,
    }));
  }, [dashboard]);

  const previousRevenueData = useMemo(() => {
    const revenueData = dashboard?.charts?.revenue || [];

    return revenueData.map((item) => ({
      label: item.label,
      value: item.previous,
      date: item.label,
      anomaly: null,
    }));
  }, [dashboard]);

  const mergedRevenueData = useMemo(() => {
    if (!revenueChartData.length && !previousRevenueData.length) return [];

    const maxLength = Math.max(
      revenueChartData.length,
      previousRevenueData.length,
    );
    const merged = [];

    for (let i = 0; i < maxLength; i++) {
      const currentPoint = revenueChartData[i];
      const previousPoint = previousRevenueData[i];

      merged.push({
        label: currentPoint?.label || previousPoint?.label || `#${i + 1}`,
        date: currentPoint?.date || previousPoint?.date,
        current: currentPoint?.value || 0,
        previous: previousPoint?.value || 0,
        // الحفاظ على anomaly من current إذا وجد
        anomaly: currentPoint?.anomaly || null,
      });
    }

    return merged;
  }, [revenueChartData, previousRevenueData]);

  const revenueDataWithAnomalies = useMemo(() => {
    return mergedRevenueData.map((point) => {
      const anomaly = revenueAnomalyPoints.find((a) => a.date === point.date);
      return { ...point, anomaly: anomaly || null };
    });
  }, [mergedRevenueData, revenueAnomalyPoints]);

  const visibleRevenueData = useMemo(() => {
    return focusRange
      ? revenueDataWithAnomalies.slice(focusRange[0], focusRange[1])
      : revenueDataWithAnomalies;
  }, [focusRange, revenueDataWithAnomalies]);

  const appointmentsChartData = useMemo(() => {
    const appointmentsData = dashboard?.charts?.appointments || [];

    return appointmentsData.map((item) => ({
      label: item.label,
      total: item.current, // current = total appointments
      completed: item.completed || 0, // لو موجود
      cancelled: item.cancelled || 0, // لو موجود
      previous: item.previous || 0,
      anomaly: null,
    }));
  }, [dashboard]);

  const appointmentsDataWithAnomalies = useMemo(() => {
    return appointmentsChartData.map((point) => {
      const anomaly = appointmentsAnomalyPoints.find(
        (a) => a.date === point.date,
      );
      return { ...point, anomaly: anomaly || null };
    });
  }, [appointmentsChartData, appointmentsAnomalyPoints]);

  // ========================= Update focusRange effect =========================

  useEffect(() => {
    if (!revenueAnomalyPoints.length) {
      setFocusRange(null);
      return;
    }
    const latest = revenueAnomalyPoints[0];
    // ✅ تعديل البحث في mergedRevenueData بدل revenueChartData
    const index = mergedRevenueData.findIndex((d) => d.date === latest.date);
    if (index === -1) return;
    const start = Math.max(index - 3, 0);
    const end = Math.min(index + 4, mergedRevenueData.length);
    setFocusRange([start, end]);
  }, [revenueAnomalyPoints, mergedRevenueData]);

  // ========================= Helpers =========================
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
    if (type === "Payment") return t("New payment recorded");
    if (type === "Customer") return t("Customer updated");
    return `${type} ${action}`;
  };

  const AnimatedDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.anomaly) return null;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={8}
          className="pulse-dot"
          fill={getAnomalyColor(payload.anomaly.priority)}
        />
        <text
          x={cx}
          y={cy - 12}
          fontSize="12"
          textAnchor="middle"
          fill={getAnomalyColor(payload.anomaly.priority)}
        >
          ⚠️
        </text>
      </g>
    );
  };

  // const CustomTooltip = ({ active, payload }) => {
  //   if (!active || !payload?.length) return null;
  //   const data = payload[0].payload;
  //   return (
  //     <div className="custom-tooltip">
  //       <p className="tooltip-value">
  //         {new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
  //           style: "currency",
  //           currency: "EGP",
  //         }).format(data.value || 0)}
  //       </p>
  //       {data.anomaly && (
  //         <div
  //           className="tooltip-anomaly"
  //           style={{ borderColor: getAnomalyColor(data.anomaly.priority) }}
  //         >
  //           <span className="anomaly-icon">⚠️</span>
  //           <span className="anomaly-message">{t(data.anomaly.message)}</span>
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

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

  const calculateChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const generateSummary = (kpis) => {
    const messages = [];
    const priorityOrder = { negative: 3, warning: 2, positive: 1 };

    // Revenue Rules
    const revenueDelta = kpis.revenue?.delta || 0;
    if (revenueDelta > 10) {
      messages.push({ type: "positive", message: t("summary_revenue_up") });
    } else if (revenueDelta < -10) {
      messages.push({ type: "negative", message: t("summary_revenue_down") });
    }

    // Appointments Rules
    const appointmentsDelta = kpis.appointments?.delta || 0;
    if (appointmentsDelta > 15) {
      messages.push({
        type: "positive",
        message: t("summary_appointments_up"),
      });
    }

    // No-show Rules
    const noShowCount = kpis.no_show_appointments?.current || 0;
    if (noShowCount > 5) {
      messages.push({ type: "warning", message: t("summary_no_show_high") });
    }

    // Unpaid Invoices Rules
    const unpaidCount = kpis.unpaid_invoices?.current || 0;
    if (unpaidCount > 10) {
      messages.push({ type: "warning", message: t("summary_unpaid_high") });
    }

    // Cancellation Rules
    const cancelledDelta = kpis.cancelled_appointments?.delta || 0;
    if (cancelledDelta > 20) {
      messages.push({ type: "warning", message: t("summary_cancelled_up") });
    }

    return messages
      .sort((a, b) => priorityOrder[b.type] - priorityOrder[a.type])
      .slice(0, 3);
  };

  const summaryMessages = useMemo(() => {
    const kpis = dashboard?.kpis;
    if (!kpis) return [];
    return generateSummary(kpis);
  }, [dashboard?.kpis, t]);

  // ========================= Early Returns =========================
  if (isLoading) {
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
        <p>{error.message}</p>
        <button className="btn-retry" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-empty">
        <i className="fas fa-chart-line"></i>
        <h3>{t("No Data Available")}</h3>
        <p>{t("No dashboard data available.")}</p>
      </div>
    );
  }

  // ========================= Data Extraction (بعد الـ early returns) =========================
  const kpis = dashboard.kpis || {};
  const recentAppointments = dashboard.recent_appointments || [];
  const recentInvoices = dashboard.recent_invoices || [];
  const recentPayments = dashboard.recent_payments || [];
  const reminderStats = dashboard.reminders?.stats || {};
  const failedReminders = dashboard.reminders?.failed_recent || [];
  const alerts = dashboard.reminders?.alerts || [];
  const insights = dashboard.insights || [];
  const insightIconMap = {
    revenue: "💰",
    appointments: "📅",
    invoices: "🧾",
    patients: "👥",
  };

  const visibleAlerts = alerts.filter((a) => !hiddenAlerts.has(a.id));
  const totalRevenue = kpis.revenue?.current || 0;
  const completionRate = kpis.appointments?.current
    ? Math.round(
        (kpis.completed_appointments?.current / kpis.appointments?.current) *
          100,
      )
    : 0;

  // ========================= UI =========================
  return (
    <div className="erp-dashboard">
      {/* Welcome Header */}
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

      <div className="comparison-toggle-container">
        <div className="range-toggle">
          {["day", "week", "month"].map((r) => (
            <button
              key={r}
              className={`range-btn ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
            >
              {t(r)}
            </button>
          ))}
        </div>

        {/* ✅ Toggle Component */}
        <label className="comparison-toggle">
          <input
            type="checkbox"
            checked={showComparison}
            onChange={() => setShowComparison((prev) => !prev)}
          />
          <span>{t("Compare with previous period")}</span>
        </label>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-container" onClick={markAllAsRead}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setHiddenAlerts((prev) => {
                    const next = new Set(prev);
                    next.add(alert.id);
                    return next;
                  });
                }}
              >
                <i className="fas fa-times"></i>
              </button>
              <button
                className="alert-ack"
                disabled={acknowledgingIds.has(alert.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  acknowledge(alert.id);
                }}
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

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="insights-container">
          <div className="insights-header">
            <i className="fas fa-lightbulb"></i>
            <h4>{t("Smart Insights")}</h4>
          </div>
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`insight-card ${insight.priority} ${insight.action?.url ? "clickable" : ""}`}
              onClick={() => {
                if (insight.action?.url) {
                  navigate(insight.action.url);
                }
              }}
              style={{ cursor: insight.action?.url ? "pointer" : "default" }}
            >
              <div className="insight-icon">
                {insightIconMap[insight.category] || "📊"}
              </div>
              <div className="insight-content">
                <span className="insight-category">{t(insight.category)}</span>
                <p>{t(insight.message)}</p>
                {insight.action?.label && (
                  <span className="insight-action">
                    {t(insight.action.label)} →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SummaryCard messages={summaryMessages} t={t} />

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="stat-icon primary">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.appointments?.current ?? 0}
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
            <span className="stat-value">
              {kpis.total_patients?.current ?? 0}
            </span>
            <span className="stat-label">{t("Total Patients")}</span>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="section-header">
        <h2>{t("Key Performance Indicators")}</h2>
        <p>{t("Monitor your clinic's performance at a glance")}</p>
      </div>

      {/* ✅ استبدل كل اللي جوه kpis-grid ده */}
      <div className="kpis-grid">
        <KpiCard
          title={t("Revenue")}
          value={formatCurrency(kpis.revenue?.current || 0)}
          icon="fas fa-money-bill-wave"
          color="success"
          delta={kpis.revenue?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Appointments")}
          value={kpis.appointments?.current || 0}
          icon="fas fa-calendar-check"
          color="primary"
          delta={kpis.appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Completed")}
          value={kpis.completed_appointments?.current || 0}
          icon="fas fa-check-circle"
          color="info"
          delta={kpis.completed_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Cancelled")}
          value={kpis.cancelled_appointments?.current || 0}
          icon="fas fa-times-circle"
          color="danger"
          delta={kpis.cancelled_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("No Show")}
          value={kpis.no_show_appointments?.current || 0}
          icon="fas fa-user-slash"
          color="warning"
          delta={kpis.no_show_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Unpaid Invoices")}
          value={kpis.unpaid_invoices?.current || 0}
          icon="fas fa-file-invoice"
          color="danger"
          delta={kpis.unpaid_invoices?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Paid Invoices")}
          value={kpis.paid_invoices?.current || 0}
          icon="fas fa-check-double"
          color="success"
          delta={kpis.paid_invoices?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("New Patients")}
          value={kpis.total_patients?.current || 0}
          icon="fas fa-user-plus"
          color="primary"
          delta={kpis.total_patients?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/patients"
        />
      </div>

      {/* Charts Section */}
      <div className="section-header">
        <h2>{t("Analytics Overview")}</h2>
        <p>{t("Real-time insights at a glance")}</p>
      </div>
      <div className="charts-grid">
        <RevenueChart
          data={visibleRevenueData}
          t={t}
          formatCurrency={formatCurrency}
          // CustomTooltip={CustomTooltip}
          AnimatedDot={AnimatedDot}
          chartRef={chartRef}
          focusRange={focusRange}
          setFocusRange={setFocusRange}
          showComparison={showComparison} // ✅ أضف هذا
        />
        <AppointmentsChart
          data={appointmentsDataWithAnomalies}
          t={t}
          // CustomTooltip={CustomTooltip}
        />
      </div>

      {/* Recent Activity */}
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

      {/* Tables Grid */}
      <div className="tables-grid">
        {/* Recent Appointments */}
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

        {/* Recent Invoices */}
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

        {/* Recent Payments */}
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

        {/* Failed Reminders */}
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

// ========================= Sub-Components =========================
const CustomTooltipWrapper = ({ active, payload, formatCurrency, t }) => {
  if (!active || !payload?.length) return null;

  const currentValue = payload.find((p) => p.dataKey === "current")?.value || 0;
  const previousValue =
    payload.find((p) => p.dataKey === "previous")?.value || 0;
  const anomaly = payload[0]?.payload?.anomaly;

  // حساب التغير
  const change =
    previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Current")}:</span>
        <span className="tooltip-value">{formatCurrency(currentValue)}</span>
      </div>
      <div className="tooltip-previous">
        <span className="tooltip-label">{t("Previous")}:</span>
        <span className="tooltip-value">{formatCurrency(previousValue)}</span>
      </div>
      {previousValue > 0 && (
        <div
          className={`tooltip-change ${change >= 0 ? "positive" : "negative"}`}
        >
          <span className="tooltip-label">{t("Change")}:</span>
          <span className="tooltip-value">
            {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      )}
      {anomaly && (
        <div
          className="tooltip-anomaly"
          style={{ borderColor: getAnomalyColor(anomaly.priority) }}
        >
          <span className="anomaly-icon">⚠️</span>
          <span className="anomaly-message">{t(anomaly.message)}</span>
        </div>
      )}
    </div>
  );
};

function RevenueChart({
  data,
  t,
  formatCurrency,
  AnimatedDot,
  chartRef,
  focusRange,
  setFocusRange,
  showComparison, // ✅ أضف هذا
}) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <i className="fas fa-chart-line"></i>
          <h4>{t("Revenue Overview")}</h4>
        </div>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-card" ref={chartRef}>
      <div className="chart-header">
        <i className="fas fa-chart-line"></i>
        <h4>{t("Revenue Overview")}</h4>
      </div>

      {/* ✅ Legend متغير حسب showComparison */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color current"></span>
          <span>{t("Current Period")}</span>
        </div>
        {showComparison && (
          <div className="legend-item">
            <span className="legend-color previous"></span>
            <span>{t("Previous Period")}</span>
          </div>
        )}
        {data.some((d) => d.anomaly) && (
          <div className="legend-item">
            <span className="legend-color anomaly"></span>
            <span>{t("Anomaly Detected")}</span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            content={(props) => (
              <CustomTooltipWrapper
                {...props}
                formatCurrency={formatCurrency}
                t={t}
              />
            )}
          />
          {/* ✅ Current Line - Solid (دائماً موجود) */}
          <Line
            type="monotone"
            dataKey="current"
            stroke="#1a237e"
            strokeWidth={3}
            dot={<AnimatedDot />}
            isAnimationActive={true}
            animationDuration={500}
          />
          {/* ✅ Previous Line - Dashed (يظهر فقط عند تفعيل toggle) */}
          {showComparison && (
            <Line
              type="monotone"
              dataKey="previous"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={400}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {focusRange && (
        <button className="reset-view-btn" onClick={() => setFocusRange(null)}>
          <i className="fas fa-expand"></i> {t("Reset View")}
        </button>
      )}
    </div>
  );
}

function AppointmentsChart({ data, t }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <i className="fas fa-calendar-check"></i>
          <h4>{t("Appointments Overview")}</h4>
        </div>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <i className="fas fa-calendar-check"></i>
        <h4>{t("Appointments Overview")}</h4>
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color total"></span>
          <span>{t("Total Appointments")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color completed"></span>
          <span>{t("Completed")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color cancelled"></span>
          <span>{t("Cancelled")}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip content={<AppointmentsTooltip t={t} />} />
          <Bar dataKey="total" fill="#1a237e" radius={[8, 8, 0, 0]} />
          <Bar dataKey="completed" fill="#4caf50" radius={[8, 8, 0, 0]} />
          <Bar dataKey="cancelled" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Tooltip مخصص لـ Appointments
const AppointmentsTooltip = ({ active, payload, t }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Total")}:</span>
        <span className="tooltip-value">{payload[0]?.value || 0}</span>
      </div>
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Completed")}:</span>
        <span className="tooltip-value" style={{ color: "#4caf50" }}>
          {payload[1]?.value || 0}
        </span>
      </div>
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Cancelled")}:</span>
        <span className="tooltip-value" style={{ color: "#ef4444" }}>
          {payload[2]?.value || 0}
        </span>
      </div>
    </div>
  );
};

function KpiCard({
  title,
  value,
  icon,
  color = "primary",
  link,
  trend,
  delta,
  deltaLabel,
}) {
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
        {delta !== undefined && (
          <div className={`kpi-delta ${delta >= 0 ? "positive" : "negative"}`}>
            <i className={`fas fa-arrow-${delta >= 0 ? "up" : "down"}`}></i>
            <span>
              {Math.abs(delta).toFixed(1)}% {deltaLabel}
            </span>
          </div>
        )}
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

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <i className="fas fa-inbox empty-icon"></i>
      <p className="empty-text">{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
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
  return (
    <span className={`status-badge status-${statusInfo.class}`}>
      <span className="status-dot"></span>
      {t(statusInfo.label)}
    </span>
  );
}

function SummaryCard({ messages, t }) {
  if (!messages.length) return null;

  return (
    <div className="summary-card">
      <div className="summary-header">
        <span>🧠 {t("Smart Summary")}</span>
      </div>
      <div className="summary-body">
        {messages.map((msg, i) => (
          <div key={i} className={`summary-item ${msg.type}`}>
            <span className="icon">
              {msg.type === "positive" && "📈"}
              {msg.type === "negative" && "📉"}
              {msg.type === "warning" && "⚠️"}
            </span>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
