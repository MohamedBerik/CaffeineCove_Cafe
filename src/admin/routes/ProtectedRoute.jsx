import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const tenantId = localStorage.getItem("selectedCompany");

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.is_super_admin === 1 ||
    user?.is_super_admin === true;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // في AdminRoute - أضف redirect ذكي بعد Login
  if (user?.is_super_admin) {
    const tenantId = localStorage.getItem("selectedCompany");

    // لو Super Admin بدون Company → SaaS Dashboard
    if (!tenantId || tenantId === "") {
      if (!location.pathname.startsWith("/admin/saas")) {
        return <Navigate to="/admin/saas" replace />;
      }
    }

    // لو Super Admin مع Company → ERP Dashboard
    if (tenantId && tenantId !== "") {
      if (location.pathname.startsWith("/admin/saas")) {
        return <Navigate to="/admin/erp" replace />;
      }
    }
  }

  return children;
}
