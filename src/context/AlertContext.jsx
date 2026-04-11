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
  const [loading, setLoading] = useState(true);

  // ✅ fetch alerts (used by page)
  const fetchAlerts = useCallback(async (page = 1, filter = "all") => {
    const res = await api.get(`/erp/alerts?page=${page}&filter=${filter}`);
    return res.data;
  }, []);

  // ✅ mark one
  const markAsRead = useCallback(async (alertId) => {
    await api.post(`/erp/alerts/${alertId}/ack`);

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    );

    setUnreadCount((prev) => Math.max(prev - 1, 0));
  }, []);

  // ✅ mark all
  const markAllAsRead = useCallback(async () => {
    await api.post("/erp/alerts/mark-all-read");

    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

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

    const loadInitialAlerts = async () => {
      try {
        const [alertsRes, countRes] = await Promise.all([
          api.get("/erp/alerts"),
          api.get("/erp/alerts/unread-count"),
        ]);
        console.log("ALERTS API:", alertsRes.data);
        console.log("🔢 COUNT:", countRes.data);

        // ✅ تأكد إنها Array
        const alertsData = Array.isArray(alertsRes.data)
          ? alertsRes.data
          : alertsRes.data?.data || [];

        setAlerts(alertsData);
        setUnreadCount(countRes.data?.count || 0);
      } catch (error) {
        console.error("❌ Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialAlerts();
  }, [user]);

  // ✅ الاستماع للإشعارات الجديدة
  useAlertsSocket((newAlert) => {
    console.log("📨 Raw alert from socket:", newAlert);
    addAlert(newAlert);
  }, user?.company_id);

  const stateValue = { alerts, unreadCount, loading };
  const actionsValue = {
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    addAlert,
    setAlerts,
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

// ✅ Hook موحد للتوافق مع الكود القديم
export const useAlerts = () => ({
  ...useAlertState(),
  ...useAlertActions(),
});

//لاحقا :
// ✅ الطريقة الجديدة (أداء أفضل)
// const { alerts, unreadCount } = useAlertState();
// const { markAsRead, markAllAsRead } = useAlertActions();

// ✅ الطريقة القديمة (لسه شغالة)
// const { alerts, unreadCount, markAsRead } = useAlerts();
