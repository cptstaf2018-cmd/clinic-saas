# Clinic Management SaaS — CLAUDE.md

## Project Overview

A multi-tenant B2B SaaS clinic operating system sold directly to clinics in Iraq (Tikrit-first).

**This is NOT a doctor-search platform.**
Each clinic gets its own private system to manage patients, appointments, and records.

---

## System Architecture

```
Patient (WhatsApp)          Clinic (Dashboard)        Super Admin (Dashboard)
       ↓                           ↓                           ↓
 WhatsApp Bot               Next.js Dashboard         Next.js Admin Panel
       ↓                           ↓                           ↓
       └──────────────── Single PostgreSQL Database ───────────────┘
```

---

## System Roles

### 1. Super Admin (Platform Owner)
- Controls all clinics on the platform
- Approves and rejects payments
- Activates / deactivates clinic subscriptions
- Views total revenue and analytics

### 2. Clinic Admin
- Manages own patients and appointments
- Defines working hours and available slots from dashboard
- Sends manual reminders to patients from dashboard
- Views own clinic data only

### 3. Patient
- Interacts via WhatsApp only
- Never touches the dashboard

---

## Subscription Plans

### Trial
- **Duration:** 14 days free upon registration
- **Access:** Full system access
- After trial ends → subscription becomes inactive until payment

### Paid Plans (Monthly)

| Plan | Price (IQD) | Features |
|------|-------------|----------|
| أساسية | 35,000 | Appointments + Patients + WhatsApp Bot |
| متوسطة | 45,000 | + Automatic Reminders + Medical Records |
| مميزة | 55,000 | + Reports + Priority Support |

### Plan Rules
- WhatsApp bot is available in ALL plans — it is the core selling feature
- Automatic reminders are متوسطة and above only
- Trial gives full access to evaluate all features
- After trial: clinic must subscribe to continue

---

## Payments System

### Option A — Manual Payment (MVP)
1. Clinic sends payment (cash / wallet / bank transfer)
2. Super Admin logs payment manually in admin panel
3. Super Admin approves payment + selects plan + sets duration
4. System activates clinic subscription automatically

### Option B — SuperKey Online Payment
- SuperKey account number: **07706688044**
- Clinic initiates payment via SuperKey
- SuperKey sends webhook confirmation to the system
- System verifies webhook → automatically activates subscription
- All SuperKey transactions must be logged in the Payment table

### Payment Security Rules
- Only Super Admin can approve manual payments
- No clinic can self-activate its subscription
- All payments must be logged in the database regardless of method
- SuperKey webhook must be verified before activating subscription

### Payment Lifecycle
```
Payment Created → status: pending
        ↓
Manual: Super Admin approves / rejects
SuperKey: webhook received + verified
        ↓
Approved → subscriptionStatus = active + expiresAt = now + 30 days
Rejected → no activation, clinic notified
```

---

## Subscription Rules

- New clinic → 14 days free trial → `status: trial`, `expiresAt: now + 14 days`
- Cron runs daily → checks `expiresAt` → if passed → `status: inactive`
- If `status = inactive` or `trial expired`:
  - WhatsApp bot replies: "العيادة غير متاحة حالياً"
  - Dashboard becomes read-only
  - All existing data is preserved
- If `status = active`:
  - Full access based on plan features

---

## Database Models

```prisma
model Clinic {
  id                 String        @id @default(cuid())
  name               String
  whatsappNumber     String        @unique
  createdAt          DateTime      @default(now())
  users              User[]
  patients           Patient[]
  appointments       Appointment[]
  payments           Payment[]
  workingHours       WorkingHours[]
  subscription       Subscription?
}

model User {
  id           String   @id @default(cuid())
  clinicId     String?
  clinic       Clinic?  @relation(fields: [clinicId], references: [id])
  email        String   @unique
  passwordHash String
  role         String   @default("doctor") // doctor | staff | superadmin
  createdAt    DateTime @default(now())
}

model Subscription {
  id        String   @id @default(cuid())
  clinicId  String   @unique
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  plan      String   // trial | basic | standard | premium
  status    String   @default("trial") // trial | active | inactive
  startDate DateTime @default(now())
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Patient {
  id            String        @id @default(cuid())
  clinicId      String
  clinic        Clinic        @relation(fields: [clinicId], references: [id])
  name          String
  whatsappPhone String
  createdAt     DateTime      @default(now())
  appointments  Appointment[]

  @@unique([clinicId, whatsappPhone])
}

model Appointment {
  id               String   @id @default(cuid())
  clinicId         String
  clinic           Clinic   @relation(fields: [clinicId], references: [id])
  patientId        String
  patient          Patient  @relation(fields: [patientId], references: [id])
  date             DateTime
  status           String   @default("pending") // pending | confirmed | completed | cancelled
  queueNumber      Int?     // sequential number for today's queue (1, 2, 3...)
  queueStatus      String   @default("waiting") // waiting | current | done
  reminder24hSent  Boolean  @default(false)
  reminder1hSent   Boolean  @default(false)
  createdAt        DateTime @default(now())
}

model WorkingHours {
  id         String   @id @default(cuid())
  clinicId   String
  clinic     Clinic   @relation(fields: [clinicId], references: [id])
  dayOfWeek  Int      // 0=Sunday, 1=Monday, ... 6=Saturday
  startTime  String   // "09:00"
  endTime    String   // "17:00"
  isOpen     Boolean  @default(true)

  @@unique([clinicId, dayOfWeek])
}

model WhatsappSession {
  id        String   @id @default(cuid())
  clinicId  String
  phone     String
  step      String   // awaiting_name | awaiting_slot | done
  updatedAt DateTime @updatedAt

  @@unique([clinicId, phone])
}

model Payment {
  id        String   @id @default(cuid())
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  amount    Int
  method    String   // manual | superkey
  status    String   @default("pending") // pending | approved | rejected
  reference String?  // transaction ID from SuperKey or manual note
  createdAt DateTime @default(now())
}
```

---

## Patient Flow (WhatsApp Only)

- Patient messages the clinic's WhatsApp number
- Phone number is captured automatically — patient never types it
- **First visit:** patient types name only → system shows available slots based on clinic's WorkingHours
- **Return visit:** system recognizes patient by phone, greets by name, shows existing appointment if any, then offers new booking
- All reminders sent automatically by the system (متوسطة plan and above)

## Clinic Flow (Dashboard Only)

- Clinic staff logs in to web dashboard
- Sets working hours and available time slots
- Views today's appointments, patient list, patient profiles
- Changes appointment status (confirmed / completed / cancelled)
- Sends manual reminders to patients directly from dashboard
- Presses "التالي" to call next patient → updates waiting room display instantly
- Views subscription status and payment history

## Waiting Room Display

- Separate public page: `/display/[clinicId]`
- Opened on a TV or screen in the waiting room — no login required
- Refreshes automatically every few seconds (polling)
- Shows:
  - Current patient being called (name)
  - Next patients in queue (names)
- Updates instantly when clinic staff presses "التالي" in the dashboard

## Super Admin Flow (Admin Panel)

- Views all clinics on the platform
- Approves or rejects payments
- Activates / deactivates clinic subscriptions
- Sets plan and expiry date upon payment approval
- Views total revenue across all clinics

---

## WhatsApp Bot Logic

```
Incoming message from patient phone
        ↓
Check clinic subscription status
        ↓ inactive
Reply: "العيادة غير متاحة حالياً"
        ↓ active/trial
Does phone exist in Patient table?
        ↓ YES                          ↓ NO
Greet by name                   Reply: "اكتب اسمك الكريم"
Does patient have upcoming             ↓
appointment?                    Save name + phone → new Patient
        ↓ YES                          ↓
Remind them of appointment      Show available slots from WorkingHours
        ↓                              (minus already booked times)
Show available slots
        ↓
Patient picks slot → create Appointment → confirm via WhatsApp
```

### Session State (WhatsappSession table)
- `awaiting_name` — waiting for patient to type their name
- `awaiting_slot` — waiting for patient to choose a time slot
- `done` — conversation complete

Session stored per clinicId + phone number.

---

## Automatic Reminders (Cron) — متوسطة & مميزة plans only

Vercel Cron runs every hour:
1. Fetch appointments where `reminder24hSent = false` and appointment is within 24 hours → send reminder → set `reminder24hSent = true`
2. Fetch appointments where `reminder1hSent = false` and appointment is within 1 hour → send reminder → set `reminder1hSent = true`
3. When clinic cancels appointment → send immediate WhatsApp notification to patient

Clinic can also send manual reminders from the dashboard at any time.

---

## Subscription Expiry Cron — runs daily

1. Fetch all subscriptions where `expiresAt < now` and `status != inactive`
2. Set `status = inactive`
3. WhatsApp bot will automatically block booking for these clinics

---

## Multi-Tenancy Rules

- Every database query MUST filter by `clinicId`
- No clinic can see another clinic's data under any circumstance
- `clinicId` comes from the authenticated session — never from user input
- WhatsApp webhook identifies the clinic by the receiving WhatsApp number
- Super Admin is the only role without a `clinicId` restriction

---

## Business Rules

1. Patient phone number is taken from incoming WhatsApp message automatically
2. Patient types name only on first contact — nothing else
3. System recognizes returning patients by phone number
4. No double-booking: check for existing appointment at same date/time before creating
5. Available slots are based on clinic WorkingHours minus already booked appointments
6. Reminders track sent status to prevent duplicate messages
7. New clinic gets 14-day free trial automatically upon registration
8. System must be fast and mobile-friendly (primary users are in Iraq on mobile)
9. All bot messages must be in Arabic
10. All payments must be auditable — never delete a payment record

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend + Backend | Next.js 14 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (JWT) |
| WhatsApp | Twilio or Meta Cloud API |
| Hosting | Vercel |
| Cron Jobs | Vercel Cron |
| Online Payment | SuperKey API (07706688044) |

---

## MVP Scope

Build only:
1. Database + Prisma schema
2. Clinic registration (auto-creates 14-day trial)
3. Clinic login + Super Admin login (NextAuth)
4. Working hours management (clinic dashboard)
5. WhatsApp bot (receive → register patient → show slots → book appointment)
6. Clinic dashboard (appointments + patient list + manual reminders + "التالي" button)
7. Waiting room display page `/display/[clinicId]` (public, no login)
8. Super Admin panel (clinics list + payment approval)
9. Payment system (manual + SuperKey webhook)
10. Subscription gate + expiry cron
11. Automatic reminders cron (متوسطة & مميزة only)

---

## Out of Scope for MVP

- Staff roles and permissions
- File attachments
- Dark mode

---

## Implemented Features (Beyond Original MVP)

### Medical Records ✅
- Full CRUD for medical records per patient
- Fields: complaint, diagnosis, prescription, notes, visitDate, **followUpDate**
- `followUpDate` auto-creates an Appointment and triggers individual WhatsApp reminder 24h before
- Schema: `MedicalRecord.followUpDate DateTime?` added and migrated

### Follow-Up Appointments ✅
- Set from inside the medical record form
- Creates a confirmed Appointment automatically
- Existing cron handles 24h and 1h reminders individually per patient
- NO group/bulk reminder feature — reminders are always per-patient only

### Waiting Room Display `/display/[clinicId]` ✅
- Public page, no auth required
- Auto-polls every 5 seconds
- Sound always enabled — first touch/click on screen unlocks browser audio
- TTS strips numbers/dashes from patient name before announcing
- Announces: "المريض [name]، تفضل من فضلك" (gender-aware)

### Super Admin Impersonation ✅
- `/api/admin/enter/[clinicId]` — enters clinic as their doctor user
- Saves superadmin JWT in `sa-backup` cookie before replacing main cookie
- Subsequent clinic entries check `sa-backup` if main cookie is not superadmin
- Admin can enter multiple clinics without re-logging in

### Dashboard UX ✅
- Completed/cancelled appointments slide out of today's list with animation
- Toast notification with link to patient profile after completing appointment
- `DashboardNav` (client component) highlights active section with blue dot
- Patient name in today's list is a clickable link to patient profile

---

## Routing Architecture

```
app/
├── admin/
│   ├── (dashboard)/          ← Protected by layout (superadmin only)
│   │   ├── layout.tsx
│   │   ├── page.tsx          → /admin
│   │   ├── payments/         → /admin/payments
│   │   ├── codes/            → /admin/codes
│   │   └── settings/         → /admin/settings
│   └── login/                → /admin/login (PUBLIC — no layout)
├── dashboard/                ← Clinic staff (clinicId required)
│   ├── layout.tsx
│   ├── DashboardNav.tsx      ← Client component for active nav state
│   ├── TodayAppointmentsClient.tsx
│   ├── patients/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── MedicalRecordsClient.tsx
│   └── ...
└── display/[clinicId]/       ← PUBLIC — no auth
```

---

## Important Rules (Learned from Experience)

1. **Never send group WhatsApp reminders** — always individual per patient
2. **Admin impersonation uses `sa-backup` cookie** — do not simplify away this logic
3. **`/admin/login` must be outside the admin layout** — otherwise redirect loop
4. **Always run `prisma generate` after schema changes** — generated client in `app/generated/prisma/`
5. **Seed data must not append numbers to Arabic names** — they appear on TV screen and TTS

---

## Deployed URL

- **Production**: https://www.clinic-ai-pro.com
- **Admin**: https://www.clinic-ai-pro.com/admin/login
- **Last deployed**: 2026-05-16
