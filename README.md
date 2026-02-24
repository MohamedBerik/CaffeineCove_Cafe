☕ Caffeine Cove

Full Stack ERP & Accounting System (React + Laravel)

Caffeine Cove is a full-stack ERP and accounting system designed for café and retail management.
The system goes beyond CRUD operations by implementing a structured accounting engine with double-entry bookkeeping, payment tracking, refund control, and customer ledger management.
This project demonstrates real-world ERP logic, financial consistency, and scalable backend architecture.

🏗️ System Overview

Caffeine Cove includes:
Order Management
Invoice Engine
Partial & Multiple Payments
Refund System (Invoice & Credit Separation)
Customer Ledger
Double-Entry Journal Accounting
Admin Dashboard (React)
Built with production-style architecture using:
Laravel REST API
React.js Frontend
MySQL Database
Laravel Sanctum Authentication

🚀 Core Features

🔐 Authentication & Role-Based Access
Sanctum Token Authentication
Admin / User Role Separation
Protected Routes
Axios Interceptors for secure API calls

🧾 ERP & Finance Modules

1️⃣ Orders
Create / Update / Cancel Orders
Stock validation before confirmation
Order → Invoice generation

2️⃣ Invoice Engine
Automatic invoice creation
Status lifecycle:
unpaid
partially_paid
paid
Dynamic remaining balance calculation

3️⃣ Payments System
Supports partial payments
Multiple payments per invoice
Applied amount vs credit amount separation
Real-time status recalculation

4️⃣ Advanced Refund Engine
Refunds are linked to specific payments and support:
invoice refund
credit refund
System prevents:
Over-refunding
Double refunds
Refund exceeding available balance
Per-payment tracking includes:
refunded_invoice
refunded_credit
available_invoice_refund
available_credit_refund
Invoice status automatically recalculates after each refund.

📊 Accounting Engine (Double Entry)

This project implements structured accounting principles.

✔ Journal Entries
Created for payments and refunds
Balanced debit/credit lines
Linked to source invoice
Full financial traceability

✔ Customer Ledger
Tracks:
Invoice (Debit)
Payment Applied (Credit)
Refund Invoice (Debit)
Refund Credit (Credit)
Ensures:
Net balance consistency
Accurate customer account tracking
Financial audit capability

📈 Admin Dashboard (React)

Finance summary
Sales overview
Order tracking
Backend-powered search
Debounced API calls
Pagination
Reusable CRUD components

🧠 Engineering Concepts Demonstrated

RESTful API Design
Separation of Concerns
Accounting Logic Modeling
Eloquent Relationships
Computed Financial Aggregations
Guard Conditions & Edge Case Handling
Protected Routes & Token Interceptors
Debounced Search Optimization
Structured Error Handling

🛠️ Tech Stack

Backend
Laravel 10+
Eloquent ORM
MySQL
Sanctum Authentication
Frontend
React.js
React Router
Axios
Context API
Tailwind CSS / Bootstrap

🔐 Edge Cases Handled

Prevent refund > available amount
Prevent duplicate refunds
Auto recalculation of invoice status
Ledger consistency after refund
Balanced journal entries
Partial payment scenarios
Multiple payment support

📂 Architecture (Simplified)

Invoice
├── Payments
│ ├── Refunds
│
├── JournalEntries
│ └── JournalLines
│
└── CustomerLedgerEntries

🛣️ Roadmap

Transaction locking for race condition prevention
Automated tests (Unit & Feature)
Advanced financial reports (Aging / AR / Cash Flow)
Role-based permissions (RBAC)
Export to Excel / PDF
Audit log system

💼 Why This Project Matters

This project demonstrates:
✔ Real accounting logic implementation
✔ ERP-style data relationships
✔ Financial consistency enforcement
✔ Clean API design
✔ Scalable architecture foundation
It is not a simple CRUD dashboard — it models real-world financial workflows.

👨‍💻 Author

Mohamed Berik
Full Stack Developer
Laravel | React | REST APIs | ERP Systems | Accounting Logic
