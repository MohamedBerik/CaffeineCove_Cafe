import axios from "axios";
import { getActiveBranchId } from "../utils/activeBranch";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ Request Interceptor
api.interceptors.request.use(
  (config) => {
    const isAuthRoute =
      config.url.includes("/login") || config.url.includes("/register");

    if (!isAuthRoute) {
      let token = localStorage.getItem("token");
      const tenantId = localStorage.getItem("selectedCompany");

      // 💡 الحصول على branchId من الـ URL الصريح أو من المصدر الموحد (وليس من localStorage مباشرة)
      const queryString = config.url.includes("?")
        ? config.url.split("?")[1]
        : "";
      const urlParams = new URLSearchParams(queryString);
      const explicitBranchId = urlParams.get("branchId");
      const branchId = explicitBranchId || getActiveBranchId(); // ✅ مصدر واحد للحقيقة

      // ✅ إضافة branch_id تلقائياً
      if (branchId && branchId !== "all" && branchId !== "") {
        config.headers["X-Branch-ID"] = branchId;
      }

      if (token) {
        try {
          if (token.startsWith('"') && token.endsWith('"')) {
            token = JSON.parse(token);
          }
        } catch (e) {
          console.error("❌ Error parsing token:", e);
        }
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (tenantId && tenantId !== "global" && tenantId !== "") {
        config.headers["X-Tenant-ID"] = tenantId;
      }
    } else {
      // ✅ حذف أي هيدرات قد تكون عالقة في مسارات المصادقة
      delete config.headers.Authorization;
      delete config.headers["X-Tenant-ID"];
      delete config.headers["X-Branch-ID"];
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// ✅ Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    const isMeRoute = error.config?.url?.includes("/me"); // 🎯 فحص إذا كان المسار هو طلب الملف الشخصي

    // 🔐 إذا انتهت صلاحية الجلسة أو التوكن (401 Unauthorized)
    if (status === 401) {
      // إذا كان الطلب الفاشل هو /me، اتركه للـ AuthContext تماماً لمنع الـ Loop والتحديث اللانهائي
      if (isMeRoute) {
        return Promise.reject(error);
      }

      console.warn("🔒 Session expired or unauthenticated. Cleaning up...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("selectedCompany");
      localStorage.removeItem("selectedBranchId");

      // التوجيه الناعم لصفحة اللوجن إذا لم يكن مسار /me
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    if (status === 403) {
      if (error.config.url.includes("/login")) {
        return Promise.reject(error);
      }

      // ✅ أخطاء الاشتراك – إعادة توجيه فورية
      const subscriptionErrors = [
        "SUBSCRIPTION_INACTIVE",
        "SUBSCRIPTION_EXPIRED",
        "SUBSCRIPTION_PAST_DUE",
        "TRIAL_EXPIRED",
        "COMPANY_SUSPENDED",
      ];

      if (subscriptionErrors.includes(data.code)) {
        // إذا كان مسار /me هو الذي تسبب في خطأ الاشتراك، نكتفي بتمرير الخطأ للـ AuthContext للتعامل معه دون عمل Hard Reload مفاجئ
        if (isMeRoute) {
          return Promise.reject(error);
        }

        const redirectTo = data.redirect_to || "/admin/erp/billing";
        window.location.href = redirectTo; // Hard reload لأمان الـ SaaS
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
