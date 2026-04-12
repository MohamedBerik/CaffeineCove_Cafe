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

  // ✅ add from socket (داخلي فقط)
  const addAlert = useCallback((newAlert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === newAlert.id)) return prev;
      return [newAlert, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

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

  // ✅ تحميل الإشعارات الأولية
  useEffect(() => {
    if (!user) return;

    const loadInitialAlerts = async () => {
      try {
        const [alertsRes, countRes] = await Promise.all([
          api.get("/erp/alerts"),
          api.get("/erp/alerts/unread-count"),
        ]);

        const alertsData = Array.isArray(alertsRes.data)
          ? alertsRes.data
          : alertsRes.data?.data || [];

        setAlerts(alertsData);
        setUnreadCount(countRes.data?.count || 0);
      } catch (error) {
        console.error("❌ Error fetching alerts:", error);
      }
    };

    loadInitialAlerts();
  }, [user]);

  // ✅ الاستماع للإشعارات الجديدة
  useAlertsSocket((newAlert) => {
    console.log("📨 Raw alert from socket:", newAlert);
    addAlert(newAlert);
  }, user?.company_id);

  const stateValue = {
    unreadCount,
  };

  const actionsValue = {
    markAsRead,
    markAllAsRead,
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
