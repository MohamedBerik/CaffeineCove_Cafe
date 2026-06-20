import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import useUserNotificationSocket from "./useUserNotificationSocket";

export default function useUserNotificationsBridge() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useUserNotificationSocket(user?.id, (event) => {
    console.log("🔔 PRIVATE USER EVENT", event);

    addNotification({
      type: event.type,
      title: event.title,
      message: event.message,
    });
  });
}
