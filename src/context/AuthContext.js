import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("selectedBranchId");
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

    setLoading(true);
    const fullUser = await loadUser();

    if (fullUser) {
      // إزالة أي قيم قديمة لتجنب إرسالها في الطلبات التالية
      localStorage.removeItem("selectedCompany");
      localStorage.removeItem("selectedBranchId");

      // تعيين القيم الجديدة بناءً على بيانات الباك إند المحدثة والـ Tenant الموثق
      const targetCompany = fullUser.company_id || "global";
      const targetBranch = fullUser.branch_id ?? "all";

      localStorage.setItem("selectedCompany", targetCompany);
      localStorage.setItem("selectedBranchId", targetBranch);
    } else {
      // Fallback في حال فشل جلب /me لسبب عارض
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      const targetCompany = userData.company_id || "global";
      const targetBranch = userData.branch_id ?? "all";

      localStorage.setItem("selectedCompany", targetCompany);
      localStorage.setItem("selectedBranchId", targetBranch);
    }

    setLoading(false);
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
