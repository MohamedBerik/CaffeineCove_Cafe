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
    const isAdmin = user?.role === "admin" || user?.is_super_admin;
    if (!companyId || !branchId || !isAdmin) return;

    const channelName =
      branchId === "all"
        ? `company.${companyId}`
        : `company.${companyId}.branch.${branchId}`;

    // ترك القناة السابقة فقط عند تغييرها
    if (
      previousChannelRef.current &&
      previousChannelRef.current !== channelName
    ) {
      echo.leave(previousChannelRef.current);
    }
    previousChannelRef.current = channelName;

    const channel = echo.private(channelName);

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
      onNewAlertRef.current(e);
    };

    // منع تكرار المستمعات (مهم مع StrictMode)
    channel.stopListening(".alert.created");
    channel.listen(".alert.created", alertListener);

    return () => {
      channel.stopListening(".alert.created");
      // لا نغادر القناة هنا – سنغادر فقط عند تغيير القناة في effect التالي
    };
  }, [companyId, branchId, user?.role, user?.is_super_admin]); // ✅ تبعيات آمنة
}
