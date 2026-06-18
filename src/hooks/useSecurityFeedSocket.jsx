import { useEffect } from "react";
import echoService from "../services/echo";

export default function useSecurityFeedSocket(onNewEvent) {
  useEffect(() => {
    const echo = echoService.getInstance();

    if (!echo) return;

    const channel = echo.channel("security-feed");

    channel.listen(".security.updated", (event) => {
      onNewEvent?.(event);
    });

    return () => {
      channel.stopListening(".security.updated");
      echo.leave("security-feed");
    };
  }, [onNewEvent]);
}
