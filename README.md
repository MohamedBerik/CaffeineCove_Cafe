☕ Caffeine Cove – React Frontend & ERP Extension

واجهة أمامية (Frontend) مبنية بـ React.js لإدارة موقع كافيه متكامل، متصلة بـ Laravel REST API، وتشمل لوحة تحكم إدارية، نظام حجز، إدارة الطلبات والمشتريات، مصادقة مستخدمين، وبحث + Pagination ديناميكي.

🚀 Features
👤 Authentication

تسجيل دخول باستخدام Laravel Sanctum

تخزين token و user في localStorage

توجيه المستخدم حسب الدور:

Admin → Dashboard / ERP

User → Home

📊 Admin Dashboard

عرض إحصائيات (Users, Products, Orders, Reservations, Employees, Sales, Revenue…)

عرض أحدث البيانات لكل جدول

Generic CRUD Tables لكل الجداول

Search و Pagination

إخفاء الحقول الحساسة (مثل password)

📅 Reservations System

إرسال حجز من المستخدم → pending

تحكم الأدمن:

✅ Confirm Reservation → يرسل Email تلقائي

❌ Cancel Reservation

🛒 ERP Extension
Orders

CRUD كامل: إنشاء / تعديل / حذف / تأكيد / إلغاء الطلبات

متابعة Status: pending, confirmed, canceled

التحقق من المخزون قبل التأكيد

أمثلة JSON:

{
"customer_id": 1,
"items": [
{"product_id": 1, "quantity": 1}
]
}

Invoices

إنشاء فاتورة تلقائيًا عند تأكيد الطلب

تسجيل مدفوعات جزئية أو كاملة

تحديث حالة الفاتورة: partial / paid

استرجاع الأموال (Refunds)

عرض الفاتورة كاملة مع Items، Payments، Refunds، Journal Entries

مثال JSON endpoint /api/erp/invoices/{id}/full:

{
"invoice": { ...full invoice data with items, payments, refunds, journal_entries... }
}

Payments

تسجيل دفع مرتبط بالفاتورة

منع دفع أكبر من المتبقي

تحديث حالة الفاتورة تلقائيًا (partial / paid)

تسجيل قيود محاسبية تلقائيًا (journal_entries)

Refunds

تسجيل استرجاع الأموال جزئيًا

تحديث القيود المحاسبية تلقائيًا

Journal Entries

كل دفعة أو استرجاع يتم تسجيله في القيود المحاسبية

كل Entry مرتبط بالمصدر (Invoice, Payment, Refund)

🔍 Search & Performance

Search مربوط بالـ Backend

useDebounce لتقليل عدد الـ requests

معالجة أخطاء 429 (Too Many Requests)

تحسين الأداء للـ Dashboard والـ Tables

🧠 Concepts Used

React Hooks (useState, useEffect, useCallback)

Context API (AuthContext)

Axios + Interceptors مع Bearer Token

Protected Routes

Debounced Search

Reusable Components

Clean API Integration

Error Handling & Notifications

Laravel Eloquent Relationships & Transactions

ERP Accounting Concepts: Payments, Refunds, Journal Entries

🛠️ Tech Stack

Frontend

React.js, React Router, Axios, Context API

Backend

Laravel, Sanctum Authentication

RESTful APIs

Mail (Mailtrap)

ERP Modules (Orders, Invoices, Payments, Refunds, Finance, Journal Entries)

📂 Project Structure (Simplified)
src/
│── pages/
│ ├── Login.jsx
│ ├── Admin/
│ │ ├── Dashboard.jsx
│ │ ├── CrudForm.jsx
│ │ └── CrudTable.jsx
│── components/
│ ├── AdminLayout.jsx
│ └── AdminNavbar.jsx
│── context/
│ └── AuthContext.jsx
│── services/
│ └── axios.js
│── hooks/
│ └── useDebounce.js
│── utils/
│ └── notify.js

🔐 Environment Setup
REACT_APP_API_URL=https://caffeinecoveapi-production-a107.up.railway.app/api

تأكد من تخزين token بعد تسجيل الدخول وإرساله تلقائيًا مع كل طلب ERP.

▶️ Run Project
npm install
npm start
php artisan migrate
php artisan serve

⚠️ Common Issues Handled

401 Unauthorized → Token أو Password خطأ

403 Forbidden → صلاحية محدودة (ERP)

429 Too Many Requests → Debounce

Route [login] not defined → Middleware Sanctum

بطء Dashboard → تقليل عدد الـ API calls

📌 Future Improvements

Role Permissions (RBAC)

Export data (Excel / PDF)

Advanced filters

Real-time notifications

👨‍💻 Author

Mohamed Berik
Junior Full Stack Web Developer Laravel | React | REST APIs | ERP Extensions
