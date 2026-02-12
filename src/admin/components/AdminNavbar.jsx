import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [erpOpen, setErpOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activePath, setActivePath] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    // Update active path
    setActivePath(location.pathname);

    // Close dropdowns on route change
    setErpOpen(false);
    setDataOpen(false);

    return () => window.removeEventListener("resize", handleResize);
  }, [location]);

  const go = (path) => {
    setMenuOpen(false);
    setErpOpen(false);
    setDataOpen(false);
    navigate(path);
  };

  // أضف هذا useEffect لإغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      // إذا كان النقر خارج القوائم المنسدلة والنافبار
      if (
        !event.target.closest(".nav-item") &&
        !event.target.closest(".navbar-toggler")
      ) {
        setErpOpen(false);
        setDataOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return activePath.includes(path) ? "active" : "";
  };

  const NavItem = ({ path, icon, label, children, isDropdown }) => {
    if (isDropdown) {
      return (
        <li className={`nav-item dropdown ${isActive(path)}`}>
          <button
            className={`nav-link dropdown-toggle ${erpOpen || dataOpen ? "show" : ""}`}
            onClick={() => {
              if (path === "/admin/erp") {
                setErpOpen(!erpOpen);
                setDataOpen(false);
              } else {
                setDataOpen(!dataOpen);
                setErpOpen(false);
              }
            }}
            aria-expanded={erpOpen || dataOpen}
          >
            <i className={icon}></i>
            <span>{label}</span>
          </button>
          {children}
        </li>
      );
    }

    return (
      <li className={`nav-item ${isActive(path)}`}>
        <button className="nav-link" onClick={() => go(path)}>
          <i className={icon}></i>
          <span>{label}</span>
        </button>
      </li>
    );
  };

  const DropdownMenu = ({ items, isOpen, type }) => (
    <div className={`dropdown-menu ${isOpen ? "show" : ""}`}>
      {items.map((item) => (
        <button
          key={item.path}
          className={`dropdown-item ${activePath === item.path ? "active" : ""}`}
          onClick={() => go(item.path)}
        >
          <i className={item.icon}></i>
          <span>{item.label}</span>
          {activePath === item.path && <i className="fas fa-check ms-auto"></i>}
        </button>
      ))}
    </div>
  );

  const erpItems = [
    {
      path: "/admin/erp/orders/create",
      icon: "fas fa-plus-circle",
      label: "Create Order",
    },
    {
      path: "/admin/erp/orders",
      icon: "fas fa-shopping-cart",
      label: "Orders",
    },
    {
      path: "/admin/erp/invoices",
      icon: "fas fa-file-invoice-dollar",
      label: "Invoices",
    },
    {
      path: "/admin/erp/purchase-orders/create",
      icon: "fas fa-clipboard-list",
      label: "Create Purchase Order",
    },
    {
      path: "/admin/erp/purchase-orders",
      icon: "fas fa-clipboard-list",
      label: "Purchase Orders",
    },
  ];

  const dataItems = [
    { path: "/admin/customers", icon: "fas fa-users", label: "Customers" },
    { path: "/admin/users", icon: "fas fa-user", label: "Users" },
    { path: "/admin/products", icon: "fas fa-box", label: "Products" },
    { path: "/admin/suppliers", icon: "fas fa-industry", label: "Suppliers" },
    { path: "/admin/employees", icon: "fas fa-user-tie", label: "Employees" },
    {
      path: "/admin/reservations",
      icon: "fas fa-calendar-alt",
      label: "Reservations",
    },
  ];

  return (
    <>
      <nav className="admin-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <div className="navbar-brand" onClick={() => go("/admin/erp")}>
            <i className="fas fa-chart-line"></i>
            <div className="brand-text">
              <span className="brand-title">ERP System</span>
              <span className="brand-subtitle">Admin Panel</span>
            </div>
          </div>

          {/* Toggle for mobile */}
          <button
            className="navbar-toggler"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <i className={`fas fa-${menuOpen ? "times" : "bars"}`}></i>
          </button>

          {/* Navigation Items */}
          <div className={`navbar-collapse ${menuOpen ? "show" : ""}`}>
            <ul className="navbar-nav">
              <NavItem
                path="/admin/erp"
                icon="fas fa-tachometer-alt"
                label="Dashboard"
                isDropdown={false}
              />

              <NavItem
                path="/admin/erp"
                icon="fas fa-cogs"
                label="ERP Modules"
                isDropdown={true}
              >
                <DropdownMenu items={erpItems} isOpen={erpOpen} type="erp" />
              </NavItem>

              <NavItem
                path="/admin/data"
                icon="fas fa-database"
                label="Data Management"
                isDropdown={true}
              >
                <DropdownMenu items={dataItems} isOpen={dataOpen} type="data" />
              </NavItem>
            </ul>

            {/* User Section */}
            <div className="navbar-user">
              <div className="user-info">
                <div className="user-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {user?.name || "Administrator"}
                  </span>
                  <span className="user-role">Admin</span>
                </div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                {!isMobile && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && menuOpen && (
          <div className="navbar-overlay" onClick={() => setMenuOpen(false)} />
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="navbar-spacer"></div>
    </>
  );
};

export default AdminNavbar;
