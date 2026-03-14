import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const navItems = [
  {
    to: "/admin/erp",
    label: "Dashboard",
    icon: "fas fa-chart-pie",
    end: true,
    permission: "finance.view",
  },
  {
    to: "/admin/erp/visits/start",
    label: "Start Visit",
    icon: "fas fa-stethoscope",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/doctors",
    label: "Doctors",
    icon: "fas fa-user-md",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/procedures",
    label: "Procedures",
    icon: "fas fa-procedures",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/patients",
    label: "Patients",
    icon: "fas fa-users",
    permission: "patients.view",
  },
  {
    to: "/admin/erp/appointments",
    label: "Appointments",
    icon: "fas fa-calendar-check",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/treatment-plans",
    label: "Treatment Plans",
    icon: "fas fa-notes-medical",
    permission: "treatment_plans.view",
  },
  {
    to: "/admin/erp/dental-records",
    label: "Dental Records",
    icon: "fas fa-tooth",
    permission: "patients.view",
  },
  {
    to: "/admin/erp/invoices",
    label: "Invoices",
    icon: "fas fa-file-invoice-dollar",
    permission: "finance.view",
  },
  {
    to: "/admin/erp/orders",
    label: "Orders",
    icon: "fas fa-shopping-cart",
    permission: "orders.view",
  },
  {
    to: "/admin/erp/purchase-orders",
    label: "Purchase Orders",
    icon: "fas fa-truck-loading",
    permission: "finance.view",
  },
  {
    to: "/admin/erp/appointments/calendar",
    label: "Calendar",
    icon: "fas fa-calendar-alt",
    permission: "appointments.view",
  },
  {
    to: "/admin/erp/reports",
    label: "Reports",
    icon: "fas fa-chart-bar",
    permission: "finance.view",
  },
  {
    to: "/admin/erp/settings/clinic",
    label: "Clinic Settings",
    icon: "fas fa-hospital",
    permission: "appointments.manage",
  },
];

export default function ErpNav() {
  const { user } = useAuth();

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
    <div className="card shadow-sm border-0">
      <div className="card-body p-2">
        <div className="small text-muted px-2 py-1 text-uppercase fw-semibold">
          ERP Navigation
        </div>

        <div className="nav nav-pills flex-column gap-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${
                  isActive ? "active" : "text-dark"
                }`
              }
            >
              <i className={item.icon} style={{ width: 18 }}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
