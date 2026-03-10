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
import ErpDashboardHome from "./admin/erp/ErpDashboardHome";
import OrdersList from "./admin/erp/components/OrdersList";
import CreateOrder from "./admin/erp/components/CreateOrder";
import OrderDetails from "./admin/erp/components/OrderDetails";
import InvoicesList from "./admin/erp/invoices/InvoicesList";
import InvoiceDetails from "./admin/erp/invoices/InvoiceDetails";
import PurchaseOrdersList from "./admin/erp/components/PurchaseOrdersList";
import PurchaseOrderCreate from "./admin/erp/components/PurchaseOrderCreate";
import PurchaseOrderDetails from "./admin/erp/components/PurchaseOrderDetails";
import PurchaseOrderReturns from "./admin/erp/components/PurchaseOrderReturns";
import PurchaseOrderReturnsHistory from "./admin/erp/components/PurchaseOrderReturnsHistory";
import PatientStatement from "./admin/erp/patients/PatientStatement";
import SupplierStatement from "./admin/erp/suppliers/SupplierStatement";

/* ================= Generic CRUD (temporary) ================= */
import CrudTable from "./admin/components/CrudTable";
import CrudForm from "./admin/components/CrudForm";

/* ================= Old Admin ================= */
import AdminDashboard from "./admin/Dashboard/Dashboard";
import AdminLayout from "./admin/layouts/AdminLayout";

/* ================= Route Guards ================= */
import { AdminRoute } from "./admin/routes/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PatientsList from "./admin/erp/patients/PatientsList";
import PatientProfilePage from "./admin/erp/patients/PatientProfilePage";
import PatientTimelinePage from "./admin/erp/patients/PatientTimelinePage";
import AppointmentsListPage from "./admin/erp/appointments/AppointmentsListPage";
import TreatmentPlanDetailsPage from "./admin/erp/treatment-plans/TreatmentPlanDetailsPage";
import TreatmentPlansListPage from "./admin/erp/treatment-plans/TreatmentPlansListPage";
import DentalRecordsListPage from "./admin/erp/dental-records/DentalRecordsListPage";
import CreateDentalRecordPage from "./admin/erp/dental-records/CreateDentalRecordPage";
import CreateTreatmentPlanPage from "./admin/erp/treatment-plans/CreateTreatmentPlanPage";
import AppointmentActivityPage from "./admin/erp/appointments/AppointmentActivityPage";
import BookAppointmentPage from "./admin/erp/appointments/BookAppointmentPage";
import ClinicSettingsPage from "./admin/erp/settings/ClinicSettingsPage";
import DoctorsListPage from "./admin/erp/doctors/DoctorsListPage";
import DoctorAvailabilityPage from "./admin/erp/doctors/DoctorAvailabilityPage";
import PatientFormPage from "./admin/erp/patients/PatientFormPage";
import AppointmentCalendarPage from "./admin/erp/appointments/AppointmentCalendarPage";
import DoctorFormPage from "./admin/erp/doctors/DoctorFormPage";
import ReportsDashboardPage from "./admin/erp/reports/ReportsDashboardPage";
import RevenueReportPage from "./admin/erp/reports/RevenueReportPage";
import AppointmentsReportPage from "./admin/erp/reports/AppointmentsReportPage";
import DoctorPerformanceReportPage from "./admin/erp/reports/DoctorPerformanceReportPage";
import AnalyticsDashboardPage from "./admin/erp/reports/AnalyticsDashboardPage";

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
          <Route index element={<ErpDashboardHome />} />

          {/* Orders */}
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="orders/:id" element={<OrderDetails />} />

          {/* Invoices */}
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />

          {/* Purchase Orders */}
          <Route
            path="purchase-orders/create"
            element={<PurchaseOrderCreate />}
          />
          <Route path="purchase-orders" element={<PurchaseOrdersList />} />
          <Route
            path="purchase-orders/:id"
            element={<PurchaseOrderDetails />}
          />
          <Route
            path="purchase-orders/:id/returns"
            element={<PurchaseOrderReturns />}
          />
          <Route
            path="purchase-orders/:id/returns-history"
            element={<PurchaseOrderReturnsHistory />}
          />

          {/* Supplier statement */}
          <Route
            path="suppliers/:id/statement"
            element={<SupplierStatement />}
          />

          {/* ✅ Patient statement (UI route) */}
          <Route path="patients/:id/statement" element={<PatientStatement />} />
          <Route path="patients" element={<PatientsList />} />
          <Route path="patients/:id/profile" element={<PatientProfilePage />} />
          <Route
            path="patients/:id/timeline"
            element={<PatientTimelinePage />}
          />
          <Route path="patients/create" element={<PatientFormPage />} />
          <Route path="patients/:id/edit" element={<PatientFormPage />} />

          {/* Appointments */}
          <Route path="appointments" element={<AppointmentsListPage />} />
          <Route
            path="appointments/:id/activity"
            element={<AppointmentActivityPage />}
          />
          <Route path="appointments/create" element={<BookAppointmentPage />} />
          <Route
            path="appointments/calendar"
            element={<AppointmentCalendarPage />}
          />

          {/* TreamentPlans */}
          <Route path="treatment-plans" element={<TreatmentPlansListPage />} />
          <Route
            path="treatment-plans/:id"
            element={<TreatmentPlanDetailsPage />}
          />
          <Route
            path="treatment-plans/create"
            element={<CreateTreatmentPlanPage />}
          />

          {/* DentalRecords */}
          <Route path="dental-records" element={<DentalRecordsListPage />} />
          <Route
            path="dental-records/create"
            element={<CreateDentalRecordPage />}
          />

          {/* Clinic settings */}
          <Route path="settings/clinic" element={<ClinicSettingsPage />} />

          {/* Doctors */}
          <Route path="doctors/create" element={<DoctorFormPage />} />
          {/* <Route path="doctors/:id" element={<DoctorDetailsPage />} /> */}
          <Route path="doctors/:id/edit" element={<DoctorFormPage />} />
          <Route path="doctors" element={<DoctorsListPage />} />
          <Route
            path="doctors/:id/availability"
            element={<DoctorAvailabilityPage />}
          />

          {/* Reports */}
          <Route path="reports" element={<ReportsDashboardPage />} />
          <Route path="reports/revenue" element={<RevenueReportPage />} />
          <Route
            path="reports/appointments"
            element={<AppointmentsReportPage />}
          />
          <Route
            path="reports/doctors"
            element={<DoctorPerformanceReportPage />}
          />
          <Route
            path="reports/analytics"
            element={<AnalyticsDashboardPage />}
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
