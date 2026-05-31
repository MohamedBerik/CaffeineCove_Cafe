import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echoService from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user, loading } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);

  // حماية صارمة لمنع التكرار بأي شكل
  const currentConnectionKeyRef = useRef("");

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (loading || !user) return;

    // الأدمن والموظفين يدخلون السوكيت بشكل طبيعي حسب صلاحياتهم
    if (!companyId || !branchId) return;

    // تركيب مفتاح فريد ومستقر للاتصال الحالي
    const connectionKey = `${companyId}-${branchId}-${user.id}`;

    // 🛡️ إذا كان الاتصال الحالي هو نفس الاتصال النشط، اخرج فوراً ولا تلمس السوكيت!
    if (currentConnectionKeyRef.current === connectionKey) {
      return;
    }

    const channelName =
      branchId === "all"
        ? `company.${companyId}.alerts`
        : `company.${companyId}.branch.${branchId}.alerts`;

    console.log(
      "📡 [Socket] Triggered connection for key:",
      connectionKey,
      "Channel:",
      channelName,
    );

    const echo = echoService.getInstance();

    // حفظ المفتاح لمنع الـ Loop قبل البدء بالربط
    const oldKey = currentConnectionKeyRef.current;
    currentConnectionKeyRef.current = connectionKey;

    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ [Socket] SUBSCRIBED successfully to", channelName);
    });

    channel.error((err) => {
      console.error("❌ [Socket] CHANNEL ERROR on", channelName, err);
      // في حال حدوث خطأ 500 لا نريد تدمير المفتاح حتى لا يدخل في لولب محاولات مستمر
    });

    const alertListener = (e) => {
      console.log("📨 [Socket] EVENT RECEIVED:", e);
      if (onNewAlertRef.current) {
        onNewAlertRef.current(e);
      }
    };

    channel.listen(".alert.created", alertListener);

    return () => {
      // لا تقم بمغادرة القناة إلا إذا تغيرت الصلاحية أو الـ ID فعلياً!
      if (currentConnectionKeyRef.current !== connectionKey) {
        console.log("🧹 [Socket] Safe Cleanup for channel:", channelName);
        try {
          channel.stopListening(".alert.created", alertListener);
          echo.leave(`private-${channelName}`);
        } catch (e) {
          console.empty();
        }
      }
    };
    // تم عزل التبعيات تماماً والاعتماد على السيطرة الداخلية عبر الـ Ref
  }, [companyId, branchId, user?.id, loading]);
}
