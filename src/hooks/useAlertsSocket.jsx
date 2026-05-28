import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echo from "../services/echo";

export default function useAlertsSocket(onNewAlert, companyId, branchId) {
  const { user } = useAuth();
  const onNewAlertRef = useRef(onNewAlert);

  // حافظ على أحدث نسخة من الـ callback بدون إعادة اشتراك
  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    if (!companyId || !branchId) return;
    if (user?.role !== "admin" && !user?.is_super_admin) return;

    const channelName =
      branchId === "all"
        ? `company.${companyId}`
        : `company.${companyId}.branch.${branchId}`;

    // مغادرة القناة السابقة تماماً
    echo.leave(channelName);

    const channel = echo.private(channelName);

    const alertListener = (e) => {
      // استخراج branch_id من الحدث
      const eventBranchId = e.alert?.branch_id ?? e.branch_id;

      // فلترة الأحداث حسب الفرع إذا لم نكن في وضع "all"
      if (
        branchId !== "all" &&
        eventBranchId &&
        String(eventBranchId) !== String(branchId)
      ) {
        return; // تجاهل الحدث القادم من فرع آخر
      }

      // استدعاء الـ callback الأحدث (الذي يملك مرجعاً مستقراً)
      onNewAlertRef.current(e.alert || e);
    };

    channel.listen(".alert.created", alertListener);

    return () => {
      channel.stopListening(".alert.created", alertListener);
      echo.leave(channelName);
    };
  }, [companyId, branchId, user]); // ✅ مصفوفة التبعية صحيحة ومستقرة
}
