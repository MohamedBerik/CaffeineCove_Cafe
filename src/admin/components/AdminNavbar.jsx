import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
      <a className="navbar-brand" href="/admin/dashboard">
        Dashboard
      </a>

      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarERP"
        aria-controls="navbarERP"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarERP">
        <ul className="navbar-nav mr-auto">
          {/* ERP Dropdown */}
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              id="erpDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              ERP Modules ⚙️
            </a>
            <div className="dropdown-menu" aria-labelledby="erpDropdown">
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/orders")}
              >
                🛒 Orders
              </button>
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/invoices")}
              >
                💰 Invoices
              </button>
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/purchase-orders")}
              >
                📦 Purchase Orders
              </button>
              <button
                className="dropdown-item"
                onClick={() => navigate("/admin/dashboard/finance")}
              >
                📊 Finance
              </button>
            </div>
          </li>

          {/* Quick Access Links */}
          <li className="nav-item">
            <a className="nav-link" href="/admin/users">
              👤 Users
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/products">
              📦 Products
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/admin/reservations">
              📅 Reservations
            </a>
          </li>
        </ul>

        {/* Logout Button */}
        <button className="btn btn-danger ml-auto" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
