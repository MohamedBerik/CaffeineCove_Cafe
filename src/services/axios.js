import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ Request Interceptor نظيف وبدون تعديل عشوائي للروابط
api.interceptors.request.use(
  (config) => {
    const isAuthRoute =
      config.url.includes("/login") || config.url.includes("/register");

    if (!isAuthRoute) {
      let token = localStorage.getItem("token");
      const tenantId = localStorage.getItem("selectedCompany");

      // 🚀 قراءة حية ومباشرة من الـ localStorage لأحدث فرع تم ضغطه بالماوس حالياً
      const branchId = localStorage.getItem("selectedBranchId") || "all";

      // 🎯 نحقن الهيدر الموحد دائماً وهو كافي جداً للباك إند ليفهم الفرع الحالي
      if (branchId) {
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
      delete config.headers.Authorization;
      delete config.headers["X-Tenant-ID"];
      delete config.headers["X-Branch-ID"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
