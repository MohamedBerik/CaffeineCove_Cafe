import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAlertState, useAlertActions } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/axios";
import { useQueryClient } from "@tanstack/react-query";
import "./AdminNavbar.css";

const AdminNavbar = ({ unreadCount, onToggleSidebar, sidebarOpen }) => {
  const { alerts, loading } = useAlertState();
  const { markAsRead, markAllAsRead } = useAlertActions();
  const { logout, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // ✅ جلب قائمة الشركات (لـ Super Admin فقط)
  useEffect(() => {
    if (user?.is_super_admin || user?.role === "admin") {
      api.get("/companies").then((res) => setCompanies(res.data));
    }
  }, [user]);

  // ✅ تعيين selectedCompany تلقائيًا من user (مرة واحدة، بدون selectedCompany في التبعية)
  useEffect(() => {
    if (
      user?.company_id &&
      (!selectedCompany ||
        selectedCompany === "" ||
        selectedCompany === "global")
    ) {
      const companyId = String(user.company_id);
      console.log("🔧 Auto-setting selectedCompany from user:", companyId);
      setSelectedCompany(companyId);
      localStorage.setItem("selectedCompany", companyId);
    }
  }, [user]);

  // ✅ جلب قائمة الفروع (يعتمد على selectedCompany)
  // ✅ جلب قائمة الفروع مع تعيين فرع افتراضي تلقائياً لمنع الـ null state والـ Race Conditions
  // ✅ جلب قائمة الفروع مع معالجة ذكية للفرع الافتراضي حسب صلاحية المستخدم
  useEffect(() => {
    console.log("🌿 Branch fetch check:", {
      user: !!user,
      isSuperAdmin: user?.is_super_admin,
      selectedCompany,
    });

    if (!user || user.is_super_admin) {
      setBranches([]);
      return;
    }

    if (!selectedCompany || selectedCompany === "global") {
      setBranches([]);
      return;
    }

    api
      .get("/branches")
      .then((res) => {
        console.log("Branches fetched:", res.data);
        const branchList = Array.isArray(res.data) ? res.data : [];
        setBranches(branchList);

        const currentStoredBranch = localStorage.getItem("selectedBranchId");

        // 🎯 السيناريو الأول: المستخدم هو "أدمن العيادات" (يستطيع التنقل بين الفروع)
        if (user?.can_switch_branch || user?.role === "admin") {
          // لو مفيش قيمة متخزنة أصلاً، سيبها "all" عشان يشوف الداشبورد كاملة
          if (!currentStoredBranch) {
            setSelectedBranch("all");
            localStorage.setItem("selectedBranchId", "all");
            window.dispatchEvent(new Event("globalBranchChanged"));
          } else {
            // لو فيه قيمة قديمة متخزنة (سواء فرع معين أو all) احترم رغبته وسيبها زي ما هي
            setSelectedBranch(currentStoredBranch);
          }
        }

        // 🎯 السيناريو الثاني: مستخدم عادي (طبيب أو موظف مربوط بفرع محدد ولا يملك صلاحية التنقل)
        else {
          // لو مفيش فرع متخزن أو كانت قيمته "all" بالخطأ، اربطه بأول فرع تلقائياً حمايةً للداتا
          if (
            branchList.length > 0 &&
            (!currentStoredBranch ||
              currentStoredBranch === "all" ||
              currentStoredBranch === "")
          ) {
            const defaultBranchId = String(branchList[0].id);
            console.log(
              "🔒 Employee forced to default branch:",
              defaultBranchId,
            );

            setSelectedBranch(defaultBranchId);
            localStorage.setItem("selectedBranchId", defaultBranchId);
            window.dispatchEvent(new Event("globalBranchChanged"));
          }
        }
      })
      .catch((err) => {
        console.error("Branches error:", err);
        setBranches([]);
      });
  }, [user, selectedCompany]);

  // ✅ تبديل الشركة
  const handleSwitch = async (companyId) => {
    if (switching) return;

    setSwitching(true);
    try {
      await api.post("/switch-company", { company_id: companyId || null });

      const valueToStore = companyId || "global";
      setSelectedCompany(valueToStore);
      localStorage.setItem("selectedCompany", valueToStore);
      setSelectedBranch("all");
      localStorage.removeItem("selectedBranchId");

      // 🔄 Refresh user data after switching company
      await queryClient.invalidateQueries(["me"]);
      await queryClient.refetchQueries(["me"]);

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["activityLogs"],
      });

      queryClient.invalidateQueries({
        queryKey: ["subscription-status"],
      });

      if (!companyId || companyId === "") {
        navigate("/admin/saas");
      } else {
        navigate("/admin/erp");
      }
    } catch (error) {
      console.error("Failed to switch company", error);
    } finally {
      setSwitching(false);
    }
  };

  // ✅ تبديل الفرع مع إطلاق حدث فوري للداشبورد
  const handleBranchChange = async (e) => {
    const value = e.target.value;

    setSelectedBranch(value);
    localStorage.setItem("selectedBranchId", value);

    console.log("🔄 Branch changed manually to:", value);

    // 1. إعادة تعيين الكاش بدلاً من invalidation فقط
    await queryClient.resetQueries({ queryKey: ["dashboard"] });
    await queryClient.resetQueries({ queryKey: ["activityLogs"] });
    queryClient.resetQueries({ queryKey: ["subscription-status"] });

    // 2. إطلاق حدث مخصص مع تمرير branchId الجديد
    window.dispatchEvent(
      new CustomEvent("globalBranchChanged", {
        detail: { branchId: value },
      }),
    );
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
      const tenantId = localStorage.getItem("selectedCompany");
      if (!tenantId || tenantId === "global" || tenantId === "") {
        return null;
      }
      const res = await api.get("/erp/billing/status");
      return res.data.data;
    },
    retry: (failureCount, error) => {
      if (error.response?.status === 403) return false;
      return failureCount < 3;
    },
    refetchInterval: 300000,
  });

  // ✅ شروط عرض Branch Selector (مدير الشركة فقط + وجود فروع)
  const showBranchSelector =
    user?.can_switch_branch &&
    selectedCompany &&
    selectedCompany !== "global" &&
    branches.length > 0;

  console.log("📊 Debug Branch Selector:", {
    userLoaded: !!user,
    isSuperAdmin: user?.is_super_admin,
    selectedCompany,
    branch_id: user?.branch_id,
    branchesLength: branches.length,
    showBranchSelector,
  });

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
          {/* زر الهامبرغر للأجهزة الصغيرة */}
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

            {/* === Branch Selector – يظهر فقط لمدير الشركة (branch_id === null) === */}
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
