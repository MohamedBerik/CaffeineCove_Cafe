import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echoService from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user, loading } = useAuth(); // ✅ استخدم loading
  const onNewAlertRef = useRef(onNewAlert);
  const previousChannelRef = useRef(null);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    console.log("🧪 SOCKET CHECK", {
      loading,
      user: !!user,
      companyId,
      branchId,
      userRole: user?.role,
      userSuperAdmin: user?.is_super_admin,
    });

    // انتظر حتى ينتهي Auth من تحميل المستخدم
    if (loading) {
      console.log("⏳ Auth still loading...");
      return;
    }

    if (!user) {
      console.log("🚫 No authenticated user");
      return;
    }

    const isAdmin = user.role === "admin" || user.is_super_admin === true;

    if (!companyId || !branchId) {
      console.log("⏭️ Missing company or branch");
      return;
    }

    if (!isAdmin) {
      console.log("🚫 User is not admin – socket subscription skipped");
      return;
    }

    const channelName =
      branchId === "all"
        ? `company.${companyId}.alerts`
        : `company.${companyId}.branch.${branchId}.alerts`;

    console.log("📡 SUBSCRIBING TO:", channelName);

    if (
      previousChannelRef.current &&
      previousChannelRef.current !== channelName
    ) {
      const prevChannelFull = `private-${previousChannelRef.current}`;
      console.log("🚪 LEAVING previous channel:", prevChannelFull);
      const echo = echoService.getInstance();
      echo.leave(prevChannelFull);
    }

    previousChannelRef.current = channelName;

    const echo = echoService.getInstance();
    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ SUBSCRIBED to", channelName);
    });

    channel.error((err) => {
      console.error("❌ CHANNEL ERROR on", channelName, err);
    });

    const alertListener = (e) => {
      console.log("📨 EVENT RECEIVED on", channelName, e);
      onNewAlertRef.current(e);
    };

    channel.stopListening(".alert.created", alertListener);
    channel.listen(".alert.created", alertListener);

    return () => {
      console.log("🧹 CLEANUP – stopping listener on", channelName);
      channel.stopListening(".alert.created", alertListener);
    };
  }, [companyId, branchId, user?.role, user?.is_super_admin, loading]); // ✅ loading في التبعيات
}
