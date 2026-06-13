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

      // ✅ [تعديل حاسم] دعم قراءة branch_id و branchId من الـ URL لمنع التداخل
      const queryString = config.url.includes("?")
        ? config.url.split("?")[1]
        : "";
      const urlParams = new URLSearchParams(queryString);
      const explicitBranchId =
        urlParams.get("branch_id") || urlParams.get("branchId");

      // جلب الفرع الموحد مع إعطاء الأولوية القصوى للـ URL الحالي الموجه من الـ Navbar
      const branchId =
        explicitBranchId ||
        getActiveBranchId() ||
        localStorage.getItem("selectedBranchId") ||
        "all";

      // 🎯 نرسل الهيدر دائماً بشكل محدث
      if (branchId && branchId !== "") {
        config.headers["X-Branch-ID"] = branchId;

        // 🚀 [إضافة ذهبية]: إجبار الـ Query Params الخاصة بالطلب على أخذ الفرع الجديد إذا لم تكن موجودة
        if (
          !urlParams.has("branch_id") &&
          !urlParams.has("branchId") &&
          branchId !== "all"
        ) {
          const joiner = config.url.includes("?") ? "&" : "?";
          config.url = `${config.url}${joiner}branch_id=${branchId}`;
        }
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
      delete config.headers.Authorization;
      delete config.headers["X-Tenant-ID"];
      delete config.headers["X-Branch-ID"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ✅ Response Interceptor (يبقى كما هو بدون تغيير)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    const requestUrl = error.config?.url || "";
    const currentPath = window.location.pathname;

    if (status === 401) {
      if (
        requestUrl.includes("/me") ||
        requestUrl.includes("/broadcasting/auth")
      ) {
        return Promise.reject(error);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("selectedCompany");
      localStorage.removeItem("selectedBranchId");
      if (typeof window !== "undefined" && !currentPath.startsWith("/login")) {
        window.location.replace("/login");
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

export default api;
