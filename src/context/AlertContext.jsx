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
  // ✅ جعل companyId و branchId تفاعليين مع مستمعين للتغيير
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
    // ✅ تم تغيير اسم الحدث إلى activeBranchChanged
    window.addEventListener("activeBranchChanged", syncStorage);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("activeBranchChanged", syncStorage);
    };
  }, []);

  const addAlert = useCallback(
    (newAlert) => {
      // ✅ استخرج التنبيه الفعلي من الحدث
      const alert = newAlert.alert || newAlert;

      // تحديث alerts محليًا
      setAlertsList((prev) => [alert, ...prev]);

      // تحديث React Query cache
      const filters = ["all", "unread", "high"];
      filters.forEach((filter) => {
        if (filter === "unread" && alert.read) return;
        if (filter === "high" && alert.priority !== "high") return;
        queryClient.setQueryData(["alerts", filter], (oldData) => {
          if (!oldData) return oldData;
          const alreadyExists = oldData.pages.some((page) =>
            page.data.some((a) => a.id === alert.id),
          );
          if (alreadyExists) return oldData;
          return {
            ...oldData,
            pages: [
              {
                ...oldData.pages[0],
                data: [alert, ...oldData.pages[0].data],
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

  // ✅ mark one - مع optimistic update + rollback
  const markAsRead = useCallback(
    async (alertId) => {
      const filters = ["all", "unread", "high"];
      // Optimistic update
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
            if (filter === "unread") return oldData; // نحتاج refetch لاستعادة الحذف
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

  // ✅ mark all - مع تحديث كل الفلاتر
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

  // ✅ تحميل العداد الأولي مع guard صارم
  useEffect(() => {
    if (authLoading) return;
    if (!user || !companyId || !branchId) {
      setUnreadCount(0);
      return;
    }
    if (user.role !== "admin" && !user.is_super_admin) return;

    let cancelled = false;
    setAlertsLoading(true);
    api
      .get("/erp/alerts/unread-count")
      .then((res) => {
        if (!cancelled) {
          setUnreadCount(res?.data?.count || 0);
        }
      })
      .catch(() => {})
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

  // ✅ الاشتراك في socket – يبدأ فقط عندما تكون جميع البيانات جاهزة
  useAlertsSocket((newAlert) => addAlert(newAlert), companyId, branchId);

  const stateValue = {
    unreadCount,
    alerts: alertsList, // ✅ تم توفير alerts
    loading: alertsLoading, // ✅ تم توفير loading
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
