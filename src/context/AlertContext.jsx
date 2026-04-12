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
  const [alertsByFilter, setAlertsByFilter] = useState({
    all: [],
    unread: [],
    high: [],
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const currentAlerts = alertsByFilter[filter] || [];

  // ✅ Pagination function - مع كاش
  const loadAlerts = useCallback(
    async (pageNumber = 1) => {
      // ✅ لو موجود في الكاش → رجعه فوراً
      if (alertsByFilter[filter]?.length > 0 && pageNumber === 1) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(
          `/erp/alerts?page=${pageNumber}&filter=${filter}`,
        );
        const newAlerts = res.data.data;

        setAlertsByFilter((prev) => ({
          ...prev,
          [filter]:
            pageNumber === 1
              ? newAlerts
              : [...(prev[filter] || []), ...newAlerts],
        }));

        setHasMore(res.data.meta.has_more);
        setPage(pageNumber);
      } catch (error) {
        console.error("❌ Error loading alerts:", error);
      } finally {
        setLoading(false);
      }
    },
    [filter, alertsByFilter],
  );

  // ✅ Load more function
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadAlerts(page + 1);
  }, [hasMore, loading, page, loadAlerts]);

  // ✅ mark one - مع تحديث كل الفلاتر
  const markAsRead = useCallback(async (alertId) => {
    // ✅ optimistic update لكل الفلاتر
    setAlertsByFilter((prev) => {
      const updated = {};
      Object.keys(prev).forEach((key) => {
        updated[key] = prev[key].map((a) =>
          a.id === alertId ? { ...a, read: true } : a,
        );
      });
      return updated;
    });

    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      await api.post(`/erp/alerts/${alertId}/ack`);
    } catch (err) {
      console.error("❌ rollback markAsRead:", err);

      // ❗ rollback لو فشل
      setAlertsByFilter((prev) => {
        const updated = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = prev[key].map((a) =>
            a.id === alertId ? { ...a, read: false } : a,
          );
        });
        return updated;
      });

      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ✅ mark all - مع تصفير كل الفلاتر
  const markAllAsRead = useCallback(async () => {
    const prevAlerts = alertsByFilter;

    setAlertsByFilter((prev) => {
      const updated = {};
      Object.keys(prev).forEach((key) => {
        updated[key] = prev[key].map((a) => ({ ...a, read: true }));
      });
      return updated;
    });
    setUnreadCount(0);

    try {
      await api.post("/erp/alerts/mark-all-read");
    } catch (err) {
      console.error("❌ rollback markAll:", err);

      setAlertsByFilter(prevAlerts);
      const totalUnread = prevAlerts.all?.filter((a) => !a.read).length || 0;
      setUnreadCount(totalUnread);
    }
  }, [alertsByFilter]);

  // ✅ add from socket - مع تحديث كل الفلاتر
  const addAlert = useCallback((newAlert) => {
    setAlertsByFilter((prev) => {
      const updated = {};
      Object.keys(prev).forEach((key) => {
        const exists = prev[key].some((a) => a.id === newAlert.id);
        if (!exists) {
          updated[key] = [newAlert, ...prev[key]];
        } else {
          updated[key] = prev[key];
        }
      });
      return updated;
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
    alerts: currentAlerts,
    unreadCount,
    loading,
    page,
    hasMore,
    filter,
  };

  const actionsValue = {
    markAsRead,
    markAllAsRead,
    addAlert,
    loadAlerts,
    loadMore,
    setFilter,
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
