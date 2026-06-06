import { useEffect } from "react";
import echoService from "../services/echo";

export default function useSaasActivityLogsSocket(onNewLog) {
  useEffect(() => {
    const echo = echoService.getInstance();

    if (!echo) return;

    const channel = echo.private("saas.activity-logs");

    channel.listen(".activity-log.created", (event) => {
      onNewLog?.(event);
    });

    return () => {
      channel.stopListening(".activity-log.created");
      echo.leave("private-saas.activity-logs");
    };
  }, [onNewLog]);
}
