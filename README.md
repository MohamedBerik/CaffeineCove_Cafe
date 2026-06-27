# ☕ Caffeine Cove (Dental Clinic ERP)

**Full Stack Dental Clinic Management & Accounting System (React + Laravel)**

Caffeine Cove is a comprehensive full-stack ERP system tailored for **dental clinics and healthcare management**.
It combines robust accounting logic (double-entry bookkeeping) with advanced clinic operations (appointments, patient records, treatment plans) and a **production-grade real-time notification engine**.

## 🏗️ System Overview

Caffeine Cove is built with a decoupled architecture:

- **Frontend:** React.js SPA with Context API and Axios.
- **Backend:** Laravel REST API with Sanctum Authentication.
- **Realtime:** Pusher WebSockets for live notifications and activity.

### Core Modules:

- **Clinic Management:** Appointments, Patients, Doctors, Treatment Plans, Dental Records.
- **Financial Engine:** Invoices, Payments, Refunds, Double-Entry Journal, Customer Ledger.
- **Real-Time System:** Live alerts, toast notifications, and private channel broadcasting.

## 🚀 Core Features

### 🔐 Authentication & Multi-Tenancy

- Sanctum Token Authentication (Secure HttpOnly cookies in production).
- **Company/Clinic Isolation:** All data is scoped per `company_id`.
- Role-Based Access (Admin, Doctor, Staff).

### 🦷 Clinic & Patient Management

1. **Appointments**
   - Booking, Rescheduling, Cancellation.
   - Conflict detection and availability slots.
   - Appointment status tracking (Scheduled, Completed, No-Show).
2. **Patients**
   - CRM for patients with medical history.
   - Treatment timelines and profile management.
3. **Treatment Plans & Procedures**
   - Create multi-phase treatment plans.
   - Link procedures directly to invoices.
   - Track plan progress and sessions.

### 📊 Accounting & Finance Engine

- **Invoice Engine:** Auto-generation from appointments/orders. Statuses: `unpaid`, `partially_paid`, `paid`.
- **Double-Entry Journal:** Automatic balanced entries for every financial transaction.
- **Advanced Refund System:** Prevents over-refunding. Tracks `refunded_invoice` vs `refunded_credit`.
- **Customer Ledger:** Real-time balance tracking (Debit/Credit).

### 🔔 Real-Time Notification System (Enterprise Grade)

This is a dedicated layer ensuring instant feedback and system awareness:

- **Private Channels:** Multi-tenant isolation using `private-company.{id}` to prevent data leaks.
- **Live Alerts:** New orders, low stock warnings, payment failures, and appointment reminders appear instantly.
- **Persistent Storage:** All alerts are saved in `system_alerts` table for audit and history.
- **UI Integration:**
  - **Toast Popups:** Customizable alerts with sound feedback.
  - **Notification Bell:** Real-time badge counter with dropdown preview.
  - **Mark as Read:** Syncs read status instantly with the backend.

## 🧠 Engineering Concepts Demonstrated

- **Separation of Concerns:** Reusable hooks (`useAlertsSocket`), context providers, and service layers.
- **Real-Time Patterns:** WebSocket connection handling, reconnection logic, and duplicate event prevention.
- **Financial Consistency:** Database transactions and ledger balancing.
- **Performance:** Debounced search, pagination, and optimized React re-renders.

## 🛠️ Tech Stack

**Frontend**

- React.js (Hooks, Context API)
- React Router v6
- Axios (Interceptors)
- **Pusher** & **Laravel Echo** (Realtime)
- React Hot Toast
- CSS Modules / Custom Styling

**Backend**

- Laravel 10+ (REST API)
- MySQL 8.0
- Laravel Sanctum
- Pusher Channels

## 🛣️ Roadmap & Recent Updates

- [x] **Core ERP & Accounting Logic**
- [x] **Clinic Management Module (Appointments, Treatments)**
- [x] **Multi-Tenant Architecture (Company Scoping)**
- [x] **Production-Grade Realtime Alerts (Private Channels)**
- [x] **System Alerts Center & Activity Logs**
- [ ] **Dental Charting (Odontogram) Integration**
- [ ] **Automated Reminders (Email/SMS)**
- [ ] **Advanced Analytics Dashboard**

## 💼 Why This Project Matters

This is **not a simple CRUD dashboard**. It demonstrates the ability to architect a complex system that handles:

- **Strict Financial Accounting** (Journals & Ledgers).
- **Sensitive Healthcare Scheduling** (Appointments & Conflicts).
- **Secure Real-Time Communication** (Private WebSockets).
- **Scalable Multi-Tenant Data Isolation**.

## 👨‍💻 Author

**Mohamed Berik**
Full Stack Developer
_Laravel | React | REST APIs | ERP Systems | Real-Time Applications_
