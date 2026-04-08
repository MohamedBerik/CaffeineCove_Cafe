import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useAlerts } from "../../context/AlertContext";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { alerts, unreadCount, clearUnreadCount } = useAlerts();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

  // ✅ دالة مسح العداد عند فتح dropdown
  const handleBellClick = () => {
    setShowDropdown((prev) => !prev); // ✅ استخدام prev
    if (!showDropdown) {
      clearUnreadCount(); // ✅ بيمسح العداد لما يفتح
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

            {/* ✅ Notification Bell with Dropdown - Wrapper يشمل كل حاجة */}
            <div ref={dropdownRef}>
              <div
                className={`notification-bell ${showDropdown ? "open" : ""}`}
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 مهم - يمنع انتشار الحدث
                  handleBellClick();
                }}
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              {/* ✅ القائمة والـ overlay جوه الـ wrapper */}
              {showDropdown && (
                <>
                  <div
                    className="notification-overlay"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div
                    className={`notification-dropdown global ${showDropdown ? "open" : ""}`}
                  >
                    <div className="dropdown-header">
                      <i className="fas fa-bell"></i> {t("Notifications")}
                    </div>
                    {alerts.length === 0 ? (
                      <div className="dropdown-empty">
                        <i className="fas fa-inbox"></i>
                        <p>{t("No new notifications")}</p>
                      </div>
                    ) : (
                      <div className="dropdown-list">
                        {alerts.slice(0, 5).map((alert) => (
                          <div
                            key={alert.id}
                            className={`notification-item ${alert.priority} ${alert.read ? "read" : ""}`}
                            onClick={() => markAsRead(alert.id)}
                          >
                            <div className="notification-title">
                              {alert.message}
                            </div>
                            <div className="notification-time">
                              {formatTime(alert.time)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
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
