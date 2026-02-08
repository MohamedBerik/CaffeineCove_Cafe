// ERPLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

const ERPLayout = () => (
  <div>
    <AdminNavbar />
    <div className="container my-4">
      <Outlet /> {/* هنا تظهر كل الصفحات الفرعية */}
    </div>
  </div>
);

export default ERPLayout;
