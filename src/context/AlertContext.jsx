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

const AlertStateContext = createContext();
const AlertActionsContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (page = 1, filter = "all") => {
    const res = await api.get(`/erp/alerts?page=${page}&filter=${filter}`);
    return res.data;
  }, []);

  // ✅ Pagination function
  const loadAlerts = useCallback(async (pageNumber = 1, filter = "all") => {
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
  }, []);

  // ✅ Load more function
  const loadMore = useCallback(
    (filter = "all") => {
      if (!hasMore || loading) return;
      loadAlerts(page + 1, filter);
    },
    [hasMore, loading, page, loadAlerts],
  );

  const markAsRead = useCallback(async (alertId) => {
    await api.post(`/erp/alerts/${alertId}/ack`);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.post("/erp/alerts/mark-all-read");
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  const addAlert = useCallback((newAlert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === newAlert.id)) return prev;
      return [newAlert, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadAlerts(1, "all");
  }, [user, loadAlerts]);

  useAlertsSocket((newAlert) => {
    console.log("📨 Raw alert from socket:", newAlert);
    addAlert(newAlert);
  }, user?.company_id);

  const stateValue = { alerts, unreadCount, loading, page, hasMore };
  const actionsValue = {
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    addAlert,
    setAlerts,
    loadAlerts,
    loadMore,
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

export const useAlertState = () => useContext(AlertStateContext);
export const useAlertActions = () => useContext(AlertActionsContext);
