import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import ErpNav from "../components/ErpNav";
import "../styles/dashboard-global.css";
import { useAlertState } from "../../../context/AlertContext";

const ERPDashboard = () => {
  const { unreadCount } = useAlertState();
  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ حالة القائمة الجانبية

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <AdminNavbar
        unreadCount={unreadCount}
        onToggleSidebar={toggleSidebar} // ✅ تمرير دالة التبديل
        sidebarOpen={sidebarOpen} // ✅ لمعرفة حالة الزر (أيقونة X أو بار)
      />

      <div className="container-fluid" style={{ paddingTop: 86 }}>
        <div className="row g-3">
          <div className="col-12 col-xl-3">
            <ErpNav isOpen={sidebarOpen} closeSidebar={closeSidebar} />
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
