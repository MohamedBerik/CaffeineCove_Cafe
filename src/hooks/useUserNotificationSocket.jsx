import { useEffect } from "react";
import echoService from "../services/echo";
import { useNotifications } from "../context/NotificationContext";
import { toast } from "react-toastify";

export default function useUserNotificationSocket(userId, onNotification) {
  // ✅ استدعاء الـ Hook في أعلى المستوى (Top Level)
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!userId) return;

    const echo = echoService.getInstance();
    if (!echo) {
      console.warn("Echo instance not available");
      return;
    }

    const channel = echo.private(`user.${userId}`);

    channel.listen(".notification.created", (event) => {
      // ✅ استخدم الدالة التي حصلنا عليها من الـ Context
      addNotification(event);
      toast.success(event.title);
      onNotification?.(event);
    });

    return () => {
      channel.stopListening(".notification.created");
      echo.leave(`private-user.${userId}`);
    };
  }, [userId, onNotification, addNotification]); // ✅ أضف التبعيات
}
