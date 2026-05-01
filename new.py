🧠 CLAUDE.md — Clinic SaaS + Super Admin + Payments System
🎯 Project Overview

A multi-tenant Clinic Management SaaS platform for clinics in Iraq (Tikrit-first) with:

WhatsApp booking system
Clinic dashboards
Super Admin control panel
Subscription & payments system
🏗️ System Architecture
Patient (WhatsApp)
        ↓
WhatsApp Bot API
        ↓
Backend (Next.js API)
        ↓
PostgreSQL (Multi-tenant via clinicId)
        ↓
├── Clinic Dashboard
├── Super Admin Dashboard
└── Payments System
👥 SYSTEM ROLES
1. Super Admin (Platform Owner)
Controls all clinics
Manages subscriptions
Approves payments
Views analytics
2. Clinic Admin
Manages patients
Manages appointments
Views own clinic only
💳 PAYMENTS SYSTEM (NEW CORE MODULE)
🎯 Purpose

Manage clinic subscriptions and activate/deactivate clinics based on payments.

🔵 Payment Flow
Option A — Manual Payment (MVP)
Clinic sends payment (cash / wallet / transfer)
Super Admin logs payment manually
Admin approves payment
System activates clinic
Option B — Super Key Integration (Optional API)

If external payment provider exists:

System sends payment request
Receives confirmation via webhook
Automatically activates subscription
🔁 Payment Lifecycle
Payment Created → Pending
        ↓
Admin/API verifies payment
        ↓
Approved → subscription = active
        ↓
Rejected → no activation
🧱 Payment Model
model Payment {
  id        String   @id @default(cuid())
  clinicId  String
  amount    Int
  method    String   // manual | superkey
  status    String   @default("pending") // pending | approved | rejected
  reference String?  // transaction id or note
  createdAt DateTime @default(now())
}
🏥 Subscription Rules
If subscriptionStatus = inactive:
WhatsApp bot blocks booking
Dashboard becomes read-only
Data is preserved
If active:
Full system access
🔐 Payment Security Rules
Only Super Admin can approve payments
No clinic can self-activate subscription
All payments must be logged in database
Webhook payments must be verified (if API used)
🏥 CLINIC DASHBOARD

Each clinic can:

View appointments
Manage patients
Change appointment status
See subscription status
🧠 SUPER ADMIN DASHBOARD
📊 Features:
Clinics Management
View all clinics
Activate / deactivate clinics
Edit clinic details
Payments Management
View all payments
Approve / reject payments
Track revenue
Analytics
Total clinics
Active subscriptions
Total payments
📲 WHATSAPP BOT RULES
Identify clinic by WhatsApp number
Identify patient by phone number
First message → register patient
Returning patient → greet by name
Always enforce subscription status
🔁 SESSION SYSTEM
WAITING_NAME
WAITING_SLOT
COMPLETED

Stored per:

clinicId
phone number
🧱 MULTI-TENANT RULES (CRITICAL)
Every table MUST include clinicId
Every query MUST filter by clinicId
No cross-clinic data access allowed
🚀 MVP FEATURES

Build only:

Clinic system (dashboard)
WhatsApp bot booking
Super admin dashboard
Manual payment system
Subscription control
❌ OUT OF SCOPE
Stripe / full banking integration
Medical records system
Staff roles
AI features
Advanced analytics
⚙️ DEVELOPMENT RULES
Simplicity first
WhatsApp = input layer only
Database = single source of truth
Payments must be auditable
No overengineering in MVP
🔥 FINAL VISION

A WhatsApp-driven Clinic SaaS platform with centralized admin + subscription system, designed for real-world deployment in Iraq.