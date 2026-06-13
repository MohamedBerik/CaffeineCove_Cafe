import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echoService from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user, loading } = useAuth();

  const onNewAlertRef = useRef(onNewAlert);

  useEffect(() => {
    console.log("SOCKET EFFECT", {
      companyId,
      branchId,
      userId: user?.id,
      loading,
    });
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    // Guard 1
    if (loading || !user) return;

    // Guard 2
    if (!companyId) return;

    // Guard 3
    if (branchId === null || branchId === undefined) return;

    const channelName =
      branchId === "all"
        ? `company.${companyId}.alerts`
        : `company.${companyId}.branch.${branchId}.alerts`;

    console.log("📡 [Socket] Connecting:", channelName);

    const echo = echoService.getInstance();
    if (!echo) return;

    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ [Socket] SUBSCRIBED:", channelName);
    });

    channel.error((err) => {
      console.error("❌ [Socket] CHANNEL ERROR:", channelName, err);
    });

    const alertListener = (event) => {
      console.log("📨 [Socket] EVENT RECEIVED:", event);

      if (onNewAlertRef.current) {
        onNewAlertRef.current(event);
      }
    };

    channel.listen("alert.created", alertListener);

    channel.listenToAll((event, data) => {
      console.log("🔥 ALL EVENTS", event);
      console.log("🔥 DATA", data);
    });

    return () => {
      console.log("🧹 [Socket] Leaving:", channelName);

      try {
        channel.stopListening(".alert.created");

        // مهم جداً
        echo.leave(channelName);
      } catch (err) {
        console.error("Socket cleanup error:", err);
      }
    };
  }, [companyId, branchId, user?.id, loading]);
}
