import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echoService from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user, loading } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    // ✅ تشخيص الحالة الحالية للمتغيرات
    console.log("🚦 [Socket] Effect triggered", {
      loading,
      user: !!user,
      userRole: user?.role,
      companyId,
      branchId,
    });

    if (loading || !user) {
      console.log("⏸️ [Socket] Waiting for auth...");
      return;
    }

    if (!companyId || companyId === "global") {
      console.log("⏸️ [Socket] Invalid companyId:", companyId);
      return;
    }

    if (branchId === null || branchId === undefined) {
      console.log("⏸️ [Socket] Invalid branchId:", branchId);
      return;
    }

    const channelName =
      branchId === "all"
        ? `company.${companyId}.alerts`
        : `company.${companyId}.branch.${branchId}.alerts`;

    console.log("📡 [Socket] Connecting:", channelName);

    const echo = echoService.getInstance();

    if (!echo) {
      console.error(
        "❌ [Socket] Failed to get Echo instance – check token and EchoService",
      );
      return;
    }
    console.log("✅ [Socket] Echo instance obtained");

    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ [Socket] SUBSCRIBED successfully:", channelName);
    });

    channel.error((err) => {
      console.error("❌ [Socket] CHANNEL ERROR:", channelName, err);
    });

    const alertListener = (event) => {
      console.log("📨 [Socket] EVENT RECEIVED:", event);
      onNewAlertRef.current?.(event);
    };

    channel.listen(".alert.created", alertListener);

    return () => {
      console.log("🧹 [Socket] Leaving:", channelName);
      try {
        channel.stopListening(".alert.created");
        echo.leave(`private-${channelName}`);
      } catch (err) {
        console.error("Socket cleanup error:", err);
      }
    };
  }, [companyId, branchId, user?.id, loading]);
}
