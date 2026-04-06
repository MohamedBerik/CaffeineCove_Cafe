import { useEffect } from "react";
import echo from "../services/echo";

export default function useAlertsSocket(onNewAlert) {
  useEffect(() => {
    const channel = echo.channel("alerts");

    channel.listen(".alert.created", (e) => {
      onNewAlert(e.alert);
    });

    channel.listen(".alert.created", (e) => {
      console.log("🔥 ALERT RECEIVED:", e);
      onNewAlert(e.alert);
    });

    return () => {
      echo.leave("alerts");
    };
  }, [onNewAlert]);
}
