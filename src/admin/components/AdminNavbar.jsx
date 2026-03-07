import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = () => {
    // لو داخل ERP يرجع للـ ERP dashboard
    if (location.pathname.startsWith("/admin/erp")) {
      navigate("/admin/erp");
      return;
    }

    // fallback
    navigate("/admin/erp");
  };

  const handleLogout = () => {
    logout();
  };

  const userRoleLabel = () => {
    if (user?.is_super_admin) return "Super Admin";
    if (user?.role) return user.role;
    return "Admin";
  };

  return (
    <>
      <nav className="admin-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <button
            type="button"
            className="navbar-brand border-0 bg-transparent"
            onClick={goHome}
          >
            <i className="fas fa-chart-line"></i>

            <div className="brand-text">
              <span className="brand-title">ERP System</span>
              <span className="brand-subtitle">Clinic Admin Panel</span>
            </div>
          </button>

          {/* Right section */}
          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user-circle"></i>
              </div>

              <div className="user-details">
                <span className="user-name">
                  {user?.name || "Administrator"}
                </span>
                <span className="user-role">{userRoleLabel()}</span>
              </div>
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="navbar-spacer"></div>
    </>
  );
};

export default AdminNavbar;
