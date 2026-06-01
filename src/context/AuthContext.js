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
      console.log("🔥 CALLING /me");

      const res = await api.get("/me");

      console.log("✅ /me SUCCESS", res.data);

      const userData = res.data.user || res.data;

      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      return userData;
    } catch (err) {
      console.log("❌ /me FAILED", err.response?.status, err.response?.data);

      setUser(null);

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
    // 1️⃣ تخزين التوكن فوراً ليعتمده الأكسيوس
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // 2️⃣ [تعديل حاسم] تخزين معرفات الشركة والفرع فوراً من بيانات اللوجن الأولية
    // لمنع ميدياوير الباك إند من رفض طلب /me القادم
    const initialCompany = userData?.company_id || "global";
    const initialBranch = userData?.branch_id ?? "all";

    localStorage.setItem("selectedCompany", initialCompany);
    localStorage.setItem("selectedBranchId", initialBranch);
    localStorage.setItem("user", JSON.stringify(userData));

    // تعيين المستخدم مبدئياً لفتح الواجهة فوراً ومنع تعليق الـ UI
    setUser(userData);
    setLoading(true);

    try {
      // 3️⃣ الآن نطلب البيانات الكاملة والمحدثة من السيرفر بأمان وبأعلى درجات العزل
      const fullUser = await loadUser();

      if (fullUser) {
        // تحديث القيم بالبيانات الأكثر دقة القادمة من الباك إند
        localStorage.setItem(
          "selectedCompany",
          fullUser.company_id || "global",
        );
        localStorage.setItem("selectedBranchId", fullUser.branch_id ?? "all");
        setUser(fullUser);
      }
    } catch (e) {
      console.error("Error fetching full user profile after login:", e);
    } finally {
      // 4️⃣ إغلاق الـ Loading بشكل حتمي ومؤكد في كل الحالات لتثبيت الشاشة
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
