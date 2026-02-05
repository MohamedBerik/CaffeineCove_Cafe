import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

const erpMenu = [
  {
    label: "Orders",
    path: "orders",
    icon: "fas fa-shopping-cart",
  },
  {
    label: "Create Order",
    path: "orders/create",
    icon: "fas fa-plus-circle",
  },
  {
    label: "Invoices",
    path: "invoices",
    icon: "fas fa-file-invoice",
  },
  {
    label: "Purchase Orders",
    path: "purchase-orders",
    icon: "fas fa-truck-loading",
  },
];

export default function ERPDashboard() {
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row">
          {/* ERP Sidebar */}
          <div className="col-md-2 p-0 border-right bg-light">
            <div className="p-3 font-weight-bold text-uppercase text-muted">
              ERP
            </div>

            <ul className="nav flex-column">
              {erpMenu.map((item) => (
                <li className="nav-item" key={item.path}>
                  <NavLink
                    to={item.path}
                    end
                    className={({ isActive }) =>
                      "nav-link d-flex align-items-center " +
                      (isActive ? "active font-weight-bold" : "")
                    }
                  >
                    <i className={`${item.icon} mr-2`} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ERP Content */}
          <div className="col-md-10 pt-3">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
