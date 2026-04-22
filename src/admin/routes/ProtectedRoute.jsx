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

  // ✅ منع Super Admin من دخول ERP بدون Company
  if (user?.is_super_admin && location.pathname.startsWith("/admin/erp")) {
    if (!tenantId || tenantId === "") {
      alert(
        "Global Mode is for SaaS Management only. Please select a clinic to access ERP features.",
      );
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}
