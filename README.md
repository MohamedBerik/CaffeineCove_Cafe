Caffeine Cove – React Frontend & ERP Dashboard

Frontend application for Caffeine Cove café system built with React.js. Integrated with Laravel REST API for managing orders, invoices, payments, refunds, and finance dashboard.

🚀 Features
Authentication

Login using Laravel Sanctum API token

Stores token & user info in localStorage

Role-based routing:

Admin → Dashboard / ERP

User → Home

Admin Dashboard

Display key statistics: Users, Products, Orders, Reservations, Sales, Revenue

Show latest data from all tables

Generic CRUD tables for all entities

Search with backend integration

Pagination

Hide sensitive fields (e.g., passwords)

Orders Management

Create / Edit / Delete / Confirm / Cancel orders

Track status: pending, confirmed, cancelled

Stock validation before order confirmation

Invoices & Payments

Display invoices and their statuses

Record partial or full payments

Track refunds

Show journal entries for each invoice

Reservations System

Submit reservations → pending

Admin can confirm (email sent automatically) or cancel

Search & Performance

Backend-powered search

useDebounce to reduce API calls

Handles rate limiting (429 Too Many Requests)

Optimized for fast dashboard rendering

🧠 Concepts Used

React Hooks (useState, useEffect, useCallback)

Context API (AuthContext) for authentication

Axios with interceptors for Bearer Token

Protected Routes

Debounced search

Reusable components

Clean API integration with error handling and notifications

🛠️ Tech Stack

React.js

React Router

Axios

Context API

Tailwind CSS / Bootstrap (if used)

Connected to Laravel Backend API

📂 Project Structure (Simplified)
src/
├── pages/
│ ├── Login.jsx
│ ├── Admin/
│ │ ├── Dashboard.jsx
│ │ ├── CrudForm.jsx
│ │ └── CrudTable.jsx
├── components/
│ ├── AdminLayout.jsx
│ └── AdminNavbar.jsx
├── context/
│ └── AuthContext.jsx
├── services/
│ └── axios.js
├── hooks/
│ └── useDebounce.js
└── utils/
└── notify.js

🔧 Environment Setup
REACT_APP_API_URL=https://caffeinecoveapi-production-a107.up.railway.app/api

Ensure the token is stored after login and sent automatically with ERP API requests.

Run Project
npm install
npm start

⚠️ Common Issues Handled

401 Unauthorized → Wrong token or password

403 Forbidden → Invalid token or limited role

429 Too Many Requests → solved via debounce

Route [login] not defined → Sanctum middleware

Sensitive fields (e.g., password) hidden from tables

Dashboard performance optimized by reducing API calls

📌 Future Improvements

Role Permissions (RBAC)

Export data (Excel / PDF)

Advanced filters

Real-time notifications

Multi-language support

👨‍💻 Author

Mohamed Berik – Junior Full Stack Developer (Laravel | React | REST API | ERP Extensions)
