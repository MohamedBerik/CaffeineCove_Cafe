import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const tenantId = localStorage.getItem("selectedCompany");

  // 1️⃣ حماية ثبات الشاشة أثناء التحميل
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2️⃣ فحص وجود المستخدم
  if (!user)
    return <Navigate to="/login" replace {...{ state: { from: location } }} />;

  // 3️⃣ فحص الصلاحيات والأدوار المسموحة
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

  // 4️⃣ توجيه ذكي للـ Super Admin إذا دخل الـ ERP بدون شركة مختارة
  if (user?.is_super_admin && location.pathname.startsWith("/admin/erp")) {
    if (!tenantId || tenantId === "" || tenantId === "global") {
      return <Navigate to="/admin/saas" replace />;
    }
  }

  // 5️⃣ توجيه ذكي للـ Super Admin إذا حاول دخول الـ SaaS ومعه شركة مختارة
  if (user?.is_super_admin && location.pathname.startsWith("/admin/saas")) {
    if (tenantId && tenantId !== "" && tenantId !== "global") {
      return <Navigate to="/admin/erp" replace />;
    }
  }

  // ✅ [مفتاح الحل] استخدام Outlet بدلاً من children لمنع تدمير ورندرة الصفحة مجدداً
  return <Outlet />;
}
