import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import App from "./App";
import AllData from "./data/AllData";
import AllAbout from "./pages/About/AllAbout";
import AllMenu from "./pages/Menu/AllMenu";
import AllTestimonials from "./pages/Testimonials/AllTestimonials";
import AllContact from "./pages/Contact/AllContact";
import AdminDashboard from "./admin/Dashboard/Dashboard";
import { ProtectedRoute, AdminRoute } from "./admin/routes/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import CrudForm from "./admin/components/CrudForm";
import CrudTable from "./admin/components/CrudTable";
import AdminLayout from "./admin/layouts/AdminLayout";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <AllData>
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
          <Route path="/" element={<App />} />
          <Route path="/about" element={<AllAbout />} />
          <Route path="/menu" element={<AllMenu />} />
          <Route path="/testimonials" element={<AllTestimonials />} />
          <Route path="/contact" element={<AllContact />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/admin/:table/create" element={<CrudForm />} />
          <Route path="/admin/:table/:id/edit" element={<CrudForm />} />
          <Route path="/admin/:table/:id/show" element={<CrudForm />} />
          <Route path="*" element={<p>Page not found</p>} />
          <Route path="/admin/:table" element={<CrudTable />} />
          <Route path="/adminLayout" element={<AdminLayout />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {" "}
                <home />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard/*"
            element={
              <AdminRoute>
                {" "}
                <AdminDashboard />{" "}
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AllData>
  </AuthProvider>,
);
