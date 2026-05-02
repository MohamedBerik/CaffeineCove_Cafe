import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import echo from "../services/echo";
import toast from "react-hot-toast";

// ✅ دالة ترجمة الكود إلى أيقونة - برا الـ useEffect
const getAlertIcon = (code, type) => {
  switch (code) {
    case "LOW_STOCK":
      return "📦";
    case "PAYMENT_FAILED":
      return "💳";
    case "NEW_ORDER":
      return "🛒";
    case "APPOINTMENT_BOOKED":
      return "📅";
    case "APPOINTMENT_CANCELLED":
      return "❌";
    case "TREATMENT_COMPLETED":
      return "✅";
    default:
      return type === "warning"
        ? "⚠️"
        : type === "error"
          ? "❌"
          : type === "success"
            ? "✅"
            : "🔔";
  }
};

export default function useAlertsSocket(onNewAlert, companyId) {
  const audioRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!companyId) return;
    if (user?.role !== "admin" && !user?.is_super_admin) return;

    const channelName = `company.${companyId}`;

    // ✅ امنع التكرار
    echo.leave(channelName);

    const channel = echo.private(channelName);

    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.log("🔇 لم يتم تشغيل الصوت:", err);
        });
      }
    };

    channel.listen(".alert.created", (e) => {
      console.log("🔥 ALERT RECEIVED:", e);

      onNewAlert(e.alert);
      playSound();

      toast.custom(
        (t) => (
          <div
            className={`toast-card ${t.visible ? "visible" : ""}`}
            style={{
              background: "white",
              padding: "16px 20px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: "300px",
              maxWidth: "400px",
              borderLeft: `4px solid ${
                e.alert.priority === "high"
                  ? "#ef4444"
                  : e.alert.priority === "medium"
                    ? "#f59e0b"
                    : "#10b981"
              }`,
              animation: "slideIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background:
                  e.alert.priority === "high"
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : e.alert.priority === "medium"
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "20px" }}>
                {getAlertIcon(e.alert.code, e.alert.type)}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "4px",
                }}
              >
                {e.alert.title || "New Alert"}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                {e.alert.message}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#999",
                  marginTop: "6px",
                }}
              >
                {new Date(e.alert.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#999",
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>
        ),
        {
          duration: 5000,
          position: "top-right",
        },
      );
    });

    return () => {
      echo.leave(channelName);
    };
  }, [companyId, user]); // ✅ غيرنا dependency array إلى [companyId] فقط
}
