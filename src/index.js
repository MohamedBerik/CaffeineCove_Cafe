import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import App from "./App";
import "./i18n";

/* ================= Public Pages ================= */
import AllAbout from "./pages/About/AllAbout";
import AllTimeline from "./pages/Timeline/AllTimeline";
import AllTestimonials from "./pages/Testimonials/AllTestimonials";
import AllBooking from "./pages/Booking/AllBooking";
import AllContact from "./pages/Contact/AllContact";

/* ================= Auth ================= */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";

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
import { Toaster } from "react-hot-toast";

/* ================= ERP ================= */
import ERPDashboard from "./admin/erp/ERPDashboard";
import ErpDashboardHome from "./admin/erp/ErpDashboardHome";
import OrdersList from "./admin/erp/orders/OrdersList";
import CreateOrder from "./admin/erp/orders/CreateOrder";
import OrderDetails from "./admin/erp/orders/OrderDetails";
import InvoicesList from "./admin/erp/invoices/InvoicesList";
import InvoiceDetails from "./admin/erp/invoices/InvoiceDetails";
import PurchaseOrdersList from "./admin/erp/purchase-orders/PurchaseOrdersList";
import PurchaseOrderCreate from "./admin/erp/purchase-orders/PurchaseOrderCreate";
import PurchaseOrderDetails from "./admin/erp/purchase-orders/PurchaseOrderDetails";
import PurchaseOrderReturns from "./admin/erp/purchase-orders/PurchaseOrderReturns";
import PurchaseOrderReturnsHistory from "./admin/erp/purchase-orders/PurchaseOrderReturnsHistory";
import PatientStatement from "./admin/erp/patients/PatientStatement";
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
import ProceduresListPage from "./admin/erp/procedures/ProceduresListPage";
import ProcedureFormPage from "./admin/erp/procedures/ProcedureFormPage";
import StartVisitPage from "./admin/erp/visits/StartVisitPage";
import NotificationsPage from "./admin/erp/notifications/NotificationsPage";
import EmployeeListPage from "./admin/erp/employees/EmployeeListPage";
import EmployeeFormPage from "./admin/erp/employees/EmployeeFormPage";
import ProductsListPage from "./admin/erp/products/ProductsListPage";

// ================= SaaS Routes =================
import SaaSDashboard from "./admin/saas/SaaSDashboard";
import CompaniesList from "./admin/saas/CompaniesList";
import CompanyForm from "./admin/saas/CompanyForm";
import CompanyDetails from "./admin/saas/CompanyDetails";
import PlansList from "./admin/saas/PlansList";
import SubscriptionsList from "./admin/saas/SubscriptionsList";
import SaaSReports from "./admin/saas/SaaSReports";
import PlatformSettings from "./admin/saas/PlatformSettings";
import ActivityLogs from "./admin/erp/activity-logs/ActivityLogs";
import BillingPage from "./admin/erp/billing/BillingPage";
import ProductFormPage from "./admin/erp/products/ProductFormPage";
import SuppliersListPage from "./admin/erp/suppliers/SuppliersListPage";
import SupplierFormPage from "./admin/erp/suppliers/SupplierFormPage";
import SupplierStatementPage from "./admin/erp/suppliers/SupplierStatementPage";
import SuppliesListPage from "./admin/erp/supplies/SuppliesListPage";
import SupplyFormPage from "./admin/erp/supplies/SupplyFormPage";

// ✅ إنشاء QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 دقائق
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AlertProvider>
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
          <Toaster position="top-right" />
          <Routes>
            {/* ================= Public ================= */}
            <Route path="/" element={<App />} />
            <Route path="/about" element={<AllAbout />} />
            <Route path="/timeline" element={<AllTimeline />} />
            <Route path="/testimonials" element={<AllTestimonials />} />
            <Route path="/booking" element={<AllBooking />} />
            <Route path="/contact" element={<AllContact />} />
            {/* ================= Auth ================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            {/* ================= ERP Dashboard (NEW SYSTEM) ================= */}
            <Route
              path="/admin/erp/invoices/:id/print"
              element={<PrintInvoicePage />}
            />

            <Route
              path="/admin/erp/*"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<ErpDashboardHome />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/create" element={<CreateOrder />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="invoices" element={<InvoicesList />} />
              <Route path="invoices/:id" element={<InvoiceDetails />} />
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

              <Route path="suppliers" element={<SuppliersListPage />} />
              <Route path="suppliers/create" element={<SupplierFormPage />} />
              <Route path="suppliers/:id/edit" element={<SupplierFormPage />} />
              <Route
                path="suppliers/:id/statement"
                element={<SupplierStatementPage />}
              />

              <Route path="supplies" element={<SuppliesListPage />} />
              <Route path="supplies/create" element={<SupplyFormPage />} />
              <Route path="supplies/:id/edit" element={<SupplyFormPage />} />

              <Route
                path="patients/:id/statement"
                element={<PatientStatement />}
              />
              <Route path="patients" element={<PatientsList />} />
              <Route
                path="patients/:id/profile"
                element={<PatientProfilePage />}
              />
              <Route
                path="patients/:id/timeline"
                element={<PatientTimelinePage />}
              />
              <Route path="patients/create" element={<PatientFormPage />} />
              <Route path="patients/:id/edit" element={<PatientFormPage />} />
              <Route path="appointments" element={<AppointmentsListPage />} />
              <Route
                path="appointments/:id/activity"
                element={<AppointmentActivityPage />}
              />
              <Route
                path="appointments/create"
                element={<BookAppointmentPage />}
              />
              <Route
                path="appointments/calendar"
                element={<AppointmentCalendarPage />}
              />
              <Route
                path="treatment-plans"
                element={<TreatmentPlansListPage />}
              />
              <Route
                path="treatment-plans/:id"
                element={<TreatmentPlanDetailsPage />}
              />
              <Route
                path="treatment-plans/create"
                element={<CreateTreatmentPlanPage />}
              />
              <Route
                path="dental-records"
                element={<DentalRecordsListPage />}
              />
              <Route
                path="dental-records/create"
                element={<CreateDentalRecordPage />}
              />
              <Route path="settings/clinic" element={<ClinicSettingsPage />} />
              <Route path="doctors/create" element={<DoctorFormPage />} />
              <Route path="doctors/:id/edit" element={<DoctorFormPage />} />
              <Route path="doctors" element={<DoctorsListPage />} />
              <Route
                path="doctors/:id/availability"
                element={<DoctorAvailabilityPage />}
              />

              <Route path="employees" element={<EmployeeListPage />} />
              <Route path="employees/create" element={<EmployeeFormPage />} />
              <Route path="employees/:id/edit" element={<EmployeeFormPage />} />

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
              <Route path="procedures" element={<ProceduresListPage />} />
              <Route path="procedures/create" element={<ProcedureFormPage />} />
              <Route
                path="procedures/:id/edit"
                element={<ProcedureFormPage />}
              />
              <Route path="products" element={<ProductsListPage />} />
              <Route path="products/create" element={<ProductFormPage />} />
              <Route path="products/:id/edit" element={<ProductFormPage />} />
              <Route path="visits/start" element={<StartVisitPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>

            {/* ================= SaaS Dashboard (NEW) ================= */}
            <Route
              path="/admin/saas"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<SaaSDashboard />} />
            </Route>
            {/* ================= Companies Routes ================= */}
            <Route
              path="/admin/companies"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<CompaniesList />} />
              <Route path="create" element={<CompanyForm />} />
              <Route path=":id/edit" element={<CompanyForm />} />
              <Route path=":id" element={<CompanyDetails />} />
            </Route>
            {/* ================= Plans Routes ================= */}
            <Route
              path="/admin/plans"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<PlansList />} />
            </Route>
            {/* ================= Subscriptions Routes ================= */}
            <Route
              path="/admin/subscriptions"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<SubscriptionsList />} />
            </Route>
            {/* ================= SaaS Reports Routes ================= */}
            <Route
              path="/admin/reports/saas"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<SaaSReports />} />
            </Route>
            {/* ================= Platform Settings Routes ================= */}
            <Route
              path="/admin/settings/saas"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<PlatformSettings />} />
            </Route>
            {/* ================= Activity Logs Route ================= */}
            <Route
              path="/admin/activity-logs"
              element={
                <AdminRoute>
                  <ERPDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<ActivityLogs />} />
            </Route>
            {/* ================= Generic admin CRUD ================= */}
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
            {/* ================= Old Admin Dashboard ================= */}
            <Route
              path="/admin/dashboard/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
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
      </AlertProvider>
    </AuthProvider>

    {/* ✅ React Query Devtools */}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
