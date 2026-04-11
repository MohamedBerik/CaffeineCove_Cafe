import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAlerts } from "../../context/AlertContext";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { alerts, unreadCount, markAllAsRead, markAsRead } = useAlerts();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const goHome = () => {
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
    setShowDropdown(false);
    navigate("/admin/erp/notifications");
  };

  const handleBellClick = () => {
    setShowDropdown((prev) => {
      const next = !prev;

      if (next) {
        markAllAsRead();
      }

      return next;
    });
  };

  const handleAlertClick = async (alert, e) => {
    e.stopPropagation();
    await markAsRead(alert.id);
    navigate("/admin/erp/notifications");
  };

  // ✅ getAlertIcon مع useCallback
  const getAlertIcon = useCallback((code) => {
    switch (code) {
      case "LOW_STOCK":
        return "📦";
      case "PAYMENT_FAILED":
        return "💳";
      case "NEW_ORDER":
        return "🛒";
      case "APPOINTMENT_BOOKED":
        return "📅";
      case "APPOINTMENT_CANCELLED":
        return "❌";
      default:
        return "🔔";
    }
  }, []);

  return (
    <>
      <nav className="admin-navbar" dir="ltr">
        <div className="navbar-container">
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

          <div className="navbar-actions">
            <button
              type="button"
              className="lang-switch-btn"
              onClick={toggleLanguage}
            >
              <i
                className={`fas ${i18n.language === "en" ? "fa-language" : "fa-globe"}`}
              ></i>
              <span>{i18n.language === "en" ? "AR" : "EN"}</span>
            </button>

            <div ref={dropdownRef}>
              <button
                type="button"
                className={`notification-bell ${showDropdown ? "open" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBellClick();
                }}
                aria-label={t("Notifications")}
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <>
                  <div
                    className="notification-overlay"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div
                    className={`notification-dropdown global ${showDropdown ? "open" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="dropdown-header">
                      <i className="fas fa-bell"></i> {t("Notifications")}
                    </div>
                    {!Array.isArray(alerts) || alerts.length === 0 ? (
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
                            onClick={(e) => handleAlertClick(alert, e)}
                          >
                            <span className="alert-icon">
                              {getAlertIcon(alert.code)}
                            </span>
                            <div className="notification-content">
                              <div className="notification-title">
                                {alert.message}
                              </div>
                              <div className="notification-meta">
                                <span
                                  className={`priority-badge ${alert.priority}`}
                                >
                                  {alert.priority}
                                </span>
                                <span className="notification-time">
                                  {formatTime(alert.time || alert.triggered_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="dropdown-footer">
                      <button onClick={openAlerts} className="see-all-btn">
                        {t("See All Notifications")}
                        <i class="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
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
