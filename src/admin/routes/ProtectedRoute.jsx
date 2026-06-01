import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

export function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const tenantId = localStorage.getItem("selectedCompany");
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <i className="fas fa-chart-line fa-3x fa-spin text-primary mb-3"></i>
        <p className="text-muted fw-semibold">{t("Loading ...")}</p>
      </div>
    );
  }
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
