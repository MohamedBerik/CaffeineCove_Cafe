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
  const [alerts, setAlerts] = useState([]); // ✅ مصفوفة التنبيهات الأخيرة لشريط التنقل

  const [companyId, setCompanyId] = useState(
    () => localStorage.getItem("selectedCompany") ?? user?.company_id ?? null,
  );
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") ?? user?.branch_id ?? null,
  );

  // مزامنة القيم مع localStorage
  useEffect(() => {
    const syncStorage = () => {
      setCompanyId(
        localStorage.getItem("selectedCompany") || user?.company_id || null,
      );
      setBranchId(
        localStorage.getItem("selectedBranchId") || user?.branch_id || null,
      );
    };
    if (!authLoading && user) syncStorage();

    window.addEventListener("storage", syncStorage);
    window.addEventListener("branchChanged", syncStorage);
    window.addEventListener("companyChanged", syncStorage);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("branchChanged", syncStorage);
      window.removeEventListener("companyChanged", syncStorage);
    };
  }, [user, authLoading]);

  const [alertsLoading, setAlertsLoading] = useState(false);

  // تنظيف عند تغيير المستخدم
  useEffect(() => {
    setAlerts([]);
    setUnreadCount(0);
    queryClient.removeQueries({ queryKey: ["alerts"] });
    queryClient.removeQueries({ queryKey: ["insights"] });
  }, [user?.id, companyId, branchId, queryClient]);

  const addAlert = useCallback(
    (newAlert) => {
      // فحص التكرار أولاً
      const filters = ["all", "unread", "high"];
      const alreadyExists = filters.some((filter) => {
        const data = queryClient.getQueryData([
          "alerts",
          filter,
          companyId,
          branchId,
        ]);
        return data?.pages?.some((page) =>
          page.data.some((a) => a.id === newAlert.id),
        );
      });
      if (alreadyExists) return;

      // زيادة العداد إذا كان غير مقروء
      if (!newAlert.read) {
        setUnreadCount((prev) => prev + 1);
      }

      // تحديث القائمة المحفوظة (آخر 10)
      setAlerts((prev) => [newAlert, ...prev].slice(0, 10));

      // تحديث الكاش (React Query) – إنشاء صفحة أولية إذا لم تكن موجودة
      filters.forEach((filter) => {
        if (filter === "unread" && newAlert.read) return;
        if (filter === "high" && newAlert.priority !== "high") return;
        queryClient.setQueryData(
          ["alerts", filter, companyId, branchId],
          (oldData) => {
            if (!oldData) {
              return {
                pages: [
                  {
                    data: [newAlert],
                    meta: { current_page: 1, has_more: false },
                  },
                ],
                pageParams: [1],
              };
            }
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
          },
        );
      });
    },
    [queryClient, companyId, branchId],
  );

  const markAsRead = useCallback(
    async (alertId) => {
      const filters = ["all", "unread", "high"];
      let wasUnread = false;

      // optimistic update مع تتبع ما إذا كان التنبيه غير مقروء
      filters.forEach((filter) => {
        queryClient.setQueryData(
          ["alerts", filter, companyId, branchId],
          (oldData) => {
            if (!oldData) return oldData;
            if (filter === "unread") {
              const newPages = oldData.pages.map((page) => {
                const alertToRemove = page.data.find(
                  (a) => a.id === alertId && !a.read,
                );
                if (alertToRemove) wasUnread = true;
                return {
                  ...page,
                  data: page.data.filter((a) => a.id !== alertId),
                };
              });
              return { ...oldData, pages: newPages };
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
          },
        );
      });

      // تحديث القائمة المحلية
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
      );

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      try {
        await api.post(`/erp/alerts/${alertId}/ack`);
      } catch (err) {
        console.error("❌ rollback markAsRead:", err);
        // في حالة الفشل نعيد التحقق من الخادم
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "alerts",
        });
      }
    },
    [queryClient, companyId, branchId],
  );

  const markAllAsRead = useCallback(async () => {
    const filters = ["all", "unread", "high"];
    const previousCount = unreadCount;

    // optimistic update
    filters.forEach((filter) => {
      queryClient.setQueryData(
        ["alerts", filter, companyId, branchId],
        (oldData) => {
          if (!oldData) return oldData;
          if (filter === "unread") {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({ ...page, data: [] })),
            };
          }
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((a) => ({ ...a, read: true })),
            })),
          };
        },
      );
    });

    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);

    try {
      await api.post("/erp/alerts/mark-all-read");
    } catch (err) {
      console.error("❌ markAllAsRead failed:", err);
      setUnreadCount(previousCount);
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "alerts",
      });
    }
  }, [queryClient, companyId, branchId, unreadCount]);

  // تحميل العداد الأولي (معلق)
  useEffect(() => {
    if (authLoading) return;
    if (window.location.pathname.startsWith("/admin/erp/billing")) return;
    if (!user || !companyId || companyId === "global" || companyId === null) {
      setUnreadCount(0);
      return;
    }
    if (branchId === null || branchId === undefined) {
      setUnreadCount(0);
      return;
    }
    if (user.role !== "admin" && !user.is_super_admin) return;

    let cancelled = false;
    setAlertsLoading(true);

    return () => {
      cancelled = true;
      setAlertsLoading(false);
    };
  }, [
    user?.id,
    user?.role,
    user?.is_super_admin,
    companyId,
    branchId,
    authLoading,
  ]);

  useAlertsSocket((newAlert) => addAlert(newAlert), companyId, branchId);

  const stateValue = {
    unreadCount,
    alerts, // ✅ شريط التنقل يستخدمها
    loading: alertsLoading,
  };

  const actionsValue = {
    addAlert,
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
