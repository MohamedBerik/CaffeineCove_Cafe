import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [erpOpen, setErpOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  return (
    <nav className="bg-white shadow fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center">
            <button
              className="text-xl font-bold"
              onClick={() => navigate("/admin/erp")}
            >
              ERP Dashboard
            </button>
          </div>

          {/* Links */}
          <div className="flex space-x-4 items-center">
            {/* ERP Dropdown */}
            <div className="relative">
              <button
                onClick={() => setErpOpen(!erpOpen)}
                className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
              >
                <span>ERP Modules ⚙️</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {erpOpen && (
                <div className="absolute mt-2 w-48 bg-white border rounded-md shadow-lg">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/erp/orders/create")}
                  >
                    📦 Create Order
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/erp/orders")}
                  >
                    🛒 Orders
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/erp/invoices")}
                  >
                    💰 Invoices
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/erp/purchase-orders")}
                  >
                    📦 Purchase Orders
                  </button>
                </div>
              )}
            </div>

            {/* Data Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDataOpen(!dataOpen)}
                className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
              >
                <span>Data Tables</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {dataOpen && (
                <div className="absolute mt-2 w-48 bg-white border rounded-md shadow-lg">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/customers")}
                  >
                    👥 Customers
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/users")}
                  >
                    👤 Users
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/products")}
                  >
                    📦 Products
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/suppliers")}
                  >
                    🏭 Suppliers
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/employees")}
                  >
                    🧑‍💼 Employees
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => navigate("/admin/reservations")}
                  >
                    📅 Reservations
                  </button>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
