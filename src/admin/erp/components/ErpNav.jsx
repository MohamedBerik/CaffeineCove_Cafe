import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";

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

  const hasPermission = (permission) => {
    // Super admin يشوف الكل
    if (user?.is_super_admin) return true;

    const permissions = user?.permissions;

    // لو مفيش permissions في الـ user حاليًا، ما نكسرش الواجهة
    if (!permissions) return true;

    // Array format
    if (Array.isArray(permissions)) {
      return permissions.includes(permission);
    }

    // Object format
    if (typeof permissions === "object") {
      return Boolean(permissions[permission]);
    }

    return true;
  };

  const visibleItems = navItems.filter((item) =>
    hasPermission(item.permission),
  );

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
