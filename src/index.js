import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import App from "./App";

// Public Pages
import AllAbout from "./pages/About/AllAbout";
import AllMenu from "./pages/Menu/AllMenu";
import AllTestimonials from "./pages/Testimonials/AllTestimonials";
import AllContact from "./pages/Contact/AllContact";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";

// Admin / ERP
import ERPDashboard from "./admin/erp/ERPDashboard";
import OrdersList from "./admin/erp/components/OrdersList";
import CreateOrder from "./admin/erp/components/CreateOrder";
import InvoicesList from "./admin/erp/components/InvoicesList";
import PurchaseOrdersList from "./admin/erp/components/PurchaseOrdersList";

// Generic CRUD (temporary)
import CrudTable from "./admin/components/CrudTable";
import CrudForm from "./admin/components/CrudForm";

// Old Admin Dashboard
import AdminDashboard from "./admin/Dashboard/Dashboard";
import AdminLayout from "./admin/layouts/AdminLayout";

// Route Guards
import { ProtectedRoute, AdminRoute } from "./admin/routes/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        {/* Public site */}
        <Route path="/" element={<App />} />
        <Route path="/about" element={<AllAbout />} />
        <Route path="/menu" element={<AllMenu />} />
        <Route path="/testimonials" element={<AllTestimonials />} />
        <Route path="/contact" element={<AllContact />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        {/* ERP Dashboard */}
        <Route
          path="/admin/erp/*"
          element={
            <AdminRoute>
              <ERPDashboard />
            </AdminRoute>
          }
        >
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="purchase-orders" element={<PurchaseOrdersList />} />
        </Route>

        {/* Generic admin CRUD (temporary) */}
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

        {/* Old Admin Dashboard */}
        <Route
          path="/admin/dashboard/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* AdminLayout direct access (optional) */}
        <Route
          path="/adminLayout"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={<p style={{ padding: 20 }}>Page not found</p>}
        />
      </Routes>
    </BrowserRouter>
  </AuthProvider>,
);
