import axios from "axios";
import { notifyError } from "../utils/notify";

const api = axios.create({
  baseURL: "https://caffeinecoveapi-production-a107.up.railway.app/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ✅ إضافة التوكن و Tenant ID تلقائيًا مع Debug log
api.interceptors.request.use(
  (config) => {
    const isAuthRoute =
      config.url.includes("/login") || config.url.includes("/register");

    let token = localStorage.getItem("token");
    const tenantId = localStorage.getItem("selectedCompany");

    console.log("🔑 TOKEN from localStorage:", token);
    console.log("🏢 Tenant ID from localStorage:", tenantId);

    // ❌ مهم جدًا: متبعتش headers في auth routes
    if (!isAuthRoute) {
      if (token) {
        try {
          if (token.startsWith('"') && token.endsWith('"')) {
            token = JSON.parse(token);
          }
        } catch (e) {}

        config.headers.Authorization = `Bearer ${token}`;
      }

      if (tenantId && tenantId !== "global" && tenantId !== "") {
        config.headers["X-Tenant-ID"] = tenantId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ إضافة Response Interceptor للتعامل مع 401 (للتشخيص فقط - بدون توجيه)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ لو السيرفر رجع 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.error("🚫 401 Unauthorized detected!");
      console.error("📋 Error details:", error.response?.data);
      console.error("🔑 Token that was sent:", localStorage.getItem("token"));
      console.error(
        "🏢 Tenant that was sent:",
        localStorage.getItem("selectedCompany"),
      );
      console.log("❌ Status:", error.response.status);
      console.log("❌ Data:", error.response.data);

      // ❌ تم تعليق سطر التوجيه لمنع اختفاء الصفحة
      // localStorage.removeItem("token");
      // localStorage.removeItem("user");
      // window.location.href = "/login";
    }

    // ✅ تمرير الخطأ لبقية التطبيق
    return Promise.reject(error);
  },
);

export default api;
