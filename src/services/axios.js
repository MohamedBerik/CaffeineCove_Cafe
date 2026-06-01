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

      // ✅ [تعديل حاسم] الحصول على branchId الموحد
      const queryString = config.url.includes("?")
        ? config.url.split("?")[1]
        : "";
      const urlParams = new URLSearchParams(queryString);
      const explicitBranchId = urlParams.get("branchId");

      // إذا لم يكن هناك فرع صريح، جلب الفرع المخزن أو افتراض "all" للمدراء
      const branchId =
        explicitBranchId ||
        getActiveBranchId() ||
        localStorage.getItem("selectedBranchId") ||
        "all";

      // 🎯 نرسل الهيدر دائماً! إذا كان "all" نرسله كـ "all" ليفهمه ميدياوير لارفيل ولا ينهار بـ 401
      if (branchId && branchId !== "") {
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
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    const requestUrl = error.config?.url || "";
    const currentPath = window.location.pathname;

    const isMeRoute = requestUrl.includes("/me");
    const isLoginRoute = requestUrl.includes("/login");

    const isSubscriptionError = [
      "SUBSCRIPTION_INACTIVE",
      "SUBSCRIPTION_EXPIRED",
      "SUBSCRIPTION_PAST_DUE",
      "TRIAL_EXPIRED",
      "COMPANY_SUSPENDED",
      "COMPANY_CANCELLED",
    ].includes(data.code);

    // =========================
    // 401 Unauthorized
    // =========================
    if (status === 401) {
      if (isMeRoute) {
        return Promise.reject(error);
      }

      console.warn("🔒 Session expired.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("selectedCompany");
      localStorage.removeItem("selectedBranchId");

      if (!currentPath.startsWith("/login")) {
        window.location.replace("/login");
      }

      return Promise.reject(error);
    }

    // =========================
    // 403 Subscription Errors
    // =========================
    if (status === 403 && isSubscriptionError) {
      const billingPath = "/admin/erp/billing";

      console.warn("💳 Subscription restriction detected:", data.code);

      // مهم جداً لمنع الـ Loop
      if (currentPath !== billingPath) {
        window.location.replace(billingPath);
      }

      return Promise.reject(error);
    }

    // =========================
    // 403 Permission Errors
    // =========================
    if (status === 403 && !isSubscriptionError) {
      console.warn("⛔ Permission denied:", requestUrl, data);

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
