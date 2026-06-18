import { useEffect } from "react";
import echoService from "../services/echo";

export default function useUserNotificationSocket(userId, onNotification) {
  useEffect(() => {
    console.log("HOOK USER ID", userId);

    if (!userId) return;

    const echo = echoService.getInstance();

    console.log("ECHO INSTANCE", echo);

    const channel = echo.private(`user.${userId}`);

    console.log("SUBSCRIBED TO", `private-user.${userId}`);

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
