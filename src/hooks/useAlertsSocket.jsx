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

    const echo = echoService.getInstance();
    if (!echo) return;

    const channels = [];

    //
    // 1) قناة المستخدم
    //
    const userChannelName = `user.${user.id}`;

    const userChannel = echo.private(userChannelName);

    userChannel.listen(".alert.created", (event) => {
      console.log("📨 User alert:", event);
      onNewAlertRef.current?.(event);
    });

    channels.push(userChannelName);

    //
    // 2) قناة الفرع
    //
    if (branchId !== "all") {
      const branchChannelName = `company.${companyId}.branch.${branchId}.alerts`;

      const branchChannel = echo.private(branchChannelName);

      branchChannel.listen(".alert.created", (event) => {
        console.log("📨 Branch alert:", event);
        onNewAlertRef.current?.(event);
      });

      channels.push(branchChannelName);
    }

    return () => {
      channels.forEach((channelName) => {
        echo.leave(`private-${channelName}`);
      });
    };
  }, [companyId, branchId, user?.id, loading]);
}
