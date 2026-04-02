import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import "./ErpNav.css";

const navItems = [
  {
    to: "/admin/erp",
    labelKey: "Dashboard",
    icon: "fas fa-chart-pie",
    end: true,
    permission: "finance.view",
  },
  {
    to: "/admin/erp/visits/start",
    labelKey: "Start Visit",
    icon: "fas fa-stethoscope",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/doctors",
    labelKey: "Doctors",
    icon: "fas fa-user-md",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/procedures",
    labelKey: "Procedures",
    icon: "fas fa-procedures",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/patients",
    labelKey: "Patients",
    icon: "fas fa-users",
    permission: "patients.view",
  },
  {
    to: "/admin/erp/appointments",
    labelKey: "Appointments",
    icon: "fas fa-calendar-check",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/treatment-plans",
    labelKey: "Treatment Plans",
    icon: "fas fa-notes-medical",
    permission: "treatment_plans.view",
  },
  {
    to: "/admin/erp/dental-records",
    labelKey: "Dental Records",
    icon: "fas fa-tooth",
    permission: "patients.view",
  },
  {
    to: "/admin/erp/invoices",
    labelKey: "Invoices",
    icon: "fas fa-file-invoice-dollar",
    permission: "finance.view",
  },
  {
    to: "/admin/erp/orders",
    labelKey: "Orders",
    icon: "fas fa-shopping-cart",
    permission: "orders.view",
  },
  {
    to: "/admin/erp/purchase-orders",
    labelKey: "Purchase Orders",
    icon: "fas fa-truck-loading",
    permission: "finance.view",
  },
  {
    to: "/admin/erp/reports",
    labelKey: "Reports",
    icon: "fas fa-chart-bar",
    permission: "finance.view",
  },
  {
    to: "/admin/erp/settings/clinic",
    labelKey: "Clinic Settings",
    icon: "fas fa-hospital",
    permission: "appointments.manage",
  },
];

export default function ErpNav() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const hasPermission = (permission) => {
    if (user?.is_super_admin) return true;
    const permissions = user?.permissions;
    if (!permissions) return true;
    if (Array.isArray(permissions)) return permissions.includes(permission);
    if (typeof permissions === "object")
      return Boolean(permissions[permission]);
    return true;
  };

  const visibleItems = navItems.filter((item) =>
    hasPermission(item.permission),
  );

  // للشاشات الصغيرة: عرض أيقونة القائمة فقط
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        {/* Mobile Navigation Drawer */}
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-nav-header">
            <i className="fas fa-compass"></i>
            <span>{t("ERP Navigation")}</span>
          </div>
          <div className="mobile-nav-menu">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className={item.icon}></i>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Overlay */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-overlay"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}
      </>
    );
  }

  // للشاشات الكبيرة: عرض القائمة الجانبية العادية
  return (
    <div className="erp-nav-card">
      <div className="erp-nav-header">
        <i className="fas fa-compass"></i>
        <span>{t("ERP Navigation")}</span>
      </div>

      <div className="erp-nav-menu">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `erp-nav-link ${isActive ? "active" : ""}`
            }
          >
            <i className={item.icon}></i>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
