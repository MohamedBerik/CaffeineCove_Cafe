import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutLocal = () => {
    // 🚀 مسح شامل وكامل لكل أنواع الكاش في المتصفح تخص الفروع
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("active_branch_id"); // تنظيف الـ utility التابع لـ activeBranch

    // تصفير الـ session تماماً لضمان عدم تعليق أي متغير بالذاكرة
    sessionStorage.clear();

    setUser(null);
  };

  const loadUser = async () => {
    try {
      const res = await api.get("/me");

      // ✅ البيانات اللي بترجع من /me
      const userData = res.data.user || res.data;

      // ✅ خزن البيانات كاملة
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Failed to load user", err);

      // ✅ تصفير الـ state فوراً لمنع تعليق الفرونت إند
      setUser(null);

      // ✅ لو 401، يبقى التوكين مش صالح
      if (err.response?.status === 401) {
        logoutLocal();
      }
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser().finally(() => setLoading(false));
    } else {
      logoutLocal(); // تأكيد تنظيف أي بقايا هيدرات قديمة
      setLoading(false);
    }
  }, []);

  const login = async (userData, token) => {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // 🚀 إذا كان أدمن لا نضع له فرعاً مسبقاً، نجعله "all" نظيفاً لتظهر له كل الفروع افتراضياً
    const isAdmin = userData?.is_super_admin || userData?.role === "admin";
    const initialCompany = userData?.company_id || "global";
    const initialBranch = isAdmin ? "all" : (userData?.branch_id ?? "all");

    localStorage.setItem("selectedCompany", initialCompany);
    localStorage.setItem("selectedBranchId", initialBranch);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
    setLoading(true);

    try {
      const fullUser = await loadUser();
      if (fullUser) {
        const finalIsAdmin =
          fullUser.is_super_admin || fullUser.role === "admin";
        localStorage.setItem(
          "selectedCompany",
          fullUser.company_id || "global",
        );
        localStorage.setItem(
          "selectedBranchId",
          finalIsAdmin ? "all" : (fullUser.branch_id ?? "all"),
        );
        setUser(fullUser);
      }
    } catch (e) {
      console.error("Error fetching full user profile after login:", e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (e) {
      // فشل logout - عادي
    }

    logoutLocal();
    delete api.defaults.headers.common["Authorization"];
  };

  // ✅ دالة تحديث بيانات المستخدم (تستعمل بعد تبديل الفرع مثلاً)
  const refreshUser = async () => {
    return await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
