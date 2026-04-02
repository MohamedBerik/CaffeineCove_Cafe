import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import ErpNav from "./components/ErpNav";

const ERPDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <AdminNavbar />

      {/* Mobile Menu Button */}
      <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar Drawer */}
      <div className={`sidebar-drawer ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-drawer-header">
          <i className="fas fa-chart-line"></i>
          <span>ERP System</span>
          <button className="close-sidebar" onClick={closeSidebar}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ErpNav />
      </div>

      <div className="container-fluid" style={{ paddingTop: 86 }}>
        <div className="row g-3">
          {/* Sidebar - Desktop */}
          <div className="col-12 col-xl-3 d-none d-xl-block">
            <div style={{ position: "sticky", top: 86 }}>
              <ErpNav />
            </div>
          </div>

          {/* Main Content */}
          <div className="col-12 col-xl-9">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default ERPDashboard;
