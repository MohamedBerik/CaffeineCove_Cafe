import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
      return true;
    } catch (err) {
      console.error("Failed to load user", err);

      // ✅ لو 401، يبقى التوكين مش صالح
      if (err.response?.status === 401) {
        logoutLocal();
      }
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (userData, token) => {
    // ✅ خزن التوكين
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // ✅ خزن بيانات المستخدم
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
