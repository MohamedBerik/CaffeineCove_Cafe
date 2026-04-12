import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import useAlertsSocket from "../hooks/useAlertsSocket";
import api from "../services/axios";

// ✅ تقسيم الـ Context
const AlertStateContext = createContext();
const AlertActionsContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ add from socket - يحدث React Query Cache
  const addAlert = useCallback(
    (newAlert) => {
      const filters = ["all", "unread", "high"];

      filters.forEach((filter) => {
        // ✅ فلترة حسب الفلتر
        if (filter === "unread" && newAlert.read) return;
        if (filter === "high" && newAlert.priority !== "high") return;

        queryClient.setQueryData(["alerts", filter], (oldData) => {
          if (!oldData) return oldData;

          // ✅ منع التكرار
          const alreadyExists = oldData.pages.some((page) =>
            page.data.some((a) => a.id === newAlert.id),
          );
          if (alreadyExists) return oldData;

          // ✅ إضافة الإشعار الجديد
          return {
            ...oldData,
            pages: [
              {
                ...oldData.pages[0],
                data: [newAlert, ...oldData.pages[0].data],
              },
              ...oldData.pages.slice(1),
            ],
          };
        });
      });

      setUnreadCount((prev) => prev + 1);
    },
    [queryClient],
  );

  // ✅ mark one
  const markAsRead = useCallback(async (alertId) => {
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await api.post(`/erp/alerts/${alertId}/ack`);
    } catch (err) {
      console.error("❌ markAsRead failed:", err);
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ✅ mark all
  const markAllAsRead = useCallback(async () => {
    const prevUnread = unreadCount;
    setUnreadCount(0);
    try {
      await api.post("/erp/alerts/mark-all-read");
    } catch (err) {
      console.error("❌ markAllAsRead failed:", err);
      setUnreadCount(prevUnread);
    }
  }, [unreadCount]);

  // ✅ تحميل العداد الأولي
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const res = await api.get("/erp/alerts/unread-count");
        setUnreadCount(res.data?.count || 0);
      } catch (error) {
        console.error("❌ Error fetching unread count:", error);
      }
    };

    loadUnreadCount();
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
