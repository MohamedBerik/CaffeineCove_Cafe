import axios from "axios";

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

    let token = localStorage.getItem("token");
    const tenantId = localStorage.getItem("selectedCompany");
    const branchId = localStorage.getItem("selectedBranchId");

    // ✅ إضافة branch_id تلقائياً من localStorage (فقط لغير مسارات المصادقة)
    if (!isAuthRoute && branchId && branchId !== "all" && branchId !== "") {
      config.headers["X-Branch-ID"] = branchId;
    }

    console.log("🔑 TOKEN from localStorage:", token);
    console.log("🏢 Tenant ID from localStorage:", tenantId);
    console.log("📡 Request URL:", config.url);
    console.log("🔐 isAuthRoute:", isAuthRoute);

    if (!isAuthRoute) {
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
      delete config.headers["X-Branch-ID"]; // ← السطر المُضاف
    }

    console.log("📋 Final Headers:", JSON.stringify(config.headers));
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
    console.log("✅ Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Response Error:");
    console.error("  - URL:", error.config?.url);
    console.error("  - Status:", error.response?.status);
    console.error(
      "  - Message:",
      error.response?.data?.message || error.message,
    );

    if (error.response?.status === 403) {
      const data = error.response?.data || {};

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
        const redirectTo = data.redirect_to || "/admin/erp/billing";
        window.location.href = redirectTo;
        return Promise.reject(error);
      }

      // ⚠️ أخطاء الصلاحيات الأخرى (مثلاً طبيب يحاول دخول لوحة المدير الإداري)
      // نرجع Reject عشان الـ Component يهندلها ويعرض رسالة "غير مسموح لك بالدخول"
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
