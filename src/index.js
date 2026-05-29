import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import App from "./App";
import "./i18n";
// ================= Route Guards =================
import { AdminRoute } from "./admin/routes/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";
// ================= Lazy Loaded Pages =================
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Logout = lazy(() => import("./pages/Logout"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));

const ERPDashboard = lazy(() => import("./admin/erp/dashboard/ERPDashboard"));
const ErpDashboardHome = lazy(
  () => import("./admin/erp/dashboard/ErpDashboardHome"),
);
const OrdersList = lazy(() => import("./admin/erp/orders/OrdersList"));
const CreateOrder = lazy(() => import("./admin/erp/orders/CreateOrder"));
const OrderDetails = lazy(() => import("./admin/erp/orders/OrderDetails"));
// ... أكمل جميع المكونات بنفس الطريقة (سنختصر هنا للتوضيح)
const InvoicesList = lazy(() => import("./admin/erp/invoices/InvoicesList"));
const InvoiceDetails = lazy(
  () => import("./admin/erp/invoices/InvoiceDetails"),
);
const PurchaseOrdersList = lazy(
  () => import("./admin/erp/purchase-orders/PurchaseOrdersList"),
);
const PurchaseOrderCreate = lazy(
  () => import("./admin/erp/purchase-orders/PurchaseOrderCreate"),
);
const PurchaseOrderDetails = lazy(
  () => import("./admin/erp/purchase-orders/PurchaseOrderDetails"),
);
const PurchaseOrderReturns = lazy(
  () => import("./admin/erp/purchase-orders/PurchaseOrderReturns"),
);
const PurchaseOrderReturnsHistory = lazy(
  () => import("./admin/erp/purchase-orders/PurchaseOrderReturnsHistory"),
);
const PatientStatement = lazy(
  () => import("./admin/erp/patients/PatientStatement"),
);
const PatientsList = lazy(() => import("./admin/erp/patients/PatientsList"));
const PatientProfilePage = lazy(
  () => import("./admin/erp/patients/PatientProfilePage"),
);
const PatientTimelinePage = lazy(
  () => import("./admin/erp/patients/PatientTimelinePage"),
);
const PatientFormPage = lazy(
  () => import("./admin/erp/patients/PatientFormPage"),
);
const AppointmentsListPage = lazy(
  () => import("./admin/erp/appointments/AppointmentsListPage"),
);
const AppointmentActivityPage = lazy(
  () => import("./admin/erp/appointments/AppointmentActivityPage"),
);
const BookAppointmentPage = lazy(
  () => import("./admin/erp/appointments/BookAppointmentPage"),
);
const AppointmentCalendarPage = lazy(
  () => import("./admin/erp/appointments/AppointmentCalendarPage"),
);
const TreatmentPlansListPage = lazy(
  () => import("./admin/erp/treatment-plans/TreatmentPlansListPage"),
);
const TreatmentPlanDetailsPage = lazy(
  () => import("./admin/erp/treatment-plans/TreatmentPlanDetailsPage"),
);
const CreateTreatmentPlanPage = lazy(
  () => import("./admin/erp/treatment-plans/CreateTreatmentPlanPage"),
);
const DentalRecordsListPage = lazy(
  () => import("./admin/erp/dental-records/DentalRecordsListPage"),
);
const CreateDentalRecordPage = lazy(
  () => import("./admin/erp/dental-records/CreateDentalRecordPage"),
);
const ProceduresListPage = lazy(
  () => import("./admin/erp/procedures/ProceduresListPage"),
);
const ProcedureFormPage = lazy(
  () => import("./admin/erp/procedures/ProcedureFormPage"),
);
const DoctorsListPage = lazy(
  () => import("./admin/erp/doctors/DoctorsListPage"),
);
const DoctorAvailabilityPage = lazy(
  () => import("./admin/erp/doctors/DoctorAvailabilityPage"),
);
const DoctorFormPage = lazy(() => import("./admin/erp/doctors/DoctorFormPage"));
const EmployeeListPage = lazy(
  () => import("./admin/erp/employees/EmployeeListPage"),
);
const EmployeeFormPage = lazy(
  () => import("./admin/erp/employees/EmployeeFormPage"),
);
const ProductsListPage = lazy(
  () => import("./admin/erp/products/ProductsListPage"),
);
const ProductFormPage = lazy(
  () => import("./admin/erp/products/ProductFormPage"),
);
const SuppliersListPage = lazy(
  () => import("./admin/erp/suppliers/SuppliersListPage"),
);
const SupplierFormPage = lazy(
  () => import("./admin/erp/suppliers/SupplierFormPage"),
);
const SupplierStatementPage = lazy(
  () => import("./admin/erp/suppliers/SupplierStatementPage"),
);
const SuppliesListPage = lazy(
  () => import("./admin/erp/supplies/SuppliesListPage"),
);
const SupplyFormPage = lazy(
  () => import("./admin/erp/supplies/SupplyFormPage"),
);
const StartVisitPage = lazy(() => import("./admin/erp/visits/StartVisitPage"));
const NotificationsPage = lazy(
  () => import("./admin/erp/notifications/NotificationsPage"),
);
const BillingPage = lazy(() => import("./admin/erp/billing/BillingPage"));
const ActivityLogs = lazy(
  () => import("./admin/erp/activity-logs/ActivityLogs"),
);
const ClinicSettingsPage = lazy(
  () => import("./admin/erp/settings/ClinicSettingsPage"),
);
const BranchFormPage = lazy(() => import("./admin/saas/BranchFormPage"));
const BranchesListPage = lazy(() => import("./admin/saas/BranchesListPage"));
const ReportsDashboardPage = lazy(
  () => import("./admin/erp/reports/ReportsDashboardPage"),
);
const RevenueReportPage = lazy(
  () => import("./admin/erp/reports/RevenueReportPage"),
);
const AppointmentsReportPage = lazy(
  () => import("./admin/erp/reports/AppointmentsReportPage"),
);
const DoctorPerformanceReportPage = lazy(
  () => import("./admin/erp/reports/DoctorPerformanceReportPage"),
);
const AnalyticsDashboardPage = lazy(
  () => import("./admin/erp/reports/AnalyticsDashboardPage"),
);
const PaymentsReportPage = lazy(
  () => import("./admin/erp/reports/PaymentsReportPage"),
);
const TreatmentPlansReportPage = lazy(
  () => import("./admin/erp/reports/TreatmentPlansReportPage"),
);
const PatientsReportPage = lazy(
  () => import("./admin/erp/reports/PatientsReportPage"),
);
// ================= SaaS Lazy =================
const SaaSDashboard = lazy(() => import("./admin/saas/SaaSDashboard"));
const CompaniesList = lazy(() => import("./admin/saas/CompaniesList"));
const CompanyForm = lazy(() => import("./admin/saas/CompanyForm"));
const CompanyDetails = lazy(() => import("./admin/saas/CompanyDetails"));
const PlansList = lazy(() => import("./admin/saas/PlansList"));
const SubscriptionsList = lazy(() => import("./admin/saas/SubscriptionsList"));
const SaaSReports = lazy(() => import("./admin/saas/SaaSReports"));
const PlatformSettings = lazy(() => import("./admin/saas/PlatformSettings"));
const ContactMessagesListPage = lazy(
  () => import("./admin/saas/ContactMessagesListPage"),
);

// ================= Print Pages =================
const PrintInvoicePage = lazy(
  () => import("./admin/erp/components/PrintInvoicePage"),
);
const PrintPurchaseOrderPage = lazy(
  () => import("./admin/erp/components/PrintPurchaseOrderPage"),
);
const PrintBillingInvoicePage = lazy(
  () => import("./admin/erp/components/PrintBillingInvoicePage"),
);
const PrintAnalyticsDashboardPage = lazy(
  () => import("./admin/erp/reports/PrintAnalyticsDashboardPage"),
);
const PrintAppointmentsReportPage = lazy(
  () => import("./admin/erp/reports/PrintAppointmentsReportPage"),
);
const PrintDoctorPerformanceReportPage = lazy(
  () => import("./admin/erp/reports/PrintDoctorPerformanceReportPage"),
);
const PrintRevenueReportPage = lazy(
  () => import("./admin/erp/reports/PrintRevenueReportPage"),
);
const PrintPaymentsReportPage = lazy(
  () => import("./admin/erp/reports/PrintPaymentsReportPage"),
);
const PrintTreatmentPlansReportPage = lazy(
  () => import("./admin/erp/reports/PrintTreatmentPlansReportPage"),
);
const PrintPatientsReportPage = lazy(
  () => import("./admin/erp/reports/PrintPatientsReportPage"),
);
const PrintSaaSReportsPage = lazy(
  () => import("./admin/saas/PrintSaaSReportsPage"),
);

// ✅ إنشاء QueryClient مع استراتيجية ذكية للـ staleTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 دقائق افتراضيًا
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 429) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// مكون مساعد للتحميل
const PageLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/logout" element={<Logout />} />

              {/* Print Routes (بدون تخطيط ERP) */}
              <Route
                path="/admin/erp/invoices/:id/print"
                element={<PrintInvoicePage />}
              />
              <Route
                path="/admin/erp/purchase-orders/:id/print"
                element={<PrintPurchaseOrderPage />}
              />
              <Route
                path="/admin/erp/billing/invoices/:id/print"
                element={<PrintBillingInvoicePage />}
              />
              <Route
                path="/admin/erp/reports/analytics/print"
                element={<PrintAnalyticsDashboardPage />}
              />
              <Route
                path="/admin/erp/reports/appointments/print"
                element={<PrintAppointmentsReportPage />}
              />
              <Route
                path="/admin/erp/reports/doctors/print"
                element={<PrintDoctorPerformanceReportPage />}
              />
              <Route
                path="/admin/erp/reports/revenue/print"
                element={<PrintRevenueReportPage />}
              />
              <Route
                path="/admin/erp/reports/payments/print"
                element={<PrintPaymentsReportPage />}
              />
              <Route
                path="/admin/erp/reports/treatment-plans/print"
                element={<PrintTreatmentPlansReportPage />}
              />
              <Route
                path="/admin/erp/reports/patients/print"
                element={<PrintPatientsReportPage />}
              />
              <Route
                path="/admin/saas/reports/print"
                element={<PrintSaaSReportsPage />}
              />

              {/* ERP Routes */}
              <Route
                path="/admin/erp/*"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
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
                <Route
                  path="purchase-orders"
                  element={<PurchaseOrdersList />}
                />
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
                <Route
                  path="suppliers/:id/edit"
                  element={<SupplierFormPage />}
                />
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
                <Route
                  path="settings/clinic"
                  element={<ClinicSettingsPage />}
                />
                <Route path="doctors/create" element={<DoctorFormPage />} />
                <Route path="doctors/:id/edit" element={<DoctorFormPage />} />
                <Route path="doctors" element={<DoctorsListPage />} />
                <Route
                  path="doctors/:id/availability"
                  element={<DoctorAvailabilityPage />}
                />
                <Route path="employees" element={<EmployeeListPage />} />
                <Route path="employees/create" element={<EmployeeFormPage />} />
                <Route
                  path="employees/:id/edit"
                  element={<EmployeeFormPage />}
                />
                <Route path="branches" element={<BranchesListPage />} />
                <Route path="branches/create" element={<BranchFormPage />} />
                <Route path="branches/:id/edit" element={<BranchFormPage />} />
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
                <Route
                  path="reports/payments"
                  element={<PaymentsReportPage />}
                />
                <Route
                  path="reports/treatment-plans"
                  element={<TreatmentPlansReportPage />}
                />
                <Route
                  path="reports/patients"
                  element={<PatientsReportPage />}
                />
                <Route path="procedures" element={<ProceduresListPage />} />
                <Route
                  path="procedures/create"
                  element={<ProcedureFormPage />}
                />
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

              {/* SaaS Routes */}
              <Route
                path="/admin/saas"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<SaaSDashboard />} />
              </Route>
              <Route
                path="/admin/companies"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<CompaniesList />} />
                <Route path="create" element={<CompanyForm />} />
                <Route path=":id/edit" element={<CompanyForm />} />
                <Route path=":id" element={<CompanyDetails />} />
              </Route>
              <Route
                path="/admin/plans"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<PlansList />} />
              </Route>
              <Route
                path="/admin/subscriptions"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<SubscriptionsList />} />
              </Route>
              <Route
                path="/admin/reports/saas"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<SaaSReports />} />
              </Route>
              <Route
                path="/admin/settings/saas"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<PlatformSettings />} />
              </Route>
              <Route
                path="/admin/activity-logs"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<ActivityLogs />} />
              </Route>
              <Route
                path="/admin/saas/contact-messages"
                element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}>
                      <ERPDashboard />
                    </Suspense>
                  </AdminRoute>
                }
              >
                <Route index element={<ContactMessagesListPage />} />
              </Route>

              <Route
                path="*"
                element={<p style={{ padding: 20 }}>Page not found</p>}
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
