import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import ErpNav from "./components/ErpNav";

const ERPDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <AdminNavbar />

      {/* زر القائمة - يظهر فقط على الشاشات الصغيرة */}
      {isMobile && (
        <button className="mobile-menu-toggle" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
      )}

      {/* Off-Canvas Sidebar Drawer */}
      <div className={`offcanvas-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="offcanvas-header">
          <i className="fas fa-chart-line"></i>
          <span>ERP System</span>
          <button className="offcanvas-close" onClick={closeSidebar}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ErpNav />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="offcanvas-overlay" onClick={closeSidebar}></div>
      )}

      {/* Main Content */}
      <div className="container-fluid" style={{ paddingTop: 86 }}>
        <div className="row g-3">
          {/* Sidebar - Desktop (ثابت) */}
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
