import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echoService from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user, loading } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);
  const previousChannelRef = useRef(null);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    // 1️⃣ حماية التحميل والأصالة
    if (loading) return;
    if (!user) return;

    const isAdmin = user.role === "admin" || user.is_super_admin === true;
    if (!isAdmin) return;

    if (!companyId || !branchId) return;

    // 2️⃣ تحديد اسم القناة بشكل مستقر
    const channelName =
      branchId === "all"
        ? `company.${companyId}.alerts`
        : `company.${companyId}.branch.${branchId}.alerts`;

    // 🛡️ منع التكرار: إذا كنا متصلين بالفعل بنفس القناة، لا تفعل شيئاً واخرج بأمان
    if (previousChannelRef.current === channelName) {
      return;
    }

    console.log("📡 [Socket] Connecting to safe channel:", channelName);

    // مغادرة القناة القديمة إن وجدت
    if (
      previousChannelRef.current &&
      previousChannelRef.current !== channelName
    ) {
      const prevChannelFull = `private-${previousChannelRef.current}`;
      const echo = echoService.getInstance();
      try {
        echo.leave(prevChannelFull);
        console.log("🚪 [Socket] Left channel:", prevChannelFull);
      } catch (e) {
        console.error("Failed to leave channel gracefully", e);
      }
    }

    // حفظ القناة الحالية كمرجع ثابت لمنع الـ Loop
    previousChannelRef.current = channelName;

    const echo = echoService.getInstance();
    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ [Socket] SUBSCRIBED successfully to", channelName);
    });

    channel.error((err) => {
      console.error("❌ [Socket] CHANNEL ERROR on", channelName, err);
    });

    const alertListener = (e) => {
      console.log("📨 [Socket] EVENT RECEIVED on", channelName, e);
      onNewAlertRef.current(e);
    };

    channel.stopListening(".alert.created", alertListener);
    channel.listen(".alert.created", alertListener);

    return () => {
      // التنظيف يحدث فقط عندما تتغير القناة فعلياً أو يخرج المستخدم
      if (previousChannelRef.current !== channelName) {
        console.log("🧹 [Socket] CLEANUP listener on channel:", channelName);
        channel.stopListening(".alert.created", alertListener);
      }
    };
    // 🛡️ مصفوفة التبعيات الآن ترصد المتغيرات التشغيلية الحقيقية فقط بنظام عزل صارم
  }, [companyId, branchId, user?.id, loading]);
}
