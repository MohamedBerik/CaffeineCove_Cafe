import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaCashRegister,
  FaCalendarAlt,
} from "react-icons/fa";

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
      <a className="navbar-brand font-weight-bold" href="/admin/dashboard">
        Admin Dashboard
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
              ⚙️ ERP Modules
            </a>
            <div className="dropdown-menu" aria-labelledby="erpDropdown">
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => navigate("/admin/orders")}
              >
                <FaShoppingCart className="mr-2" /> Orders
              </button>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => navigate("/admin/invoices")}
              >
                <FaFileInvoiceDollar className="mr-2" /> Invoices
              </button>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => navigate("/admin/purchase-orders")}
              >
                <FaBox className="mr-2" /> Purchase Orders
              </button>
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={() => navigate("/admin/dashboard/finance")}
              >
                <FaCashRegister className="mr-2" /> Finance
              </button>
            </div>
          </li>

          {/* Quick Links */}
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              onClick={() => navigate("/admin/users")}
            >
              <FaUsers className="mr-1" /> Users
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              onClick={() => navigate("/admin/products")}
            >
              <FaBox className="mr-1" /> Products
            </button>
          </li>
          <li className="nav-item">
            <button
              className="nav-link btn btn-link"
              onClick={() => navigate("/admin/reservations")}
            >
              <FaCalendarAlt className="mr-1" /> Reservations
            </button>
          </li>
        </ul>

        {/* Logout */}
        <button className="btn btn-danger ml-auto" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
