import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

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

  return children;
}
