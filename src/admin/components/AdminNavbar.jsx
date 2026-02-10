import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [erpOpen, setErpOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  const go = (path) => {
    setMenuOpen(false);
    setErpOpen(false);
    setDataOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setErpOpen(false);
    setDataOpen(false);
    logout();
  };

  return (
    <nav className="navbar navbar-expand-sm bg-white shadow-sm fixed-top">
      <div className="container-fluid">
        {/* Brand */}
        <button
          className="navbar-brand btn btn-link text-decoration-none fw-bold"
          onClick={() => go("/admin/erp")}
        >
          ERP Dashboard
        </button>

        {/* Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto mb-2 mb-sm-0">
            {/* ERP */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                onClick={() => {
                  setErpOpen((v) => !v);
                  setDataOpen(false);
                }}
              >
                ERP Modules ⚙️
              </button>

              <div className={`dropdown-menu ${erpOpen ? "show" : ""}`}>
                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/erp/orders/create")}
                >
                  📦 Create Order
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/erp/orders")}
                >
                  🛒 Orders
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/erp/invoices")}
                >
                  💰 Invoices
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/erp/purchase-orders")}
                >
                  📦 Purchase Orders
                </button>
              </div>
            </li>

            {/* DATA */}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                onClick={() => {
                  setDataOpen((v) => !v);
                  setErpOpen(false);
                }}
              >
                Data Tables
              </button>

              <div className={`dropdown-menu ${dataOpen ? "show" : ""}`}>
                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/customers")}
                >
                  👥 Customers
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/users")}
                >
                  👤 Users
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/products")}
                >
                  📦 Products
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/suppliers")}
                >
                  🏭 Suppliers
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/employees")}
                >
                  🧑‍💼 Employees
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => go("/admin/reservations")}
                >
                  📅 Reservations
                </button>
              </div>
            </li>
          </ul>

          <div className="d-flex">
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
