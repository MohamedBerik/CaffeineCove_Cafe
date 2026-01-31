import { useAuth } from "../../context/AuthContext";
import { NavLink } from "react-router-dom";

const AdminNavbar = () => {
  const { logout } = useAuth();

  const adminLinks = [
    { name: "Users", path: "/admin/users" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Products", path: "/admin/products" },
    { name: "Customers", path: "/admin/customers" },
    { name: "Orders", path: "/erp/orders" }, // ERP
    { name: "Invoices", path: "/erp/invoices" }, // ERP
    { name: "Purchase Orders", path: "/erp/purchase-orders" }, // ERP
    { name: "Employees", path: "/admin/employees" },
    { name: "Sales", path: "/admin/sales" },
    { name: "Reservations", path: "/admin/reservations" },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
      <NavLink className="navbar-brand" to="/admin/dashboard">
        Dashboard
      </NavLink>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarScroll"
        aria-controls="navbarScroll"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarScroll">
        <ul
          className="navbar-nav mr-auto my-2 my-lg-0 navbar-nav-scroll"
          style={{ maxHeight: 100 }}
        >
          {adminLinks.map((link) => (
            <li className="nav-item" key={link.path}>
              <NavLink
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
                to={link.path}
              >
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="d-flex">
          <button className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
