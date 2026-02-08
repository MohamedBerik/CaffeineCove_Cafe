import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
      <button
        className="navbar-brand btn btn-link"
        onClick={() => navigate("/admin/erp")}
      >
        ERP Dashboard
      </button>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarERP"
        aria-controls="navbarERP"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarERP">
        <ul className="navbar-nav mr-auto">
          {/* ================= ERP ================= */}
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              id="erpDropdown"
              role="button"
              data-bs-toggle="dropdown"
            >
              ERP Modules ⚙️
            </a>

            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/erp/orders/create")}
              >
                📦 Create Order
              </button>
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/erp/orders")}
              >
                🛒 Orders
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/erp/invoices")}
              >
                💰 Invoices
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/erp/purchase-orders")}
              >
                📦 Purchase Orders
              </button>
            </div>
          </li>

          {/* ================= OLD CRUD ================= */}

          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              id="dataDropdown"
              role="button"
              data-bs-toggle="dropdown"
            >
              Data Tables
            </a>

            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/customers")}
              >
                👥 Customers
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/users")}
              >
                👤 Users
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/products")}
              >
                📦 Products
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/suppliers")}
              >
                🏭 Suppliers
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/employees")}
              >
                🧑‍💼 Employees
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/reservations")}
              >
                📅 Reservations
              </button>
            </div>
          </li>
        </ul>

        <button className="btn btn-danger ml-auto" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
