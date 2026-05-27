// dashboard/hooks/useDashboardData.js
import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../services/axios";
import { PRIORITY_MAP, getDashboardKey } from "../constants";

export function useDashboardData(branchId, range, showComparison) {
  const queryClient = useQueryClient();
  const branchRef = useRef(branchId);
  const rangeRef = useRef(range);
  const compareRef = useRef(showComparison);
  const acknowledgingRef = useRef(new Set());
  const buffer = useRef([]);
  const [hiddenAlerts, setHiddenAlerts] = useState(new Set());

  useEffect(() => {
    branchRef.current = branchId;
    rangeRef.current = range;
    compareRef.current = showComparison;
  }, [branchId, range, showComparison]);

  const dashboardKey = getDashboardKey(branchId, range, showComparison);

  // ---------- Dashboard Query ----------
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

  // ---------- Activity Logs Query ----------
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
  });

  // ---------- Acknowledge Mutation ----------
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => axios.post(`/erp/alerts/${id}/ack`),
    onMutate: async (id) => {
      const key = getDashboardKey(
        branchRef.current,
        rangeRef.current,
        compareRef.current,
      );
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
      const key = getDashboardKey(
        branchRef.current,
        rangeRef.current,
        compareRef.current,
      );
      queryClient.setQueryData(key, context.prev);
      console.error("Failed to acknowledge alert", err);
    },
  });

  const acknowledge = (id) => {
    if (acknowledgingRef.current.has(id)) return;
    acknowledgingRef.current.add(id);
    acknowledgeMutation.mutate(id, {
      onSettled: () => {
        acknowledgingRef.current.delete(id);
      },
    });
  };

  // ---------- Cleanup hiddenAlerts ----------
  useEffect(() => {
    const alerts = dashboard?.reminders?.alerts || [];
    setHiddenAlerts((prev) => {
      const next = new Set();
      alerts.forEach((alert) => {
        if (prev.has(alert.id)) next.add(alert.id);
      });
      return next;
    });
  }, [dashboard?.reminders?.alerts]);

  return {
    dashboard,
    isLoading,
    error,
    refetch,
    activityLogs,
    acknowledge,
    hiddenAlerts,
    setHiddenAlerts,
  };
}
