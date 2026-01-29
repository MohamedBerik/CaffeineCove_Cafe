import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// للصفحات العامة: أي مستخدم مسجل يدخل
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// للصفحات الخاصة بالـ Admin فقط
export function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}
