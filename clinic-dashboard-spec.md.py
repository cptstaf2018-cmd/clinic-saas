🚀 Build a Complete Multi-Tenant Clinic SaaS Platform Dashboard (Next.js + Retool Integration)

I have an existing SaaS platform for clinic management built with:

Next.js 16 (App Router)
React 19
TypeScript
Tailwind CSS
shadcn/ui
Prisma ORM
PostgreSQL
NextAuth/Auth
WhatsApp Bot integration
Multi-tenant architecture using clinicId
Subscription plans and feature gates

Roles:

superadmin
clinic_admin
receptionist
doctor
✅ Existing System Features

The system already supports:

Clinics management
Patients management
Appointments booking
WhatsApp automated conversations
Subscription plans
OTP verification
Audit logging
Reminder cron jobs
Impersonation (superadmin login as clinic staff)
Working hours
Reports and analytics
🎯 Goal

Build a hybrid dashboard system using:

1. Custom Frontend (Next.js + shadcn/ui)
2. Retool (for internal admin operations)

The system must support two layers of admin experience:

🧠 Architecture Requirement (IMPORTANT)
Layer 1: Super Admin Dashboard (Custom Next.js UI)

Used for:

Platform control
High-level analytics
Subscription management
Clinics overview
Impersonation
System health monitoring

Built with:

Next.js App Router
shadcn/ui
Recharts
Tailwind
Layer 2: Operational Admin Panel (Retool)

Use Retool for fast internal tools such as:

Retool Modules:
Clinic CRUD management
Patient database exploration
Appointment manual override
WhatsApp message logs viewer
Subscription edits (manual override)
Support & customer service panel
Audit log explorer
Error monitoring dashboard
Retool Data Sources:
PostgreSQL directly
Prisma-backed tables
REST APIs from Next.js backend
Retool Roles:
superadmin only
internal staff (optional future expansion)
🏥 1. Super Admin Dashboard (Custom UI)
Sections
Global Overview
Clinics Management
Subscription Management
Revenue Analytics
System Events & Error Logs
WhatsApp Usage Statistics
Impersonation Center
Platform Settings
KPIs
Total Clinics
Active Clinics
Trial Clinics
Expired Subscriptions
Monthly Revenue
WhatsApp Messages Sent
Total Patients
Total Appointments
Error Count
Clinics Table

Columns:

Clinic Name
Plan
Subscription Status
Start Date
End Date
Patients Count
Appointments Count
WhatsApp Usage
Last Activity
Actions:
View
Edit
Suspend
Open in Retool 🔗
Impersonation
Secure "Login as Clinic"
Warning banner
Return to Super Admin
🏥 2. Clinic Dashboard (Custom UI)
Sections
Dashboard Overview
Appointments (Calendar + List)
Patients
Staff Users
Doctors
Working Hours
WhatsApp Bot Settings
Subscription & Usage
Reports
Clinic Settings
KPIs
Today Appointments
Upcoming Appointments
New Patients
Monthly Revenue
WhatsApp Conversations
Bot Booking Rate
No-Show Rate
⚙️ Retool Admin Panel (IMPORTANT ADDITION)

Create a dedicated Retool workspace with:

Pages:
1. Clinic Management Console
CRUD clinics
Change subscription
View usage limits
2. Patient Explorer
Search patients across all clinics
View history timeline
3. Appointment Control Center
Edit / cancel / reschedule any appointment
Force override conflicts
4. WhatsApp Message Inspector
View raw messages
Debug bot conversations
Replay conversation flow
5. Billing & Subscriptions
Upgrade/downgrade plans
Manual adjustments
Invoices overview
6. System Logs
Prisma logs
API logs
Error tracking
🔐 Multi-Tenant Rules
Super admin can access all clinics
Clinic users are restricted by clinicId
Retool access is superadmin-only
All Next.js server actions MUST enforce tenant isolation
🎨 Design Requirements

Custom UI must be:

Inspired by:
Stripe Dashboard
Vercel Dashboard
Linear
Clean SaaS layout
RTL + LTR support
Dark mode
Responsive
Accessible
Smooth animations
📊 Charts

Use:

Recharts
Revenue trends
WhatsApp usage
Appointment analytics
📦 Deliverables
Next.js folder structure
Route map
UI architecture
Reusable components
Super Admin Dashboard pages
Clinic Dashboard pages
Retool workspace structure (VERY IMPORTANT)
API structure for Retool integration
TypeScript types
Mock data examples
Security model
🚀 Key Requirement

Retool is NOT replacing the system.

It is used as:

"Internal operational control layer for super admins"

while Next.js remains the main product UI for clinics and users.

🧩 Optional Enhancement
Add Retool embedded links inside Super Admin UI
Add "Open in Retool" button per clinic
Use signed URLs for secure access
Consider future migration of some admin features to Retool only