import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAlertState, useAlertActions } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axios";
import { useQueryClient } from "@tanstack/react-query";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { alerts, unreadCount, loading } = useAlertState();
  const { markAsRead, markAllAsRead } = useAlertActions();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return localStorage.getItem("selectedCompany") || "";
  });
  const [companies, setCompanies] = useState([]);
  const [switching, setSwitching] = useState(false);

  // ✅ جلب قائمة الشركات (لـ Super Admin فقط)
  useEffect(() => {
    if (user?.is_super_admin) {
      api.get("/companies").then((res) => setCompanies(res.data));
    }
  }, [user]);

  // ✅ تبديل الشركة
  const handleSwitch = async (companyId) => {
    if (switching) return;

    setSwitching(true);
    try {
      await api.post("/switch-company", { company_id: companyId || null });

      const valueToStore = companyId || "global";
      setSelectedCompany(valueToStore);
      localStorage.setItem("selectedCompany", valueToStore);

      queryClient.invalidateQueries();

      // ✅ توجيه ذكي بعد تبديل الشركة
      if (!companyId || companyId === "") {
        // اختار Global → SaaS Dashboard
        navigate("/admin/saas");
      } else {
        // اختار شركة → ERP Dashboard
        navigate("/admin/erp");
      }
    } catch (error) {
      console.error("Failed to switch company", error);
    } finally {
      setSwitching(false);
    }
  };

  // ✅ تجميع الشركات حسب الحالة
  const groupedCompanies = {
    active: companies.filter((c) => c.status === "active"),
    trial: companies.filter((c) => c.status === "trial"),
    suspended: companies.filter((c) => c.status === "suspended"),
  };

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
      if (next && unreadCount > 0) {
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

  const { data: subStatus } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const res = await api.get("/erp/billing/status");
      return res.data.data;
    },
    refetchInterval: 300000, // كل 5 دقائق
  });

  return (
    <>
      {/* ✅ Banner: الخطة هتنتهي قريبًا */}
      {subStatus?.is_expiring_soon && (
        <div className="subscription-banner warning">
          <i className="fas fa-clock"></i>
          {t(
            "Your plan expires in {{days}} days. Please renew to avoid interruption.",
            { days: subStatus.days_left },
          )}
          <Link to="/admin/erp/billing">{t("Renew Now")}</Link>
        </div>
      )}

      {/* ✅ Banner: الدفع متأخر */}
      {subStatus?.is_past_due && (
        <div className="subscription-banner danger">
          <i className="fas fa-exclamation-triangle"></i>
          {t("Your payment is past due. Please update your payment method.")}
          <Link to="/admin/erp/billing">{t("Update Payment")}</Link>
        </div>
      )}

      {/* ✅ Banner: لا يوجد اشتراك */}
      {subStatus?.subscription_status === "no_subscription" && (
        <div className="subscription-banner info">
          <i className="fas fa-info-circle"></i>
          {t(
            "You don't have an active subscription. Please subscribe to access all features.",
          )}
          <Link to="/admin/erp/billing">{t("Subscribe Now")}</Link>
        </div>
      )}

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
            {/* ✅ Company Switcher (يظهر فقط لـ Super Admin) - نسخة محسنة */}
            {user?.is_super_admin && (
              <div className="company-switcher-wrapper">
                <span className="company-switcher-icon">🏢</span>
                <select
                  value={selectedCompany || ""}
                  onChange={(e) => handleSwitch(e.target.value || null)}
                  className="company-switcher"
                  disabled={switching}
                >
                  <option value="">
                    🌍 {t("Global")} ({t("All Companies")})
                  </option>

                  {groupedCompanies.active.length > 0 && (
                    <optgroup label={`✅ ${t("Active")}`}>
                      {groupedCompanies.active.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedCompanies.trial.length > 0 && (
                    <optgroup label={`⏳ ${t("Trial")}`}>
                      {groupedCompanies.trial.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedCompanies.suspended.length > 0 && (
                    <optgroup label={`🚫 ${t("Suspended")}`}>
                      {groupedCompanies.suspended.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {switching && (
                  <span className="company-switcher-spinner">⏳</span>
                )}
              </div>
            )}

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
                      <button
                        onClick={openAlerts}
                        className="see-all-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t("Loading...")}
                          </>
                        ) : (
                          <>
                            {t("See All Notifications")}
                            <i className="fa-solid fa-arrow-right"></i>
                          </>
                        )}
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
