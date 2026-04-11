import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import useAlertsSocket from "../hooks/useAlertsSocket";
import api from "../services/axios";

// ✅ تقسيم الـ Context
const AlertStateContext = createContext();
const AlertActionsContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // ✅ أضفنا filter

  // ✅ fetch alerts (used by page)
  const fetchAlerts = useCallback(async (page = 1, filterParam = "all") => {
    const res = await api.get(`/erp/alerts?page=${page}&filter=${filterParam}`);
    return res.data;
  }, []);

  // ✅ Pagination function - تستخدم filter من الـ state
  const loadAlerts = useCallback(
    async (pageNumber = 1) => {
      setLoading(true);
      try {
        const res = await api.get(
          `/erp/alerts?page=${pageNumber}&filter=${filter}`,
        );
        const newAlerts = res.data.data;

        setAlerts((prev) =>
          pageNumber === 1 ? newAlerts : [...prev, ...newAlerts],
        );

        setHasMore(res.data.meta.has_more);
        setPage(pageNumber);
      } catch (error) {
        console.error("❌ Error loading alerts:", error);
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  // ✅ Load more function
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadAlerts(page + 1);
  }, [hasMore, loading, page, loadAlerts]);

  // ✅ mark one
  const markAsRead = useCallback(async (alertId) => {
    // ✅ optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    );

    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      await api.post(`/erp/alerts/${alertId}/ack`);
    } catch (err) {
      console.error("❌ rollback markAsRead:", err);

      // ❗ rollback لو فشل
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: false } : a)),
      );

      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ✅ mark all
  const markAllAsRead = useCallback(async () => {
    const prevAlerts = alerts;

    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);

    try {
      await api.post("/erp/alerts/mark-all-read");
    } catch (err) {
      console.error("❌ rollback markAll:", err);

      setAlerts(prevAlerts);
      setUnreadCount(prevAlerts.filter((a) => !a.read).length);
    }
  }, [alerts]);

  // ✅ add from socket
  const addAlert = useCallback((newAlert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === newAlert.id)) return prev;
      return [newAlert, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  // ✅ تحميل الإشعارات الأولية
  useEffect(() => {
    if (!user) return;
    loadAlerts(1);
  }, [user, loadAlerts]);

  // ✅ الاستماع للإشعارات الجديدة
  useAlertsSocket((newAlert) => {
    console.log("📨 Raw alert from socket:", newAlert);
    addAlert(newAlert);
  }, user?.company_id);

  const stateValue = {
    alerts,
    unreadCount,
    loading,
    page,
    hasMore,
    filter, // ✅ أضفنا filter
  };

  const actionsValue = {
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    addAlert,
    setAlerts,
    loadAlerts,
    loadMore,
    setFilter, // ✅ أضفنا setFilter
    // ✅ دوال التوافق
    addUnreadCount: () => {},
    clearUnreadCount: () => markAllAsRead(),
    updateUnreadCount: () => {},
  };

  return (
    <AlertStateContext.Provider value={stateValue}>
      <AlertActionsContext.Provider value={actionsValue}>
        {children}
      </AlertActionsContext.Provider>
    </AlertStateContext.Provider>
  );
};

// ✅ Hooks منفصلة
export const useAlertState = () => useContext(AlertStateContext);
export const useAlertActions = () => useContext(AlertActionsContext);
