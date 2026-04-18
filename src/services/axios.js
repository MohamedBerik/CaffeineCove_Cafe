import axios from "axios";
import { notifyError } from "../utils/notify";

const api = axios.create({
  baseURL: "https://caffeinecoveapi-production-a107.up.railway.app/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ✅ إضافة التوكن تلقائيًا مع Debug log
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");

    // ✅ Debug: التحقق من وجود التوكن وشكله
    console.log("🔑 TOKEN from localStorage:", token);

    if (token) {
      // ✅ إصلاح مشكلة quotes: لو التوكن متخزن كـ JSON string
      try {
        if (token.startsWith('"') && token.endsWith('"')) {
          token = JSON.parse(token);
        }
      } catch (e) {
        // التوكن مش JSON، نستخدمه كما هو
      }
      config.headers.Authorization = `Bearer ${token}`;
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
