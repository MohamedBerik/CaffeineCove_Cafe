import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../services/axios";
import { PRIORITY_MAP, getDashboardKey } from "../constants";
import { useAlertActions } from "../../../../context/AlertContext";
import useAlertsSocket from "../../../../hooks/useAlertsSocket";
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
  const autoFocusedRef = useRef(false);

  // ---- refs للبيانات الحساسة لمنع stale closure ----
  const currentBranchRef = useRef(branchId);
  const dashboardKeyRef = useRef(
    getDashboardKey(branchId, range, showComparison),
  );

  useEffect(() => {
    currentBranchRef.current = branchId;
    dashboardKeyRef.current = getDashboardKey(branchId, range, showComparison);
  }, [branchId, range, showComparison]);

  // companyId تفاعلي
  const [companyId, setCompanyId] = useState(
    localStorage.getItem("selectedCompany") || null,
  );
  useEffect(() => {
    const sync = () =>
      setCompanyId(localStorage.getItem("selectedCompany") || null);
    window.addEventListener("storage", sync);
    window.addEventListener("companyChanged", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("companyChanged", sync);
    };
  }, []);

  const dashboardKey = useMemo(
    () => getDashboardKey(branchId, range, showComparison),
    [branchId, range, showComparison],
  );

  // ---- Dashboard query ----
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
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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

  // ---- تأثيرات صوتية ----
  const playSound = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
    }
    audioRef.current?.play().catch(() => {});
  }, []);

  // ---- تحديث الإيرادات عبر buffer (يستخدم dashboardKeyRef.current) ----
  const flushUpdates = useCallback(() => {
    if (buffer.current.length === 0) return;
    queryClient.setQueryData(dashboardKeyRef.current, (old) => {
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
  }, [queryClient]);

  const flushRef = useRef(flushUpdates);
  useEffect(() => {
    flushRef.current = flushUpdates;
  }, [flushUpdates]);
  useEffect(() => {
    const interval = setInterval(() => flushRef.current(), 2000);
    return () => clearInterval(interval);
  }, []);

  // ---- معالجات الأحداث ----
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
          () => (
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

  // socketHandler مع payload normalization وإضافة المعالجات المفقودة
  const socketHandler = useCallback(
    (payload) => {
      const payloadBranchId =
        payload.branch_id ??
        payload.branchId ??
        payload.data?.branch_id ??
        payload.alert?.branch_id ??
        payload.branch?.id ??
        payload.data?.branch?.id;

      if (
        currentBranchRef.current &&
        currentBranchRef.current !== "all" &&
        payloadBranchId != null &&
        String(payloadBranchId) !== String(currentBranchRef.current)
      )
        return;

      // توحيد alert
      const alertPayload =
        payload.alert ??
        payload.data?.alert ??
        (payload.type === "alert" ? payload.data : null);

      if (alertPayload) {
        handleNewAlert(alertPayload);
      }

      // معالجة insight
      if (payload.type === "insight" || payload.insight) {
        handleNewInsight(payload.insight || payload);
      }

      // معالجة dashboard events
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
    [handleNewAlert, handleNewInsight, handleDashboardEvent],
  );

  useAlertsSocket(socketHandler, companyId, branchId);

  // invalidate باستخدام predicate (للتبديلات)
  const invalidateAllDashboardQueries = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "dashboard",
    });
  }, [queryClient]);

  // ---- تنظيف hiddenAlerts ----
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

  useEffect(() => {
    if (autoFocusedRef.current) return;
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
    autoFocusedRef.current = true;
  }, [revenueAnomalyPoints, mergedRevenueData]);

  const handleSetFocusRange = useCallback((value) => {
    if (value === null) autoFocusedRef.current = false;
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
    setFocusRange: handleSetFocusRange,
    visibleRevenueData,
    appointmentsDataWithAnomalies,
    playSound,
    invalidateAllDashboardQueries, // متاح للمكونات الخارجية
  };
}
