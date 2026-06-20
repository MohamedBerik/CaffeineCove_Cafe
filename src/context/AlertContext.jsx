import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
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
  const [alerts, setAlerts] = useState([]);
  const unreadCountRef = useRef(unreadCount); // ✅ مرجع للعداد

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

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

  // عند تغيير المستخدم أو الفرع – نمسح الكاش فقط
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["alerts"] });
    queryClient.removeQueries({ queryKey: ["insights"] });
  }, [user?.id, companyId, branchId, queryClient]);

  const addAlert = useCallback(
    (newAlert) => {
      const normalizedAlert = { ...newAlert, read: Boolean(newAlert.read) };

      const filters = ["all", "unread", "high"];
      const alreadyExists = filters.some((filter) => {
        const data = queryClient.getQueryData([
          "alerts",
          filter,
          companyId,
          branchId,
        ]);
        return data?.pages?.some((page) =>
          page.data.some((a) => a.id === normalizedAlert.id),
        );
      });
      if (alreadyExists) return;

      if (!normalizedAlert.read) {
        setUnreadCount((prev) => prev + 1);
      }

      setAlerts((prev) => [normalizedAlert, ...prev].slice(0, 10));

      filters.forEach((filter) => {
        if (filter === "unread" && normalizedAlert.read) return;
        if (filter === "high" && normalizedAlert.priority !== "high") return;
        queryClient.setQueryData(
          ["alerts", filter, companyId, branchId],
          (oldData) => {
            if (!oldData) {
              return {
                pages: [
                  {
                    data: [normalizedAlert],
                    meta: { current_page: 1, has_more: false },
                  },
                ],
                pageParams: [1],
              };
            }
            const currentPage = oldData.pages[0] || { data: [], meta: {} };
            const updatedData = [normalizedAlert, ...currentPage.data].slice(
              0,
              50,
            );
            return {
              ...oldData,
              pages: [
                {
                  ...currentPage,
                  data: updatedData,
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
      const previousCount = unreadCountRef.current; // ✅ استخدام المرجع
      const previousUnreadCache = queryClient.getQueryData([
        "alerts",
        "unread",
        companyId,
        branchId,
      ]);
      const previousAllCache = queryClient.getQueryData([
        "alerts",
        "all",
        companyId,
        branchId,
      ]);

      const unreadData = queryClient.getQueryData([
        "alerts",
        "unread",
        companyId,
        branchId,
      ]);
      const wasUnread = unreadData?.pages?.some((page) =>
        page.data.some((a) => a.id === alertId),
      );

      const filters = ["all", "unread", "high"];
      filters.forEach((filter) => {
        queryClient.setQueryData(
          ["alerts", filter, companyId, branchId],
          (oldData) => {
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
          },
        );
      });

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
        if (previousUnreadCache) {
          queryClient.setQueryData(
            ["alerts", "unread", companyId, branchId],
            previousUnreadCache,
          );
        }
        if (previousAllCache) {
          queryClient.setQueryData(
            ["alerts", "all", companyId, branchId],
            previousAllCache,
          );
        }
        setUnreadCount(previousCount);
      }
    },
    [queryClient, companyId, branchId], // ✅ إزالة unreadCount من التبعيات
  );

  const markAllAsRead = useCallback(async () => {
    const previousCount = unreadCountRef.current; // ✅
    const previousUnreadCache = queryClient.getQueryData([
      "alerts",
      "unread",
      companyId,
      branchId,
    ]);

    const filters = ["all", "unread", "high"];
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
      if (previousUnreadCache) {
        queryClient.setQueryData(
          ["alerts", "unread", companyId, branchId],
          previousUnreadCache,
        );
      }
      setUnreadCount(previousCount);
      queryClient.invalidateQueries({
        queryKey: ["alerts", "unread", companyId, branchId],
      });
    }
  }, [queryClient, companyId, branchId]);

  // ✅ دالة جديدة للاعتراف الجماعي
  const markManyAsRead = useCallback(
    async (ids) => {
      if (!ids || ids.length === 0) return;

      // حفظ البيانات السابقة للتراجع عند الفشل
      const previousCount = unreadCountRef.current;
      const previousUnreadCache = queryClient.getQueryData([
        "alerts",
        "unread",
        companyId,
        branchId,
      ]);
      const previousAllCache = queryClient.getQueryData([
        "alerts",
        "all",
        companyId,
        branchId,
      ]);

      // حساب عدد العناصر غير المقروءة فعليًا من هذه الدفعة
      const unreadData = queryClient.getQueryData([
        "alerts",
        "unread",
        companyId,
        branchId,
      ]);
      const unreadIdsInBatch = ids.filter((id) =>
        unreadData?.pages?.some((page) => page.data.some((a) => a.id === id)),
      );

      // تحديث متفائل للكاش
      queryClient.setQueriesData(
        { queryKey: ["alerts"], exact: false },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((a) =>
                ids.includes(a.id) ? { ...a, read: true } : a,
              ),
            })),
          };
        },
      );

      // تحديث القائمة المحفوظة (آخر 10)
      setAlerts((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, read: true } : a)),
      );

      // تحديث العداد
      if (unreadIdsInBatch.length > 0) {
        setUnreadCount((prev) => Math.max(prev - unreadIdsInBatch.length, 0));
      }

      try {
        await api.post("/erp/alerts/ack-many", { ids });
      } catch (err) {
        console.error("❌ rollback markManyAsRead:", err);
        // استرجاع الكاش والعداد
        if (previousUnreadCache) {
          queryClient.setQueryData(
            ["alerts", "unread", companyId, branchId],
            previousUnreadCache,
          );
        }
        if (previousAllCache) {
          queryClient.setQueryData(
            ["alerts", "all", companyId, branchId],
            previousAllCache,
          );
        }
        setUnreadCount(previousCount);
        throw err; // لإعلام المستدعي بأن العملية فشلت
      }
    },
    [queryClient, companyId, branchId],
  );

  useAlertsSocket((newAlert) => addAlert(newAlert), companyId, branchId);

  const stateValue = {
    unreadCount,
    alerts,
  };

  const actionsValue = {
    addAlert,
    markAsRead,
    markAllAsRead,
    markManyAsRead, // ✅ تصدير الدالة الجديدة
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
