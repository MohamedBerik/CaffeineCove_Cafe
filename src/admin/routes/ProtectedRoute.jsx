import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const tenantId = localStorage.getItem("selectedCompany");
  console.log("🛡 AdminRoute", {
    loading,
    user,
  });
  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  // ✅ السماح للأدمن، السوبر أدمن، الدكتور، وموظف الاستقبال
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "doctor" ||
    user?.role === "receptionist" ||
    user?.is_super_admin === 1 ||
    user?.is_super_admin === true;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ✅ لو Super Admin وبيحاول يدخل ERP بدون Company
  if (user?.is_super_admin && location.pathname.startsWith("/admin/erp")) {
    if (!tenantId || tenantId === "" || tenantId === "global") {
      // ✅ توجيه ذكي لـ SaaS Dashboard بدل ما يرجع Error
      return <Navigate to="/admin/saas" replace />;
    }
  }

  // ✅ لو Super Admin وعنده Company وبيحاول يدخل SaaS
  if (user?.is_super_admin && location.pathname.startsWith("/admin/saas")) {
    if (tenantId && tenantId !== "" && tenantId !== "global") {
      // ✅ عنده Company مختارة → يروح لـ ERP Dashboard
      return <Navigate to="/admin/erp" replace />;
    }
  }

  return children;
}
