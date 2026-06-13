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
    // 1️⃣ أولاً: تخزين التوكن فوراً وتعيين هيدر الأمان
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // 2️⃣ تحديد الفروع المبدئية بناءً على البيانات القادمة من الـ Login فوراً
    const isAdmin = userData?.is_super_admin || userData?.role === "admin";
    const initialCompany = userData?.company_id || "global";
    const initialBranch = isAdmin ? "all" : (userData?.branch_id ?? "all");

    // 3️⃣ الحفظ في الـ LocalStorage فوراً وقبل أي طلب شبكة
    localStorage.setItem("selectedCompany", initialCompany);
    localStorage.setItem("selectedBranchId", initialBranch);
    localStorage.setItem("active_branch_id", initialBranch); // توحيد الـ utility أيضاً
    localStorage.setItem("user", JSON.stringify(userData));

    // ⚠️ [تعديل حاسم]: لا نغير الـ State هنا ولا نرفع الـ Loading لمنع المكونات الأخرى من الاستيقاظ بشكل مبكر

    try {
      // جلب البيانات الكاملة من /me
      const fullUser = await api.get("/me");
      const finalUserData = fullUser.data.user || fullUser.data;

      if (finalUserData) {
        const finalIsAdmin =
          finalUserData.is_super_admin || finalUserData.role === "admin";
        const finalBranch = finalIsAdmin
          ? "all"
          : (finalUserData.branch_id ?? "all");

        // تحديث الـ LocalStorage بالبيانات النهائية المستقرة
        localStorage.setItem(
          "selectedCompany",
          finalUserData.company_id || "global",
        );
        localStorage.setItem("selectedBranchId", finalBranch);
        localStorage.setItem("active_branch_id", finalBranch);
        localStorage.setItem("user", JSON.stringify(finalUserData));

        // 4️⃣ الآن فقط، بعد استقرار الـ LocalStorage تماماً، نحدّث الـ State لتستيقظ المكونات معاً بشكل متزامن
        setUser(finalUserData);
      } else {
        setUser(userData);
      }
    } catch (e) {
      console.error("Error fetching full user profile after login:", e);
      // في حال فشل /me، نعتمد على بيانات الـ login كملاذ أخير بأمان
      setUser(userData);
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
