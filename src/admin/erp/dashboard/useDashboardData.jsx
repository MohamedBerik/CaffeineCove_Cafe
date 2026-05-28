import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../services/axios";
import { PRIORITY_MAP, getDashboardKey } from "../constants";
import { useAlertActions } from "../../../../context/AlertContext";

export function useDashboardData(branchId, range, showComparison) {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useAlertActions();
  const [hiddenAlerts, setHiddenAlerts] = useState(new Set());
  const acknowledgingRef = useRef(new Set());
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());

  const dashboardKey = getDashboardKey(branchId, range, showComparison);

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
    staleTime: 30 * 1000,
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
    refetchIntervalInBackground: false, // لا تعمل في الخلفية
  });

  // ---- Acknowledge mutation ----
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => axios.post(`/erp/alerts/${id}/ack`),
    onMutate: async (id) => {
      const key = getDashboardKey(branchId, range, showComparison);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => {
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
      queryClient.setQueryData(
        getDashboardKey(branchId, range, showComparison),
        context.prev,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getDashboardKey(branchId, range, showComparison),
      });
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

  // ---- Clean hidden alerts عند تغيير التنبيهات ----
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
  const revenueAnomalyMap = useMemo(() => {
    const insights = dashboard?.insights || [];
    return new Map(
      insights
        .filter((i) => i.category === "revenue" && i.point)
        .map((i) => [i.point.date, i.point]),
    );
  }, [dashboard]);

  const appointmentsAnomalyMap = useMemo(() => {
    const insights = dashboard?.insights || [];
    return new Map(
      insights
        .filter((i) => i.category === "appointments" && i.point)
        .map((i) => [i.point.date, i.point]),
    );
  }, [dashboard]);

  // ---- Revenue chart data ----
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
      mergedRevenueData.map((p) => ({
        ...p,
        anomaly: revenueAnomalyMap.get(p.date) || null,
      })),
    [mergedRevenueData, revenueAnomalyMap],
  );

  // ---- Appointments chart data (with `date` for anomaly matching) ----
  const appointmentsChartData = useMemo(
    () =>
      (dashboard?.charts?.appointments || []).map((item) => ({
        label: item.label,
        date: item.label, // أضفنا هذا الحقل لربط anomalies
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
      appointmentsChartData.map((p) => ({
        ...p,
        anomaly: appointmentsAnomalyMap.get(p.date) || null,
      })),
    [appointmentsChartData, appointmentsAnomalyMap],
  );

  return {
    dashboard,
    isLoading,
    error,
    refetch,
    activityLogs,
    acknowledge,
    acknowledgingIds, // تمت إضافته للاستخدام في تعطيل الزر
    hiddenAlerts,
    setHiddenAlerts,
    markAllAsRead,
    revenueDataWithAnomalies, // يُستخدم بدل visibleRevenueData
    appointmentsDataWithAnomalies,
  };
}
