// src/admin/erp/ERPDashboard.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

const ERPDashboard = () => {
  return (
    <>
      <AdminNavbar />

      <div style={{ paddingTop: 70, paddingLeft: 20, paddingRight: 20 }}>
        <Outlet />
      </div>
    </>
  );
};

export default ERPDashboard;
