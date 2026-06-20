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
    if (loading || !user) return;
    if (!companyId || companyId === "global") return;
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
      onNewAlertRef.current?.(event);
    };

    channel.listen(".alert.created", alertListener);

    // لا حاجة لإعادة الاشتراك يدويًا لأن Pusher/Echo يتولى ذلك تلقائيًا عند reconnect

    return () => {
      console.log("🧹 [Socket] Leaving:", channelName);
      try {
        channel.stopListening(".alert.created"); // اختياري لكن آمن
        echo.leave(`private-${channelName}`); // هذا ينظف كل شيء
      } catch (err) {
        console.error("Socket cleanup error:", err);
      }
    };
  }, [companyId, branchId, user?.id, loading]);
}
