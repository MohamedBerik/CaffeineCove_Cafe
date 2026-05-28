import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echo from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);
  const previousChannelRef = useRef(null);

  // حافظ على أحدث نسخة من callback
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

    // ✅ مغادرة القناة السابقة فقط وليس القناة الحالية
    if (
      previousChannelRef.current &&
      previousChannelRef.current !== channelName
    ) {
      echo.leave(previousChannelRef.current);
    }
    previousChannelRef.current = channelName;

    const channel = echo.private(channelName);

    const alertListener = (e) => {
      // استخراج branch_id من جميع المسارات الممكنة
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

      onNewAlertRef.current(e.alert || e);
    };

    channel.listen(".alert.created", alertListener);

    return () => {
      channel.stopListening(".alert.created", alertListener);
      echo.leave(channelName);
    };
  }, [companyId, branchId, user]);
}
