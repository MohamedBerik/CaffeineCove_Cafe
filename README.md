# Caffeine Cove – React Frontend

واجهة أمامية لإدارة موقع كافيه متكامل، متصلة بـ Laravel REST API، تشمل لوحة تحكم إدارية، نظام حجز، عرض الطلبات والفواتير.

## 🚀 Features

### 👤 Authentication

- تسجيل دخول باستخدام Laravel Sanctum
- توجيه المستخدم حسب الدور:
  - **Admin** → Dashboard / ERP
  - **User** → Home

### 📊 Admin Dashboard

- عرض إحصائيات: Users, Products, Orders, Reservations, Employees, Sales, Revenue
- عرض أحدث البيانات لكل جدول
- Generic CRUD Tables
- Search و Pagination ديناميكي

### 📅 Reservations System

- إرسال حجز من المستخدم → pending
- تحكم الأدمن:
  - ✅ Confirm Reservation → يرسل Email تلقائي
  - ❌ Cancel Reservation

### 🛒 ERP Modules View

- متابعة Orders, Invoices, Purchase Orders (عرض فقط)
- مشاهدة حالة الفواتير والمدفوعات
- عرض إحصائيات مالية مختصرة

### 🔍 Search & Performance

- Debounced Search لتقليل عدد الـ API requests
- معالجة أخطاء 429 (Too Many Requests)

## 🧠 Concepts Used

- React Hooks: `useState`, `useEffect`, `useCallback`
- Context API: `AuthContext`
- Axios + Interceptors مع Bearer Token
- Protected Routes
- Debounced Search
- Reusable Components
- Error Handling & Notifications

## 🛠️ Tech Stack

- React.js, React Router
- Axios, Context API
- Bootstrap / Tailwind (حسب المشروع)

## 📂 Project Structure (Simplified)

src/
│── pages/
│ ├── Login.jsx
│ ├── Admin/
│ ├── Dashboard.jsx
│ ├── CrudForm.jsx
│ └── CrudTable.jsx
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

## 🔐 Environment Setup

REACT_APP_API_URL=https://caffeinecoveapi-production-a107.up.railway.app/api

- تأكد من تخزين token بعد تسجيل الدخول وإرساله تلقائيًا مع كل طلب ERP.

## ▶️ Run Project

```bash
npm install
npm start
⚠️ Common Issues
401 Unauthorized → Token أو Password خطأ

403 Forbidden → صلاحية محدودة (ERP)

Route [login] not defined → Middleware Sanctum

بطء Dashboard → تقليل عدد الـ API calls

📌 Future Improvements
Role Permissions (RBAC)

Export data (Excel / PDF)

Advanced filters

Real-time notifications

👨‍💻 Author
Mohamed Berik – Junior Full Stack Web Developer
```
