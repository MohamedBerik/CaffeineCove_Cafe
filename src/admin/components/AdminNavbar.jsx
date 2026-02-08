import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [erpOpen, setErpOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  return (
    <nav className="bg-white shadow fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center">
            <button
              className="text-xl font-bold"
              onClick={() => navigate("/admin/erp")}
            >
              ERP Dashboard
            </button>
          </div>

          {/* Hamburger (Mobile) */}
          <div className="sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Links (Desktop) */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <Dropdown
              label="ERP Modules ⚙️"
              open={erpOpen}
              setOpen={setErpOpen}
            >
              <DropdownItem
                onClick={() => navigate("/admin/erp/orders/create")}
              >
                📦 Create Order
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/erp/orders")}>
                🛒 Orders
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/erp/invoices")}>
                💰 Invoices
              </DropdownItem>
              <DropdownItem
                onClick={() => navigate("/admin/erp/purchase-orders")}
              >
                📦 Purchase Orders
              </DropdownItem>
            </Dropdown>

            <Dropdown label="Data Tables" open={dataOpen} setOpen={setDataOpen}>
              <DropdownItem onClick={() => navigate("/admin/customers")}>
                👥 Customers
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/users")}>
                👤 Users
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/products")}>
                📦 Products
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/suppliers")}>
                🏭 Suppliers
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/employees")}>
                🧑‍💼 Employees
              </DropdownItem>
              <DropdownItem onClick={() => navigate("/admin/reservations")}>
                📅 Reservations
              </DropdownItem>
            </Dropdown>

            <button
              className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden px-2 pt-2 pb-3 space-y-1 bg-white border-t">
          <MobileDropdown label="ERP Modules ⚙️">
            <MobileItem onClick={() => navigate("/admin/erp/orders/create")}>
              📦 Create Order
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/erp/orders")}>
              🛒 Orders
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/erp/invoices")}>
              💰 Invoices
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/erp/purchase-orders")}>
              📦 Purchase Orders
            </MobileItem>
          </MobileDropdown>

          <MobileDropdown label="Data Tables">
            <MobileItem onClick={() => navigate("/admin/customers")}>
              👥 Customers
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/users")}>
              👤 Users
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/products")}>
              📦 Products
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/suppliers")}>
              🏭 Suppliers
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/employees")}>
              🧑‍💼 Employees
            </MobileItem>
            <MobileItem onClick={() => navigate("/admin/reservations")}>
              📅 Reservations
            </MobileItem>
          </MobileDropdown>

          <button
            className="w-full text-left bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

// ---------- Desktop Dropdown ----------
const Dropdown = ({ label, open, setOpen, children }) => (
  <div className="relative">
    <button
      onClick={() => setOpen(!open)}
      className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
    >
      <span>{label}</span>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    {open && (
      <div className="absolute mt-2 w-48 bg-white border rounded-md shadow-lg">
        {children}
      </div>
    )}
  </div>
);

const DropdownItem = ({ children, onClick }) => (
  <button
    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
    onClick={onClick}
  >
    {children}
  </button>
);

// ---------- Mobile Dropdown ----------
const MobileDropdown = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex justify-between items-center"
      >
        <span>{label}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          )}
        </svg>
      </button>
      {open && <div className="pl-4">{children}</div>}
    </div>
  );
};

const MobileItem = ({ children, onClick }) => (
  <button
    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
    onClick={onClick}
  >
    {children}
  </button>
);

export default AdminNavbar;
