import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import echoService from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const onNewAlertRef = useRef(onNewAlert);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (loading || !user) return;
    if (!companyId || companyId === "global") return;
    if (branchId === null || branchId === undefined) return;

    const echo = echoService.getInstance();
    if (!echo) return;

    const cleanupChannels = [];

    //
    // 1) User Channel (Per User Alerts)
    //
    const userChannelName = `user.${user.id}`;

    console.log("📡 [Socket] Connecting:", userChannelName);

    const userChannel = echo.private(userChannelName);

    userChannel.subscribed(() => {
      console.log("✅ [Socket] SUBSCRIBED:", userChannelName);
    });

    userChannel.error((err) => {
      console.error("❌ [Socket] CHANNEL ERROR:", userChannelName, err);
    });

    userChannel.listen(".alert.created", (event) => {
      console.log("📨 [User Alert]", event);
      onNewAlertRef.current?.(event);
      queryClient.invalidateQueries({
        queryKey: ["alerts-unread-count"],
      });
    });

    cleanupChannels.push(userChannelName);

    //
    // 2) Branch Channel (General Alerts)
    //
    if (branchId !== "all") {
      const branchChannelName = `company.${companyId}.branch.${branchId}.alerts`;

      console.log("📡 [Socket] Connecting:", branchChannelName);

      const branchChannel = echo.private(branchChannelName);

      branchChannel.subscribed(() => {
        console.log("✅ [Socket] SUBSCRIBED:", branchChannelName);
      });

      branchChannel.error((err) => {
        console.error("❌ [Socket] CHANNEL ERROR:", branchChannelName, err);
      });

      branchChannel.listen(".alert.created", (event) => {
        console.log("📨 [Branch Alert]", event);

        onNewAlertRef.current?.(event);

        queryClient.invalidateQueries({
          queryKey: ["alerts-unread-count"],
        });
      });

      cleanupChannels.push(branchChannelName);
    }

    return () => {
      cleanupChannels.forEach((channelName) => {
        console.log("🧹 [Socket] Leaving:", channelName);

        try {
          echo.leave(`private-${channelName}`);
        } catch (err) {
          console.error("Socket cleanup error:", err);
        }
      });
    };
  }, [companyId, branchId, user?.id, loading]);
}
