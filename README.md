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

Generic CRUD Tables (جدول واحد يخدم كل الجداول)

Search لكل جدول (Backend Search)

Pagination

إخفاء الحقول الحساسة (مثل password)

📅 Reservations System

إرسال حجز من المستخدم → pending

تحكم الأدمن:

✅ Confirm Reservation → يرسل Email تلقائي

❌ Cancel Reservation

🛒 ERP Extension

إدارة Orders:

إنشاء / تعديل / حذف / تأكيد / إلغاء الطلبات

متابعة Status: pending, confirmed, canceled

إدارة Invoices:

تسجيل مدفوعات جزئية أو كاملة

تحديث حالة الفاتورة: partial / paid

إدارة Purchase Orders:

إنشاء / استلام / دفع طلبات الشراء

لوحة Finance Dashboard: إحصائيات مالية، إيرادات، مدفوعات، مشتريات

Permissions & RBAC: الوصول للعمليات بناءً على الدور والصلاحيات

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

🛠️ Tech Stack

Frontend

React.js

React Router

Axios

Context API

Backend (Connected)

Laravel

Sanctum Authentication

RESTful APIs

Mail (Mailtrap)

ERP Modules (Orders, Invoices, Purchase Orders, Finance)

📂 Project Structure (Simplified)
src/
│── pages/
│ ├── Login.jsx
│ ├── Admin/
│ │ └── Dashboard.jsx
│ │ └── CrudForm.jsx
│ │ └── CrudTable.jsx
│── components/
│ ├── AdminLayout.jsx
│ ├── AdminNavbar.jsx
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

⚠️ Common Issues Handled

401 Unauthorized → Token أو Password خطأ

403 Forbidden → Token غير صالح أو صلاحية محدودة (ERP)

429 Too Many Requests → حلها بـ Debounce

Route [login] not defined → Middleware Sanctum

ظهور password → تم حله من Backend

بطء Dashboard → تقليل عدد الـ API calls

📌 Future Improvements

Role Permissions (RBAC)

Export data (Excel / PDF)

Advanced filters

Real-time notifications

👨‍💻 Author

Mohamed Berik
Junior Full Stack Web Developer
Laravel | React | REST APIs | ERP Extensions
