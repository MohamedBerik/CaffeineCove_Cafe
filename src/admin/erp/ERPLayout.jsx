// ERPLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

const ERPLayout = () => {
  return (
    <div>
      <AdminNavbar />
      <div className="container my-4">
        <Outlet /> {/* هنا كل صفحة فرعية هتظهر */}
      </div>
    </div>
  );
};

export default ERPLayout;
