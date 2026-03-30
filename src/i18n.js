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

      // Common
      "Loading...": "جاري التحميل...",
    },
  },
};

// تهيئة i18n
i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("appLanguage") || "en", // اللغة الافتراضية من localStorage أو English
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
