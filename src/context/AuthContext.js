import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/axios";
import echoService from "../services/echo";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient(); // ✅ للوصول إلى الكاش

  const logoutLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("active_branch_id");
    sessionStorage.clear();
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const res = await api.get("/me");
      const userData = res.data.user || res.data;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Failed to load user", err);
      setUser(null);
      if (err.response?.status === 401) logoutLocal();
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser().finally(() => setLoading(false));
    } else {
      logoutLocal();
      setLoading(false);
    }
  }, []);

  const login = async (userData, token) => {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const isAdmin = userData?.is_super_admin || userData?.role === "admin";
    const initialCompany = userData?.company_id || "global";
    const initialBranch = isAdmin ? "all" : (userData?.branch_id ?? "all");
    localStorage.setItem("selectedCompany", initialCompany);
    localStorage.setItem("selectedBranchId", initialBranch);
    localStorage.setItem("user", JSON.stringify(userData));

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
    echoService.disconnect();
    queryClient.clear(); // ✅ مسح الكاش بالكامل عند تسجيل الخروج
    localStorage.removeItem("token");
    try {
      await api.post("/logout");
    } catch (e) {}
    logoutLocal();
    delete api.defaults.headers.common["Authorization"];
  };

  const refreshUser = async () => await loadUser();

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
