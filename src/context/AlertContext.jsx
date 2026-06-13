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
import echoService from "../services/echo";

const AlertStateContext = createContext();
const AlertActionsContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // 1️⃣ جعل الحالة الابتدائية تقرأ بذكاء الكاش أولاً أو المتاح من الـ user
  const [companyId, setCompanyId] = useState(
    () => localStorage.getItem("selectedCompany") ?? user?.company_id ?? null,
  );
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("selectedBranchId") ?? user?.branch_id ?? null,
  );

  // 2️⃣ 🚀 [التعديل السحري الحاسم]: مزامنة الحالات المحلية فور تغير الـ user (تسجيل الدخول) أو أحداث تبديل الفروع
  useEffect(() => {
    const syncStorage = () => {
      setCompanyId(
        localStorage.getItem("selectedCompany") || user?.company_id || null,
      );
      setBranchId(
        localStorage.getItem("selectedBranchId") || user?.branch_id || null,
      );
    };

    // مزامنة فورية عند اكتمال تحميل المستخدم بعد الـ Login مباشرة
    if (!authLoading && user) {
      syncStorage();
    }

    window.addEventListener("storage", syncStorage);
    window.addEventListener("branchChanged", syncStorage);
    window.addEventListener("companyChanged", syncStorage);

    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("branchChanged", syncStorage);
      window.removeEventListener("companyChanged", syncStorage);
    };
  }, [user, authLoading]); // 🚀 يراقب الـ user لكي يحدث القيم بمجرد الدخول

  // ✅ عند تغير المستخدم، نعيد ضبط الحالة المحلية والكاش
  const [alertsList, setAlertsList] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  useEffect(() => {
    setAlertsList([]);
    setUnreadCount(0);
    queryClient.removeQueries({ queryKey: ["alerts"] });
    queryClient.removeQueries({ queryKey: ["insights"] });
  }, [user?.id, companyId, branchId, queryClient]);

  const addAlert = useCallback(
    (newAlert) => {
      const filters = ["all", "unread", "high"];
      filters.forEach((filter) => {
        if (filter === "unread" && newAlert.read) return;
        if (filter === "high" && newAlert.priority !== "high") return;
        queryClient.setQueryData(
          ["alerts", filter, companyId, branchId],
          (oldData) => {
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
          },
        );
      });
      setUnreadCount((prev) => prev + 1);
    },
    [queryClient, companyId, branchId],
  );

  // ✅ mark one – مع optimistic update + rollback
  const markAsRead = useCallback(
    async (alertId) => {
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
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      try {
        await api.post(`/erp/alerts/${alertId}/ack`);
      } catch (err) {
        console.error("❌ rollback markAsRead:", err);
        filters.forEach((filter) => {
          queryClient.setQueryData(
            ["alerts", filter, companyId, branchId],
            (oldData) => {
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
            },
          );
        });
        setUnreadCount((prev) => prev + 1);
      }
    },
    [queryClient, companyId, branchId],
  );

  // ✅ mark all – مع تحديث كل الفلاتر
  const markAllAsRead = useCallback(async () => {
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
        },
      );
    });
    setUnreadCount(0);
    try {
      await api.post("/erp/alerts/mark-all-read");
    } catch (err) {
      console.error("❌ markAllAsRead failed:", err);
    }
  }, [queryClient, companyId, branchId]);

  // ✅ تحميل العداد الأولي
  // ✅ تحميل العداد الأولي المحدث
  useEffect(() => {
    if (authLoading) return;
    if (window.location.pathname.startsWith("/admin/erp/billing")) return;

    // 🛡️ صمام أمان حرج: لا ترسل الطلب إذا كانت القيم لم تتحدث بعد في الـ State
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

    api
      .get(`/erp/alerts/unread-count?branch_id=${branchId}`)
      .then((res) => {
        if (!cancelled) setUnreadCount(res?.data?.count || 0);
      })
      .catch((err) => {
        console.warn("⚠️ Unread alerts failed:", err.response?.status);
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
    companyId, // 🚀 سيقوم بإعادة الطلب فور تغير الـ state من null إلى القيمة الحقيقية
    branchId, // 🚀 سيقوم بإعادة الطلب فور تغير الـ state من null إلى القيمة الحقيقية
    authLoading,
  ]);

  // ✅ الاشتراك في التنبيهات العامة
  useAlertsSocket((newAlert) => addAlert(newAlert), companyId, branchId);

  const stateValue = {
    unreadCount,
    alerts: alertsList,
    loading: alertsLoading,
  };

  const actionsValue = {
    addAlert,
    markAsRead,
    markAllAsRead,
  };

  // ✅ الاستماع إلى الإشعارات الشخصية
  useEffect(() => {
    if (!user?.id) return;
    const channel = echoService.getInstance().private(`user.${user.id}`);
    channel.listen(".notification.created", (notification) => {
      console.log("🔔 USER NOTIFICATION", notification);
      addAlert({
        id: notification.id ?? Date.now(),
        type: notification.type || "info",
        priority: notification.priority || "medium",
        message: notification.message || notification.title,
        meta: notification,
        time: notification.created_at || new Date().toISOString(),
        read: false,
      });
    });
    return () => channel.stopListening(".notification.created");
  }, [user?.id, addAlert]);

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
