import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAlertState, useAlertActions } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/axios";
import { setActiveBranchId } from "../../../utils/activeBranch";
import useUserNotificationSocket from "../../../hooks/useUserNotificationSocket";
import "./AdminNavbar.css";

const AdminNavbar = ({ unreadCount, onToggleSidebar, sidebarOpen }) => {
  const { alerts, loading } = useAlertState();
  const { markAsRead, markAllAsRead } = useAlertActions();
  const { logout, user } = useAuth();
  console.log("CURRENT USER", user);
  useUserNotificationSocket(user?.id, (event) => {
    console.log("🔔 USER NOTIFICATION", event);
  });
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // --- Company Switcher State ---
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return localStorage.getItem("selectedCompany") || "";
  });
  const [companies, setCompanies] = useState([]);
  const [switching, setSwitching] = useState(false);

  // --- Branch Selector State ---
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(() => {
    const stored = localStorage.getItem("selectedBranchId");
    return stored && stored !== "" ? stored : "all";
  });

  // 🛡️ استخدام Refs لمنع الـ Infinite Loops الناتجة عن مقارنة المصفوفات
  const branchesJsonRef = useRef("");

  // ✅ جلب قائمة الشركات (مرة واحدة عند تغير الـ Role أو المعرف)
  // ✅ تثبيت التبعيات لمنع الـ re‑render loop
  const canSwitchBranch = useMemo(
    () => user?.can_switch_branch ?? false,
    [user?.can_switch_branch],
  );
  const userRole = useMemo(() => user?.role, [user?.role]);

  // ✅ جلب قائمة الشركات
  useEffect(() => {
    if (user?.is_super_admin || user?.role === "admin") {
      let cancelled = false;
      api
        .get("/companies")
        .then((res) => {
          if (!cancelled) setCompanies(res.data);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [user?.id, user?.is_super_admin, userRole]);

  // ✅ جلب الفروع وتعيين الافتراضي (باستخدام التبعيات المستقرة)
  useEffect(() => {
    if (
      !user ||
      user.is_super_admin ||
      !selectedCompany ||
      selectedCompany === "global"
    ) {
      if (branches.length > 0) setBranches([]);
      return;
    }

    let cancelled = false;

    api
      .get("/branches")
      .then((res) => {
        if (cancelled) return;
        const branchList = Array.isArray(res.data) ? res.data : [];

        const currentBranchesJson = JSON.stringify(branchList);
        if (branchesJsonRef.current !== currentBranchesJson) {
          branchesJsonRef.current = currentBranchesJson;
          setBranches(branchList);
        }

        const currentStoredBranch = localStorage.getItem("selectedBranchId");

        if (canSwitchBranch || userRole === "admin") {
          if (currentStoredBranch === "all" && selectedBranch === "all") return;
          if (currentStoredBranch === "all") {
            setSelectedBranch("all");
            return;
          }
          if (
            !currentStoredBranch ||
            !branchList.some(
              (b) => String(b.id) === String(currentStoredBranch),
            )
          ) {
            if (selectedBranch !== "all") {
              setActiveBranchId("all");
              setSelectedBranch("all");
            }
          } else if (selectedBranch !== currentStoredBranch) {
            setSelectedBranch(currentStoredBranch);
          }
        } else {
          if (
            branchList.length > 0 &&
            (!currentStoredBranch || currentStoredBranch === "all")
          ) {
            const defaultBranch = String(branchList[0].id);
            setActiveBranchId(defaultBranch);
            setSelectedBranch(defaultBranch);
          } else if (
            currentStoredBranch &&
            selectedBranch !== currentStoredBranch
          ) {
            setSelectedBranch(currentStoredBranch);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch branches", err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompany, canSwitchBranch, userRole]);

  // ✅ تبديل الشركة
  const handleSwitch = async (companyId) => {
    if (switching) return;
    setSwitching(true);
    try {
      await api.post("/switch-company", { company_id: companyId || null });
      const valueToStore = companyId || "global";
      setSelectedCompany(valueToStore);
      localStorage.setItem("selectedCompany", valueToStore);
      window.dispatchEvent(
        new CustomEvent("companyChanged", {
          detail: { companyId: valueToStore },
        }),
      );
      setSelectedBranch("all");
      setActiveBranchId("all");

      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          ["dashboard", "activityLogs", "subscription-status"].includes(
            query.queryKey[0],
          ),
      });

      navigate(companyId ? "/admin/erp" : "/admin/saas");
    } catch (error) {
      console.error("Failed to switch company", error);
    } finally {
      setSwitching(false);
    }
  };

  // ✅ تبديل الفرع
  // ✅ تبديل الفرع ديناميكياً مع تحديث الـ URL والنظام كاملاً
  // ✅ تبديل الفرع وتحديث المتصفح فوراً بالصيغة الموحدة branch_id
  const handleBranchChange = (e) => {
    const value = e.target.value;
    if (value === selectedBranch) return;

    setSelectedBranch(value);
    localStorage.setItem("selectedBranchId", value);

    // 🚀 إذا كنت تستخدم دالة setActiveBranchId قم بتحديثها هنا أيضاً
    if (typeof setActiveBranchId === "function") {
      setActiveBranchId(value);
    }

    // 🎯 تحديث الرابط في شريط المتصفح فوراً بالصيغة الموحدة branch_id
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    if (value && value !== "all") {
      searchParams.set("branch_id", value); // 🌟 توحيد الاسم
    } else {
      searchParams.delete("branch_id");
    }

    // سحب الرابط الجديد في الـ Router ليعيد رندرة مكونات الصفحة الحالية بالباراميتر الجديد
    navigate(`${currentPath}?${searchParams.toString()}`, { replace: true });

    // بث الحدث لتحديث الاستعلامات
    window.dispatchEvent(
      new CustomEvent("branchChanged", { detail: { branchId: value } }),
    );

    // تنظيف كاش التانستاك كويري لإجبار الداشبورد والعدادات على جلب بيانات الفرع الجديد فوراً
    queryClient.invalidateQueries({
      predicate: (query) =>
        ["dashboard", "unreadCount", "alerts", "activityLogs"].includes(
          query.queryKey[0],
        ),
    });
  };

  // ✅ تجميع الشركات حسب الحالة بنظام الكاش والميمو الصغير
  const groupedCompanies = useMemo(
    () => ({
      active: companies.filter((c) => c.status === "active"),
      trial: companies.filter((c) => c.status === "trial"),
      suspended: companies.filter((c) => c.status === "suspended"),
    }),
    [companies],
  );

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

  // ✅ تحصين الـ Query الخاص بالاشتراك
  const { data: subStatus } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const tenantId = localStorage.getItem("selectedCompany");
      if (!tenantId || tenantId === "global" || tenantId === "") return null;
      const res = await api.get("/erp/billing/status");
      return res.data.data;
    },
    retry: (failureCount, error) => {
      if (error.response?.status === 403 || error.response?.status === 429)
        return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // 🛡️ حماية إضافية ضد الـ Loops عند التنقل بين الشاشات
    refetchInterval: 600000,
    staleTime: 10 * 60 * 1000,
  });

  const showBranchSelector =
    user?.can_switch_branch &&
    selectedCompany &&
    selectedCompany !== "global" &&
    branches.length > 0;

  return (
    <>
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

      {subStatus?.is_past_due && (
        <div className="subscription-banner danger">
          <i className="fas fa-exclamation-triangle"></i>
          {t("Your payment is past due. Please update your payment method.")}
          <Link to="/admin/erp/billing">{t("Update Payment")}</Link>
        </div>
      )}

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
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label={t("Toggle navigation")}
          >
            <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
          </button>
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
                  {groupedCompanies.active.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showBranchSelector && (
              <div className="company-switcher-wrapper">
                <span className="company-switcher-icon branch-switcher-icon">
                  <i className="fas fa-building"></i>
                </span>
                <select
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  className="company-switcher"
                >
                  <option value="all">🔍 {t("All Branches")}</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
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
                    className="notification-dropdown global open"
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
                        {t("See All Notifications")}{" "}
                        <i className="fa-solid fa-arrow-right"></i>
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
