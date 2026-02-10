import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const AdminNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [erpOpen, setErpOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [activeModule, setActiveModule] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", handleResize);

    // Set active module based on current path
    const path = location.pathname;
    if (path.includes("/erp/orders")) setActiveModule("orders");
    else if (path.includes("/erp/invoices")) setActiveModule("invoices");
    else if (path.includes("/erp/purchase-orders"))
      setActiveModule("purchase-orders");
    else if (path.includes("/customers")) setActiveModule("customers");
    else if (path.includes("/products")) setActiveModule("products");
    else if (path.includes("/users")) setActiveModule("users");
    else setActiveModule("dashboard");

    return () => window.removeEventListener("resize", handleResize);
  }, [location]);

  const go = (path) => {
    setMenuOpen(false);
    setErpOpen(false);
    setDataOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const closeAllMenus = () => {
    setErpOpen(false);
    setDataOpen(false);
    if (isMobile) setMenuOpen(false);
  };

  const NavLink = ({ path, icon, label, badge }) => (
    <button
      className={`nav-link ${location.pathname.includes(path) ? "active" : ""}`}
      onClick={() => go(path)}
    >
      <i className={icon}></i>
      <span>{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );

  return (
    <nav className="admin-navbar">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-nav-header">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`fas fa-${menuOpen ? "times" : "bars"}`}></i>
          </button>
          <div className="mobile-brand" onClick={() => go("/admin/erp")}>
            <i className="fas fa-chart-line"></i>
            <span>ERP System</span>
          </div>
          <button className="user-menu" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="desktop-sidebar">
          <div className="sidebar-header" onClick={() => go("/admin/erp")}>
            <i className="fas fa-chart-line"></i>
            <div className="brand-text">
              <h3>ERP System</h3>
              <p>Admin Panel</p>
            </div>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="user-details">
              <h4>{user?.name || "Admin"}</h4>
              <p>Administrator</p>
            </div>
          </div>

          <div className="nav-section">
            <h4 className="section-title">ERP Modules</h4>
            <NavLink
              path="/admin/erp"
              icon="fas fa-tachometer-alt"
              label="Dashboard"
            />
            <NavLink
              path="/admin/erp/orders/create"
              icon="fas fa-plus-circle"
              label="Create Order"
            />
            <NavLink
              path="/admin/erp/orders"
              icon="fas fa-shopping-cart"
              label="Orders"
              badge={activeModule === "orders" ? "●" : ""}
            />
            <NavLink
              path="/admin/erp/invoices"
              icon="fas fa-file-invoice-dollar"
              label="Invoices"
              badge={activeModule === "invoices" ? "●" : ""}
            />
            <NavLink
              path="/admin/erp/purchase-orders"
              icon="fas fa-clipboard-list"
              label="Purchase Orders"
              badge={activeModule === "purchase-orders" ? "●" : ""}
            />
          </div>

          <div className="nav-section">
            <h4 className="section-title">Data Management</h4>
            <NavLink
              path="/admin/customers"
              icon="fas fa-users"
              label="Customers"
              badge={activeModule === "customers" ? "●" : ""}
            />
            <NavLink
              path="/admin/users"
              icon="fas fa-user"
              label="Users"
              badge={activeModule === "users" ? "●" : ""}
            />
            <NavLink
              path="/admin/products"
              icon="fas fa-box"
              label="Products"
              badge={activeModule === "products" ? "●" : ""}
            />
            <NavLink
              path="/admin/suppliers"
              icon="fas fa-industry"
              label="Suppliers"
            />
            <NavLink
              path="/admin/employees"
              icon="fas fa-user-tie"
              label="Employees"
            />
            <NavLink
              path="/admin/reservations"
              icon="fas fa-calendar-alt"
              label="Reservations"
            />
          </div>

          <div className="nav-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && menuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        >
          <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sidebar-header">
              <div className="user-info-mobile">
                <div className="user-avatar-mobile">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div>
                  <h4>{user?.name || "Admin"}</h4>
                  <p>Administrator</p>
                </div>
              </div>
            </div>

            <div className="mobile-nav-section">
              <h5>ERP Modules</h5>
              <NavLink
                path="/admin/erp"
                icon="fas fa-tachometer-alt"
                label="Dashboard"
              />
              <NavLink
                path="/admin/erp/orders/create"
                icon="fas fa-plus-circle"
                label="Create Order"
              />
              <NavLink
                path="/admin/erp/orders"
                icon="fas fa-shopping-cart"
                label="Orders"
              />
              <NavLink
                path="/admin/erp/invoices"
                icon="fas fa-file-invoice-dollar"
                label="Invoices"
              />
              <NavLink
                path="/admin/erp/purchase-orders"
                icon="fas fa-clipboard-list"
                label="Purchase Orders"
              />
            </div>

            <div className="mobile-nav-section">
              <h5>Data Management</h5>
              <NavLink
                path="/admin/customers"
                icon="fas fa-users"
                label="Customers"
              />
              <NavLink path="/admin/users" icon="fas fa-user" label="Users" />
              <NavLink
                path="/admin/products"
                icon="fas fa-box"
                label="Products"
              />
              <NavLink
                path="/admin/suppliers"
                icon="fas fa-industry"
                label="Suppliers"
              />
              <NavLink
                path="/admin/employees"
                icon="fas fa-user-tie"
                label="Employees"
              />
              <NavLink
                path="/admin/reservations"
                icon="fas fa-calendar-alt"
                label="Reservations"
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
