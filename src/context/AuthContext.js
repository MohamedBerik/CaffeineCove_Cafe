import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (token) => {
    try {
      const res = await api.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = res.data;

      localStorage.setItem("user", JSON.stringify(userData));

      setUser({
        ...userData,
        token,
      });
    } catch (err) {
      console.error("Failed to load user", err);
      logoutLocal();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (userData, token) => {
    localStorage.setItem("token", token);

    await loadUser(token);
  };

  const logoutLocal = () => {
    localStorage.clear();
    setUser(null);
  };

  const logout = async () => {
    try {
      await api.post(
        "/logout",
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );
    } catch (e) {}

    logoutLocal();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
