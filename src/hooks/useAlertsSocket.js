import { useEffect, useRef } from "react";
import echo from "../services/echo";
import toast from "react-hot-toast";

export default function useAlertsSocket(onNewAlert) {
  // ✅ إنشاء Audio مرة واحدة فقط (Performance)
  const audioRef = useRef(null);

  useEffect(() => {
    // تهيئة الصوت مرة واحدة
    audioRef.current = new Audio("/notification.mp3");

    return () => {
      // تنظيف
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const channel = echo.channel("alerts");

    // ✅ دالة تشغيل الصوت
    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // إعادة الصوت للبداية
        audioRef.current.play().catch((err) => {
          console.log("🔇 لم يتم تشغيل الصوت:", err);
        });
      }
    };

    channel.listen(".alert.created", (e) => {
      console.log("🔥 ALERT RECEIVED:", e);

      // ✅ استدعاء الكولباك لتحديث الـ state
      onNewAlert(e.alert);

      // ✅ تشغيل صوت الإشعار
      playSound();

      // ✅ إظهار توست احترافي
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
              borderLeft: "4px solid #ef4444",
              animation: "slideIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "20px" }}>🔔</span>
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
                {new Date().toLocaleTimeString([], {
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
      echo.leave("alerts");
    };
  }, [onNewAlert]);
}
