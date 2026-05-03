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
    permission: "appointments.view", // تم التغيير إلى appointments.view
  },
  {
    to: "/admin/erp/doctors",
    labelKey: "Doctors",
    icon: "fas fa-user-md",
    permission: "doctors.view",
  },
  {
    to: "/admin/erp/procedures",
    labelKey: "Procedures",
    icon: "fas fa-procedures",
    permission: "procedures.view",
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
    permission: "dental_records.view",
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
    permission: "purchases.manage",
  },
  {
    to: "/admin/erp/reports",
    labelKey: "Reports",
    icon: "fas fa-chart-bar",
    permission: "reports.view",
  },
  {
    to: "/admin/erp/settings/clinic",
    labelKey: "Clinic Settings",
    icon: "fas fa-hospital",
    permission: "settings.manage",
  },
  {
    to: "/admin/erp/billing",
    labelKey: "Billing",
    icon: "fas fa-credit-card",
    permission: "finance.view",
  },
];

const saasNavItems = [
  {
    to: "/admin/saas",
    labelKey: "SaaS Dashboard",
    icon: "fas fa-chart-pie",
    end: true,
    permission: "saas.dashboard",
  },
  {
    to: "/admin/companies",
    labelKey: "Companies",
    icon: "fas fa-building",
    permission: "companies.manage",
  },
  {
    to: "/admin/companies/create",
    labelKey: "Add Company",
    icon: "fas fa-plus-circle",
    permission: "companies.manage",
  },
  {
    to: "/admin/plans",
    labelKey: "Plans & Pricing",
    icon: "fas fa-tags",
    permission: "plans.manage",
  },
  {
    to: "/admin/subscriptions",
    labelKey: "Subscriptions",
    icon: "fas fa-credit-card",
    permission: "subscriptions.manage",
  },
  {
    to: "/admin/reports/saas",
    labelKey: "SaaS Reports",
    icon: "fas fa-chart-line",
    permission: "reports.view",
  },
  {
    to: "/admin/activity-logs",
    labelKey: "Activity Logs",
    icon: "fas fa-history",
    permission: "activity_logs.view",
  },
  {
    to: "/admin/settings/saas",
    labelKey: "Platform Settings",
    icon: "fas fa-cog",
    permission: "settings.manage",
  },
];

export default function ErpNav() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const isSaaSMode =
    location.pathname.startsWith("/admin/saas") ||
    location.pathname.startsWith("/admin/companies") ||
    location.pathname.startsWith("/admin/plans") ||
    location.pathname.startsWith("/admin/subscriptions") ||
    location.pathname.startsWith("/admin/reports/saas") ||
    location.pathname.startsWith("/admin/activity-logs") ||
    location.pathname.startsWith("/admin/settings/saas");

  const hasPermission = (permission) => {
    if (user?.is_super_admin) return true;

    // استخدام الكائن الجديد إن وُجد، وإلا العودة إلى المصفوفة
    const permMap = user?.permissions_map || user?.permissions;

    // طباعة لتشخيص المشكلة (يمكن حذفها لاحقًا)
    console.log("Checking permission:", permission, "Permissions:", permMap);

    if (!permMap) return false;

    // إذا كان كائنًا
    if (typeof permMap === "object" && !Array.isArray(permMap)) {
      return permMap[permission] === true;
    }

    // إذا كانت مصفوفة (للتوافق مع النظام القديم)
    if (Array.isArray(permMap)) {
      return permMap.includes(permission);
    }

    return false;
  };

  const items = isSaaSMode ? saasNavItems : erpNavItems;
  const visibleItems = isSaaSMode
    ? items
    : items.filter((item) => hasPermission(item.permission));

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
