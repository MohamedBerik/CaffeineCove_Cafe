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

      {/* Mobile Menu Button - يظهر فقط على الشاشات الصغيرة */}
      <button
        className="mobile-sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar Drawer - نفس فكرة Navbar.js */}
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

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <div className="container-fluid" style={{ paddingTop: 86 }}>
        <div className="row g-3">
          {/* Sidebar - Desktop (يظهر فقط على الشاشات الكبيرة) */}
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
