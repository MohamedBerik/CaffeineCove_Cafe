import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echo from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);
  const previousChannelRef = useRef(null);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (!companyId || !branchId) return;
    if (user?.role !== "admin" && !user?.is_super_admin) return;

    const channelName =
      branchId === "all"
        ? `company.${companyId}`
        : `company.${companyId}.branch.${branchId}`;

    if (
      previousChannelRef.current &&
      previousChannelRef.current !== channelName
    ) {
      echo.leave(previousChannelRef.current);
    }
    previousChannelRef.current = channelName;

    const channel = echo.private(channelName);

    // منع تكرار الاشتراك (خاصة في StrictMode)
    channel.stopListening(".alert.created");

    const alertListener = (e) => {
      const eventBranchId =
        e.alert?.branch_id ??
        e.branch_id ??
        e.data?.branch_id ??
        e.branch?.id ??
        e.data?.branch?.id;

      if (
        branchId !== "all" &&
        eventBranchId != null &&
        String(eventBranchId) !== String(branchId)
      ) {
        return;
      }

      // إرسال الحدث بالكامل ليتم تحليله في useDashboardData
      onNewAlertRef.current(e);
    };

    channel.listen(".alert.created", alertListener);

    return () => {
      channel.stopListening(".alert.created");
      echo.leave(channelName);
    };
  }, [companyId, branchId, user]);
}
