// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import App from "./App";

/* ================= Public Pages ================= */
import AllAbout from "./pages/About/AllAbout";
import AllMenu from "./pages/Menu/AllMenu";
import AllTestimonials from "./pages/Testimonials/AllTestimonials";
import AllContact from "./pages/Contact/AllContact";

/* ================= Auth ================= */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";

/* ================= ERP ================= */
import ERPDashboard from "./admin/erp/ERPDashboard";
import DashboardHome from "./admin/erp/DashboardHome";
import OrdersList from "./admin/erp/components/OrdersList";
import CreateOrder from "./admin/erp/components/CreateOrder";
import OrderDetails from "./admin/erp/components/OrderDetails";
import InvoicesList from "./admin/erp/components/InvoicesList";
import InvoiceDetails from "./admin/erp/components/InvoiceDetails";
import PurchaseOrdersList from "./admin/erp/components/PurchaseOrdersList";
import CustomerStatement from "./admin/erp/customers/CustomerStatement";

/* ================= Generic CRUD (temporary) ================= */
import CrudTable from "./admin/components/CrudTable";
import CrudForm from "./admin/components/CrudForm";

/* ================= Old Admin ================= */
import AdminDashboard from "./admin/Dashboard/Dashboard";
import AdminLayout from "./admin/layouts/AdminLayout";

/* ================= Route Guards ================= */
import { ProtectedRoute, AdminRoute } from "./admin/routes/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PurchaseOrderDetails from "./admin/erp/components/PurchaseOrderDetails";
import SupplierStatement from "./admin/erp/suppliers/SupplierStatement";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <Routes>
        {/* ================= Public ================= */}
        <Route path="/" element={<App />} />
        <Route path="/about" element={<AllAbout />} />
        <Route path="/menu" element={<AllMenu />} />
        <Route path="/testimonials" element={<AllTestimonials />} />
        <Route path="/contact" element={<AllContact />} />

        {/* ================= Auth ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        {/* ================= ERP Dashboard (NEW SYSTEM) ================= */}
        <Route
          path="/admin/erp/*"
          element={
            <AdminRoute>
              <ERPDashboard />
            </AdminRoute>
          }
        >
          {/* Default ERP page */}
          <Route index element={<DashboardHome />} />

          {/* Orders */}
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="orders/:id" element={<OrderDetails />} />

          {/* Invoices */}
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />

          {/* Purchase Orders */}
          <Route path="purchase-orders" element={<PurchaseOrdersList />} />

          {/* Customer statement */}
          <Route
            path="customers/:id/statement"
            element={<CustomerStatement />}
          />
          <Route
            path="purchase-orders/:id"
            element={<PurchaseOrderDetails />}
          />
          <Route
            path="suppliers/:id/statement"
            element={<SupplierStatement />}
          />
        </Route>

        {/* ================= Generic admin CRUD (OLD / temporary) ================= */}
        <Route
          path="/admin/:table"
          element={
            <AdminRoute>
              <CrudTable />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/:table/create"
          element={
            <AdminRoute>
              <CrudForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/:table/:id/edit"
          element={
            <AdminRoute>
              <CrudForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/:table/:id/show"
          element={
            <AdminRoute>
              <CrudForm />
            </AdminRoute>
          }
        />

        {/* ================= Old Admin Dashboard (to be deprecated) ================= */}
        <Route
          path="/admin/dashboard/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* ================= Direct Admin Layout (legacy / optional) ================= */}
        <Route
          path="/adminLayout"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />

        {/* ================= 404 ================= */}
        <Route
          path="*"
          element={<p style={{ padding: 20 }}>Page not found</p>}
        />
      </Routes>
    </BrowserRouter>
  </AuthProvider>,
);
