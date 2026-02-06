// src/admin/erp/ERPDashboard.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./styles/erpDashboard.css"; // لو عندك CSS مخصص للـ ERP

const ERPDashboard = () => {
  return (
    <div className="erp-dashboard d-flex">
      {/* Sidebar */}
      <nav className="erp-sidebar bg-dark text-white p-3">
        <h4 className="text-center mb-4">ERP Dashboard</h4>
        <ul className="list-unstyled">
          <li className="mb-2">
            <NavLink
              to="orders"
              className={({ isActive }) =>
                isActive ? "active-link text-white" : "text-white"
              }
            >
              Orders
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="orders/create"
              className={({ isActive }) =>
                isActive ? "active-link text-white" : "text-white"
              }
            >
              Create Order
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="invoices"
              className={({ isActive }) =>
                isActive ? "active-link text-white" : "text-white"
              }
            >
              Invoices
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="purchase-orders"
              className={({ isActive }) =>
                isActive ? "active-link text-white" : "text-white"
              }
            >
              Purchase Orders
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="erp-content flex-grow-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default ERPDashboard;
