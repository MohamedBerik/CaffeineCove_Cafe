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

const AlertStateContext = createContext();
const AlertActionsContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ جعل companyId و branchId تفاعليين (state) مع مستمعين للتغيير
  const [companyId, setCompanyId] = useState(
    () => localStorage.getItem("selectedCompany") || null,
  );
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") || null,
  );

  useEffect(() => {
    const syncStorage = () => {
      setCompanyId(localStorage.getItem("selectedCompany") || null);
      setBranchId(localStorage.getItem("selectedBranchId") || null);
    };
    window.addEventListener("storage", syncStorage);
    window.addEventListener("branchChanged", syncStorage);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("branchChanged", syncStorage);
    };
  }, []);

  const [alertsList, setAlertsList] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const addAlert = useCallback(
    (newAlert) => {
      setAlertsList((prev) => [newAlert, ...prev]);
      const filters = ["all", "unread", "high"];
      filters.forEach((filter) => {
        if (filter === "unread" && newAlert.read) return;
        if (filter === "high" && newAlert.priority !== "high") return;
        queryClient.setQueryData(["alerts", filter], (oldData) => {
          if (!oldData) return oldData;
          const alreadyExists = oldData.pages.some((page) =>
            page.data.some((a) => a.id === newAlert.id),
          );
          if (alreadyExists) return oldData;
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

  const markAsRead = useCallback(
    async (alertId) => {
      const filters = ["all", "unread", "high"];
      filters.forEach((filter) => {
        queryClient.setQueryData(["alerts", filter], (oldData) => {
          if (!oldData) return oldData;
          if (filter === "unread") {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                data: page.data.filter((a) => a.id !== alertId),
              })),
            };
          }
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((a) =>
                a.id === alertId ? { ...a, read: true } : a,
              ),
            })),
          };
        });
      });
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      try {
        await api.post(`/erp/alerts/${alertId}/ack`);
      } catch (err) {
        console.error("❌ rollback markAsRead:", err);
        filters.forEach((filter) => {
          queryClient.setQueryData(["alerts", filter], (oldData) => {
            if (!oldData) return oldData;
            if (filter === "unread") return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                data: page.data.map((a) =>
                  a.id === alertId ? { ...a, read: false } : a,
                ),
              })),
            };
          });
        });
        setUnreadCount((prev) => prev + 1);
      }
    },
    [queryClient],
  );

  const markAllAsRead = useCallback(async () => {
    const filters = ["all", "unread", "high"];
    filters.forEach((filter) => {
      queryClient.setQueryData(["alerts", filter], (oldData) => {
        if (!oldData) return oldData;
        if (filter === "unread") {
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: [],
            })),
          };
        }
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((a) => ({ ...a, read: true })),
          })),
        };
      });
    });
    setUnreadCount(0);
    try {
      await api.post("/erp/alerts/mark-all-read");
    } catch (err) {
      console.error("❌ markAllAsRead failed:", err);
    }
  }, [queryClient]);

  // ✅ تحميل العداد الأولي مع إضافة Guard لحماية مسار السوبر أدمن والـ Global
  useEffect(() => {
    if (authLoading) return;

    // 🛡️ حماية (Guard): إذا كان الأدمن في حالة Global أو البيانات لم تكتمل، لا ترسل طلب الـ API لمنع الـ 403
    if (!user || !companyId || companyId === "global" || !branchId) {
      setUnreadCount(0);
      return;
    }

    // الفحص الأساسي للأدمن
    if (user.role !== "admin" && !user.is_super_admin) return;

    let cancelled = false;
    setAlertsLoading(true);

    // نمرر الـ branchId كـ Query Parameter اختياري للتأكيد للباك إند
    api
      .get(`/erp/alerts/unread-count?branch_id=${branchId}`)
      .then((res) => {
        if (!cancelled) {
          setUnreadCount(res?.data?.count || 0);
        }
      })
      .catch((err) => {
        console.warn(
          "⚠️ [Alerts Context] Failed to fetch unread count:",
          err.response?.status,
        );
      })
      .finally(() => {
        if (!cancelled) setAlertsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    user?.role,
    user?.is_super_admin,
    companyId,
    branchId,
    authLoading,
  ]);

  // ✅ استدعاء السوكيت الآمن
  useAlertsSocket((newAlert) => addAlert(newAlert), companyId, branchId);

  const stateValue = {
    unreadCount,
    alerts: alertsList,
    loading: alertsLoading,
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

export const useAlertState = () => useContext(AlertStateContext);
export const useAlertActions = () => useContext(AlertActionsContext);
