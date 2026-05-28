import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../services/axios";
import { PRIORITY_MAP, getDashboardKey } from "./constants";
import { useAlertActions } from "../../../context/AlertContext";
import useAlertsSocket from "../../../hooks/useAlertsSocket";
import toast from "react-hot-toast";

export function useDashboardData(branchId, range, showComparison) {
  const queryClient = useQueryClient();
  const { addAlert, markAllAsRead } = useAlertActions();
  const [hiddenAlerts, setHiddenAlerts] = useState(new Set());
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());
  const [focusRange, setFocusRange] = useState(null);
  const acknowledgingRef = useRef(new Set());
  const buffer = useRef([]);
  const audioRef = useRef(null);
  const autoFocusedRef = useRef(false); // لمنع إعادة التركيز التلقائي بعد تدخل المستخدم

  // تثبيت المفتاح لتجنب إعادة إنشائه كل render
  const dashboardKey = useMemo(
    () => getDashboardKey(branchId, range, showComparison),
    [branchId, range, showComparison],
  );

  // ---- Dashboard query (إعدادات محسّنة للكاش) ----
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardKey,
    queryFn: async ({ signal }) => {
      const res = await axios.get(
        `/erp/dashboard?branchId=${branchId}&range=${range}&compare=${showComparison}`,
        { signal },
      );
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
          reminders: { ...(newData.reminders || {}), alerts: processedAlerts },
        };
      }
      return newData;
    },
    placeholderData: undefined,
    staleTime: 30_000, // 30 ثانية قبل اعتبار البيانات قديمة
    gcTime: 5 * 60 * 1000, // 5 دقائق للاحتفاظ بالكاش بعد unmount
    refetchOnWindowFocus: false, // لا إعادة جلب تلقائي عند التركيز لأن الـ socket يقوم بالتحديث
    refetchInterval: false,
  });

  // ---- Activity logs query ----
  const activityLogsKey = useMemo(() => ["activityLogs", branchId], [branchId]);
  const { data: activityLogs = [] } = useQuery({
    queryKey: activityLogsKey,
    queryFn: async ({ signal }) => {
      const res = await axios.get(
        `/erp/activity-logs?branchId=${branchId}&limit=5`,
        { signal },
      );
      return res.data?.data || [];
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // ---- Acknowledge mutation ----
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => axios.post(`/erp/alerts/${id}/ack`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: dashboardKey });
      const prev = queryClient.getQueryData(dashboardKey);
      queryClient.setQueryData(dashboardKey, (old) => {
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
      queryClient.setQueryData(dashboardKey, context.prev);
      console.error("Failed to acknowledge alert", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKey });
    },
  });

  const acknowledge = useCallback(
    (id) => {
      if (acknowledgingRef.current.has(id)) return;
      acknowledgingRef.current.add(id);
      setAcknowledgingIds((prev) => new Set([...prev, id]));
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
    },
    [acknowledgeMutation],
  );

  // ---- Play sound helper مع guard للمتصفح ----
  const playSound = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
    }
    audioRef.current?.play().catch(() => {});
  }, []);

  // ---- تحديث لحظي: buffer و flush (يُحدّث الحقل الصحيح kpis.revenue.current) ----
  const flushUpdates = useCallback(() => {
    if (buffer.current.length === 0) return;
    queryClient.setQueryData(dashboardKey, (old) => {
      if (!old) return old;
      const kpis = { ...old.kpis };
      let totalRevenue = 0;
      buffer.current.forEach((event) => {
        if (event.type === "payment_created") {
          totalRevenue += event.data?.today_revenue || 0;
        }
      });
      if (totalRevenue > 0 && kpis.revenue) {
        kpis.revenue = {
          ...kpis.revenue,
          current: (kpis.revenue.current || 0) + totalRevenue,
        };
      }
      return { ...old, kpis };
    });
    buffer.current = [];
  }, [queryClient, dashboardKey]);

  useEffect(() => {
    const interval = setInterval(flushUpdates, 2000);
    return () => clearInterval(interval);
  }, [flushUpdates]);

  // ---- WebSocket handlers ----
  const handleNewAlert = useCallback(
    (newAlert) => {
      if (document.visibilityState === "visible") playSound();
      addAlert(newAlert);
      queryClient.setQueryData(dashboardKey, (old) => {
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
          reminders: { ...old.reminders, alerts: updatedAlerts },
        };
      });
      // إضافة id لمنع تراكم التوست
      toast.custom(
        (t) => (
          <div className="custom-toast">
            <strong>{newAlert.priority.toUpperCase()}</strong>
            <p>{newAlert.message}</p>
          </div>
        ),
        { id: `alert-${newAlert.id}` },
      );
    },
    [addAlert, playSound, queryClient, dashboardKey],
  );

  const handleDashboardEvent = useCallback(
    (event) => {
      if (range !== "day") return;
      queryClient.setQueryData(dashboardKey, (old) => {
        if (!old) return old;
        const kpis = { ...old.kpis };

        switch (event.type) {
          case "appointment_created":
            if (kpis.appointments)
              kpis.appointments = {
                ...kpis.appointments,
                current: (kpis.appointments.current || 0) + 1,
              };
            break;
          case "appointment_completed":
            if (kpis.completed_appointments)
              kpis.completed_appointments = {
                ...kpis.completed_appointments,
                current: (kpis.completed_appointments.current || 0) + 1,
              };
            if (kpis.appointments)
              kpis.appointments = {
                ...kpis.appointments,
                current: Math.max(0, (kpis.appointments.current || 0) - 1),
              };
            break;
          case "appointment_cancelled":
            if (kpis.cancelled_appointments)
              kpis.cancelled_appointments = {
                ...kpis.cancelled_appointments,
                current: (kpis.cancelled_appointments.current || 0) + 1,
              };
            if (kpis.appointments)
              kpis.appointments = {
                ...kpis.appointments,
                current: Math.max(0, (kpis.appointments.current || 0) - 1),
              };
            break;
          case "appointment_no_show":
            if (kpis.no_show_appointments)
              kpis.no_show_appointments = {
                ...kpis.no_show_appointments,
                current: (kpis.no_show_appointments.current || 0) + 1,
              };
            if (kpis.appointments)
              kpis.appointments = {
                ...kpis.appointments,
                current: Math.max(0, (kpis.appointments.current || 0) - 1),
              };
            break;
          case "payment_created":
            if (kpis.revenue)
              kpis.revenue = {
                ...kpis.revenue,
                current:
                  (kpis.revenue.current || 0) +
                  (event.data?.today_revenue || 0),
              };
            break;
          case "invoice_paid":
            if (kpis.paid_invoices)
              kpis.paid_invoices = {
                ...kpis.paid_invoices,
                current: (kpis.paid_invoices.current || 0) + 1,
              };
            if (kpis.unpaid_invoices)
              kpis.unpaid_invoices = {
                ...kpis.unpaid_invoices,
                current: Math.max(0, (kpis.unpaid_invoices.current || 0) - 1),
              };
            break;
          default:
            return old;
        }
        return { ...old, kpis };
      });
    },
    [queryClient, dashboardKey, range],
  );

  const handleNewInsight = useCallback(
    (insight) => {
      if (insight.priority === "high") {
        playSound();
        toast.custom(
          (toastInstance) => (
            <div className="custom-toast toast-high">
              <strong>🔔 Smart Insight</strong>
              <p>{insight.message}</p>
            </div>
          ),
          { id: `insight-${insight.id || Date.now()}` },
        );
      }
      queryClient.setQueryData(dashboardKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          insights: [insight, ...(old.insights || [])].slice(0, 5),
        };
      });
    },
    [playSound, queryClient, dashboardKey],
  );

  const socketHandler = useCallback(
    (payload) => {
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
    },
    [handleNewInsight, handleNewAlert, handleDashboardEvent],
  );

  useAlertsSocket(socketHandler);

  // ---- Clean hiddenAlerts ----
  useEffect(() => {
    const alerts = dashboard?.reminders?.alerts || [];
    setHiddenAlerts((prev) => {
      const next = new Set();
      alerts.forEach((a) => {
        if (prev.has(a.id)) next.add(a.id);
      });
      return next;
    });
  }, [dashboard?.reminders?.alerts]);

  // ---- Anomaly maps ----
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

  // ---- Chart data ----
  const revenueChartData = useMemo(
    () =>
      (dashboard?.charts?.revenue || []).map((item) => ({
        label: item.label,
        value: item.current,
        date: item.label,
        anomaly: null,
      })),
    [dashboard],
  );

  const previousRevenueData = useMemo(
    () =>
      (dashboard?.charts?.revenue || []).map((item) => ({
        label: item.label,
        value: item.previous,
        date: item.label,
        anomaly: null,
      })),
    [dashboard],
  );

  const mergedRevenueData = useMemo(() => {
    const maxLen = Math.max(
      revenueChartData.length,
      previousRevenueData.length,
    );
    const merged = [];
    for (let i = 0; i < maxLen; i++) {
      const cur = revenueChartData[i];
      const prev = previousRevenueData[i];
      merged.push({
        label: cur?.label || prev?.label || `#${i + 1}`,
        date: cur?.date || prev?.date,
        current: cur?.value || 0,
        previous: prev?.value || 0,
        anomaly: null,
      });
    }
    return merged;
  }, [revenueChartData, previousRevenueData]);

  const revenueDataWithAnomalies = useMemo(
    () =>
      mergedRevenueData.map((point) => {
        const anomaly = revenueAnomalyPoints.find((a) => a.date === point.date);
        return { ...point, anomaly: anomaly || null };
      }),
    [mergedRevenueData, revenueAnomalyPoints],
  );

  const visibleRevenueData = useMemo(() => {
    return focusRange
      ? revenueDataWithAnomalies.slice(focusRange[0], focusRange[1])
      : revenueDataWithAnomalies;
  }, [focusRange, revenueDataWithAnomalies]);

  // تأثير تعيين focusRange تلقائياً عند وجود anomalies، مع منع التكرار بعد تدخل المستخدم
  useEffect(() => {
    if (autoFocusedRef.current) return; // توقف تلقائي بعد أول manual interaction
    if (!revenueAnomalyPoints.length) {
      setFocusRange(null);
      return;
    }
    const latest = revenueAnomalyPoints[0];
    const index = mergedRevenueData.findIndex((d) => d.date === latest.date);
    if (index === -1) return;
    const start = Math.max(index - 3, 0);
    const end = Math.min(index + 4, mergedRevenueData.length);
    setFocusRange([start, end]);
    autoFocusedRef.current = true; // تم التركيز التلقائي مرة واحدة
  }, [revenueAnomalyPoints, mergedRevenueData]);

  // عند إعادة تعيين المستخدم للـ focusRange، نسمح بإعادة التركيز التلقائي مرة أخرى لاحقاً
  const handleSetFocusRange = useCallback((value) => {
    if (value === null) {
      autoFocusedRef.current = false; // أعد السماح بالتركيز التلقائي
    }
    setFocusRange(value);
  }, []);

  const appointmentsChartData = useMemo(
    () =>
      (dashboard?.charts?.appointments || []).map((item) => ({
        label: item.label,
        date: item.label,
        total: item.current,
        completed: item.completed || 0,
        cancelled: item.cancelled || 0,
        previous: item.previous || 0,
        anomaly: null,
      })),
    [dashboard],
  );

  const appointmentsDataWithAnomalies = useMemo(
    () =>
      appointmentsChartData.map((point) => {
        const anomaly = appointmentsAnomalyPoints.find(
          (a) => a.date === point.date,
        );
        return { ...point, anomaly: anomaly || null };
      }),
    [appointmentsChartData, appointmentsAnomalyPoints],
  );

  return {
    dashboard,
    isLoading,
    error,
    refetch,
    activityLogs,
    acknowledge,
    acknowledgingIds,
    hiddenAlerts,
    setHiddenAlerts,
    markAllAsRead,
    focusRange,
    setFocusRange: handleSetFocusRange, // نمرر الدالة المخصصة
    visibleRevenueData,
    appointmentsDataWithAnomalies,
    playSound,
  };
}
