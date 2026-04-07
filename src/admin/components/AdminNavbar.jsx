import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import "./AdminNavbar.css";

const AdminNavbar = ({ unreadCount = 0 }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const goHome = () => {
    if (location.pathname.startsWith("/admin/erp")) {
      navigate("/admin/erp");
      return;
    }
    navigate("/admin/erp");
  };

  const handleLogout = () => {
    logout();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("appLanguage", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  const userRoleLabel = () => {
    if (user?.is_super_admin) return t("Super Admin");
    if (user?.role) return user.role;
    return t("Admin");
  };

  const openAlerts = () => {
    const alertsSection = document.querySelector(".alerts-container");
    if (alertsSection) {
      alertsSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <>
      <nav className="admin-navbar" dir="ltr">
        <div className="navbar-container">
          {/* Brand */}
          <button
            type="button"
            className="navbar-brand border-0 bg-transparent"
            onClick={goHome}
          >
            <i className="fas fa-chart-line"></i>

            <div className="brand-text">
              <span className="brand-title">{t("ERP System")}</span>
              <span className="brand-subtitle">{t("Clinic Admin Panel")}</span>
            </div>
          </button>

          {/* Right section */}
          <div className="navbar-actions">
            {/* Language Switcher */}
            <button
              type="button"
              className="lang-switch-btn"
              onClick={toggleLanguage}
              title={i18n.language === "en" ? "العربية" : "English"}
            >
              <i
                className={`fas ${i18n.language === "en" ? "fa-language" : "fa-globe"}`}
              ></i>
              <span>{i18n.language === "en" ? "AR" : "EN"}</span>
            </button>

            {/* ✅ Notification Bell with Dropdown */}
            <div
              className="notification-bell"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <span className="badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {showDropdown && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">{t("Notifications")}</div>
                  <div className="dropdown-empty">
                    {t("No new notifications")}
                  </div>
                  {/* هنا هتجيب الـ alerts من Context لو عايز تعرضها */}
                </div>
              )}
            </div>

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
                title={t("Logout")}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>{t("Logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="navbar-spacer"></div>
    </>
  );
};

export default AdminNavbar;
