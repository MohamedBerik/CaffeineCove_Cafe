import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin/erp", label: "Dashboard", icon: "fas fa-chart-pie", end: true },
  { to: "/admin/erp/patients", label: "Patients", icon: "fas fa-users" },
  {
    to: "/admin/erp/appointments",
    label: "Appointments",
    icon: "fas fa-calendar-check",
  },
  {
    to: "/admin/erp/dental-records",
    label: "Dental Records",
    icon: "fas fa-tooth",
  },
  {
    to: "/admin/erp/treatment-plans",
    label: "Treatment Plans",
    icon: "fas fa-notes-medical",
  },
  {
    to: "/admin/erp/invoices",
    label: "Invoices",
    icon: "fas fa-file-invoice-dollar",
  },
  { to: "/admin/erp/orders", label: "Orders", icon: "fas fa-shopping-cart" },
  {
    to: "/admin/erp/purchase-orders",
    label: "Purchase Orders",
    icon: "fas fa-truck-loading",
  },
];

export default function ErpNav() {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-2">
        <div className="small text-muted px-2 py-1 text-uppercase fw-semibold">
          ERP Navigation
        </div>

        <div className="nav nav-pills flex-column gap-1">
          {navItems.map((item) => (
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
