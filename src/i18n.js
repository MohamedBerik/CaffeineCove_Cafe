import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// الموارد العربية والإنجليزية
const resources = {
  en: {
    translation: {
      // AdminNavbar
      "ERP System": "ERP System",
      "Clinic Admin Panel": "Clinic Admin Panel",
      Logout: "Logout",
      "Super Admin": "Super Admin",
      Admin: "Admin",

      // ErpNav
      "ERP Navigation": "ERP Navigation",
      Dashboard: "Dashboard",
      "Start Visit": "Start Visit",
      Doctors: "Doctors",
      Procedures: "Procedures",
      Patients: "Patients",
      Appointments: "Appointments",
      "Treatment Plans": "Treatment Plans",
      "Dental Records": "Dental Records",
      Invoices: "Invoices",
      Orders: "Orders",
      "Purchase Orders": "Purchase Orders",
      Reports: "Reports",
      "Clinic Settings": "Clinic Settings",

      // ErpDashboardHome - Header & Messages
      "Failed to load ERP dashboard.": "Failed to load ERP dashboard.",
      Retry: "Retry",
      "No dashboard data available.": "No dashboard data available.",
      "ERP Dashboard": "ERP Dashboard",
      "Clinic operations, billing, and payment overview":
        "Clinic operations, billing, and payment overview",
      Refresh: "Refresh",

      // ErpDashboardHome - KPIs
      "Appointments Today": "Appointments Today",
      "Scheduled Today": "Scheduled Today",
      "Completed Today": "Completed Today",
      "Cancelled / No Show": "Cancelled / No Show",
      "Unpaid Invoices": "Unpaid Invoices",
      "Partially Paid": "Partially Paid",
      "Today Revenue": "Today Revenue",
      "Month Revenue": "Month Revenue",
      "Customer Credit Balance": "Customer Credit Balance",
      "Paid Invoices": "Paid Invoices",

      // ErpDashboardHome - Tables
      "Recent Appointments": "Recent Appointments",
      "Recent Invoices": "Recent Invoices",
      "Recent Payments": "Recent Payments",
      "View All": "View All",
      Patient: "Patient",
      Doctor: "Doctor",
      Date: "Date",
      Status: "Status",
      Number: "Number",
      Total: "Total",
      Issued: "Issued",
      Invoice: "Invoice",
      Applied: "Applied",
      Method: "Method",
      "Paid At": "Paid At",
      "No recent appointments.": "No recent appointments.",
      "No recent invoices.": "No recent invoices.",
      "No recent payments.": "No recent payments.",

      // ErpDashboardHome - Status Badges
      Paid: "Paid",
      Completed: "Completed",
      Unpaid: "Unpaid",
      Cancelled: "Cancelled",
      "No Show": "No Show",
      "Partially Paid": "Partially Paid",
      Scheduled: "Scheduled",
      "In Progress": "In Progress",
      Pending: "Pending",

      // Common
      "Loading...": "Loading...",
    },
  },
  ar: {
    translation: {
      // AdminNavbar
      "ERP System": "نظام تخطيط الموارد",
      "Clinic Admin Panel": "لوحة تحكم العيادة",
      Logout: "تسجيل خروج",
      "Super Admin": "مدير عام",
      Admin: "مدير",

      // ErpNav
      "ERP Navigation": "قائمة النظام",
      Dashboard: "الرئيسية",
      "Start Visit": "بدء زيارة",
      Doctors: "الأطباء",
      Procedures: "الإجراءات",
      Patients: "المرضى",
      Appointments: "المواعيد",
      "Treatment Plans": "خطط العلاج",
      "Dental Records": "السجلات السنية",
      Invoices: "الفواتير",
      Orders: "الطلبات",
      "Purchase Orders": "أوامر الشراء",
      Reports: "التقارير",
      "Clinic Settings": "إعدادات العيادة",

      // ErpDashboardHome - Header & Messages
      "Failed to load ERP dashboard.": "فشل تحميل لوحة التحكم",
      Retry: "إعادة المحاولة",
      "No dashboard data available.": "لا توجد بيانات متاحة",
      "ERP Dashboard": "لوحة تحكم النظام",
      "Clinic operations, billing, and payment overview":
        "نظرة عامة على عمليات العيادة والفواتير والمدفوعات",
      Refresh: "تحديث",

      // ErpDashboardHome - KPIs
      "Appointments Today": "مواعيد اليوم",
      "Scheduled Today": "المجدولة اليوم",
      "Completed Today": "المكتملة اليوم",
      "Cancelled / No Show": "ملغية / عدم حضور",
      "Unpaid Invoices": "فواتير غير مدفوعة",
      "Partially Paid": "مدفوعة جزئياً",
      "Today Revenue": "إيرادات اليوم",
      "Month Revenue": "إيرادات الشهر",
      "Customer Credit Balance": "رصيد العملاء الدائن",
      "Paid Invoices": "فواتير مدفوعة",

      // ErpDashboardHome - Tables
      "Recent Appointments": "المواعيد الأخيرة",
      "Recent Invoices": "الفواتير الأخيرة",
      "Recent Payments": "المدفوعات الأخيرة",
      "View All": "عرض الكل",
      Patient: "المريض",
      Doctor: "الطبيب",
      Date: "التاريخ",
      Status: "الحالة",
      Number: "الرقم",
      Total: "الإجمالي",
      Issued: "تاريخ الإصدار",
      Invoice: "الفاتورة",
      Applied: "المبلغ",
      Method: "طريقة الدفع",
      "Paid At": "تاريخ الدفع",
      "No recent appointments.": "لا توجد مواعيد حديثة",
      "No recent invoices.": "لا توجد فواتير حديثة",
      "No recent payments.": "لا توجد مدفوعات حديثة",

      // ErpDashboardHome - Status Badges
      Paid: "مدفوع",
      Completed: "مكتمل",
      Unpaid: "غير مدفوع",
      Cancelled: "ملغي",
      "No Show": "عدم حضور",
      "Partially Paid": "مدفوع جزئياً",
      Scheduled: "مجدول",
      "In Progress": "قيد التنفيذ",
      Pending: "قيد الانتظار",

      // Common
      "Loading...": "جاري التحميل...",
    },
  },
};

// تهيئة i18n
i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("appLanguage") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
