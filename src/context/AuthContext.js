// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutLocal = () => {
    localStorage.clear();
    setUser(null);
  };

  const loadUser = async (token) => {
    try {
      // ✅ استخدم الـ interceptor بدل ما تبعت header يدوي
      const res = await api.get("/me");

      const userData = res.data;

      localStorage.setItem("user", JSON.stringify(userData));

      setUser({
        ...userData,
        token,
      });
    } catch (err) {
      console.error("Failed to load user", err);
      logoutLocal();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // ✅ ضبط التوكين في axios قبل ما نعمل request
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (_userData, token) => {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setLoading(true);
    await loadUser(token);
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
