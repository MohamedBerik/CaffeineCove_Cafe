import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import ErpNav from "./components/ErpNav";

const ERPDashboard = () => {
  return (
    <>
      <AdminNavbar />

      <div className="container-fluid" style={{ paddingTop: 86 }}>
        <div className="row g-3">
          <div className="col-12 col-xl-3 d-none d-xl-block">
            <div style={{ position: "sticky", top: 86 }}>
              <ErpNav />
            </div>
          </div>

          <div className="col-12 col-xl-9">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default ERPDashboard;
