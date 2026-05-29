import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getEcho } from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);
  const previousChannelRef = useRef(null);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    const isAdmin = user?.role === "admin" || user?.is_super_admin;

    console.log("🔍 SOCKET EFFECT RUN", {
      companyId,
      branchId,
      isAdmin,
      userRole: user?.role,
      userSuperAdmin: user?.is_super_admin,
    });

    if (!companyId || !branchId || !isAdmin) {
      console.log("⏭️ Skipping subscription – conditions not met");
      return;
    }

    const channelName =
      branchId === "all"
        ? `company.${companyId}`
        : `company.${companyId}.branch.${branchId}`;

    console.log("📡 SUBSCRIBING TO:", channelName);

    // مغادرة القناة السابقة باستخدام الصيغة الصحيحة "private-..."
    if (
      previousChannelRef.current &&
      previousChannelRef.current !== channelName
    ) {
      const prevChannelFull = `private-${previousChannelRef.current}`;
      console.log("🚪 LEAVING previous channel:", prevChannelFull);
      const echo = getEcho();
      echo.leave(prevChannelFull);
    }

    previousChannelRef.current = channelName;

    const echo = getEcho();
    const channel = echo.private(channelName);

    // لتشخيص الاشتراك
    channel.subscribed(() => {
      console.log("✅ SUBSCRIBED to", channelName);
    });

    channel.error((err) => {
      console.error("❌ CHANNEL ERROR on", channelName, err);
    });

    const alertListener = (e) => {
      console.log("📨 EVENT RECEIVED on", channelName, e);
      // استخراج branch_id للفلترة (تكرار للاحتياط)
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
        console.warn("🚫 Event filtered out – branch mismatch", {
          eventBranchId,
          currentBranch: branchId,
        });
        return;
      }

      onNewAlertRef.current(e);
    };

    // إزالة المستمع السابق بنفس الـ callback لتجنب التراكم
    channel.stopListening(".alert.created", alertListener);
    channel.listen(".alert.created", alertListener);

    return () => {
      console.log("🧹 CLEANUP – stopping listener on", channelName);
      channel.stopListening(".alert.created", alertListener);
      // لا نغادر القناة هنا – سنغادر فقط عند تغيير القناة
    };
  }, [companyId, branchId, user?.role, user?.is_super_admin]);
}
