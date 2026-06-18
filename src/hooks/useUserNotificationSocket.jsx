import { useEffect } from "react";
import echoService from "../services/echo";

export default function useUserNotificationSocket(userId, onNotification) {
  useEffect(() => {
    if (!userId) return;

    const echo = echoService.getInstance();

    if (!echo) return;

    const channel = echo.private(`user.${userId}`);

    channel.listen(".notification.created", (event) => {
      console.log("🔔 USER NOTIFICATION", event);
      onNotification?.(event);
    });

    return () => {
      channel.stopListening(".notification.created");
      echo.leave(`private-user.${userId}`);
    };
  }, [userId, onNotification]);
}
