import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import useAlertsSocket from "../hooks/useAlertsSocket";
import api from "../services/axios";

const AlertStateContext = createContext();
const AlertActionsContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // استخراج معرف الشركة والفرع من localStorage مع guard
  const companyId = useMemo(
    () => localStorage.getItem("selectedCompany") || null,
    [],
  );
  const branchId = useMemo(
    () => localStorage.getItem("selectedBranchId") || null,
    [],
  );

  // ✅ add from socket - يحدث React Query Cache
  const addAlert = useCallback(
    (newAlert) => {
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
    // تأكد من وجود مستخدم، شركة، فرع، ودور مناسب
    if (
      !user ||
      !companyId ||
      !branchId ||
      (user.role !== "admin" && !user.is_super_admin)
    ) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const res = await api.get("/erp/alerts/unread-count");
        if (!cancelled) {
          setUnreadCount(res?.data?.count || 0);
        }
      } catch (error) {
        if (!cancelled && error.response?.status !== 429) {
          console.error("❌ Error fetching unread count:", error);
        }
      }
    };

    loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.is_super_admin, companyId, branchId]);

  // ✅ الاستماع للإشعارات الجديدة - تمرير companyId و branchId
  useAlertsSocket(
    (newAlert) => {
      addAlert(newAlert);
    },
    companyId,
    branchId,
  );

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

export const useAlertState = () => useContext(AlertStateContext);
export const useAlertActions = () => useContext(AlertActionsContext);
