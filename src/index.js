import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import App from "./App";

import AllAbout from "./pages/About/AllAbout";
import AllMenu from "./pages/Menu/AllMenu";
import AllTestimonials from "./pages/Testimonials/AllTestimonials";
import AllContact from "./pages/Contact/AllContact";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";

import CrudForm from "./admin/components/CrudForm";
import CrudTable from "./admin/components/CrudTable";

import AdminDashboard from "./admin/Dashboard/Dashboard";
import AdminLayout from "./admin/layouts/AdminLayout";

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

        {/* Generic admin CRUD (لو انت لسه مستخدمها مباشرة) */}
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

        {/* Admin layout (لو محتاجه بشكل مباشر) */}
        <Route
          path="/adminLayout"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />

        {/* Main admin dashboard (ERP + nested routes inside it) */}
        <Route
          path="/admin/dashboard/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Not found */}
        <Route path="*" element={<p>Page not found</p>} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>,
);
