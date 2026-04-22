import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "react-i18next";

const erpNavItems = [
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

const saasNavItems = [
  {
    to: "/admin/saas",
    labelKey: "SaaS Dashboard",
    icon: "fas fa-chart-pie",
    end: true,
  },
  {
    to: "/admin/companies",
    labelKey: "Companies",
    icon: "fas fa-building",
  },
  {
    to: "/admin/companies/create",
    labelKey: "Add Company",
    icon: "fas fa-plus-circle",
  },
  {
    to: "/admin/plans",
    labelKey: "Plans & Pricing",
    icon: "fas fa-tags",
  },
  {
    to: "/admin/subscriptions",
    labelKey: "Subscriptions",
    icon: "fas fa-credit-card",
  },
  {
    to: "/admin/reports/saas",
    labelKey: "SaaS Reports",
    icon: "fas fa-chart-line",
  },
  {
    to: "/admin/activity-logs",
    labelKey: "Activity Logs",
    icon: "fas fa-history",
  },
  {
    to: "/admin/settings/saas",
    labelKey: "Platform Settings",
    icon: "fas fa-cog",
  },
];

export default function ErpNav() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // ✅ تحديد إذا كنا في SaaS Mode ولا ERP Mode
  const isSaaSMode =
    location.pathname.startsWith("/admin/saas") ||
    location.pathname.startsWith("/admin/companies") ||
    location.pathname.startsWith("/admin/plans") ||
    location.pathname.startsWith("/admin/subscriptions") ||
    location.pathname.startsWith("/admin/reports/saas") ||
    location.pathname.startsWith("/admin/settings/saas");

  const hasPermission = (permission) => {
    if (user?.is_super_admin) return true;
    const permissions = user?.permissions;
    if (!permissions) return true;
    if (Array.isArray(permissions)) {
      return permissions.includes(permission);
    }
    if (typeof permissions === "object") {
      return Boolean(permissions[permission]);
    }
    return true;
  };

  // ✅ اختيار العناصر حسب الوضع
  const items = isSaaSMode ? saasNavItems : erpNavItems;

  // ✅ لو ERP Mode، فلترة حسب الصلاحيات
  const visibleItems = isSaaSMode
    ? items
    : items.filter((item) => hasPermission(item.permission));

  // ✅ العنوان يتغير حسب الوضع
  const headerTitle = isSaaSMode ? t("SaaS Platform") : t("ERP Navigation");
  const headerIcon = isSaaSMode ? "fas fa-cloud" : "fas fa-compass";

  return (
    <div className="erp-nav-card">
      <div className="erp-nav-header">
        <i className={headerIcon}></i>
        <span>{headerTitle}</span>
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
