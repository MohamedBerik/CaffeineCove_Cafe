import { useEffect } from "react";
import echoService from "../services/echo";

export default function useActivityLogsSocket(companyId, onNewLog) {
  useEffect(() => {
    if (!companyId) return;

    const echo = echoService.getInstance();

    if (!echo) return;

    const channelName = `company.${companyId}.activity-logs`;

    const channel = echo.private(channelName);

    channel.listen(".activity-log.created", (event) => {
      console.log("📜 Activity Log Received", event);

      onNewLog?.(event);
    });

    return () => {
      channel.stopListening(".activity-log.created");

      echo.leave(`private-${channelName}`);
    };
  }, [companyId, onNewLog]);
}
