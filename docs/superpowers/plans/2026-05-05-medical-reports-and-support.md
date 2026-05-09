# Medical Reports & Support Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-patient medical records and a self-service support panel to every clinic dashboard so clinic staff can manage patient history and fix common system issues themselves — without calling for help.

**Architecture:** Two independent features on top of the existing Next.js App Router dashboard. Feature 1 extends the patient list with a full profile page backed by a new `MedicalRecord` Prisma model. Feature 2 adds a `/dashboard/support` page with health-check + quick-fix API routes and a new sidebar nav item. Both follow existing auth/db/multi-tenancy patterns exactly.

**Tech Stack:** Next.js 14 App Router, Prisma ORM (PostgreSQL via PrismaPg adapter), NextAuth JWT sessions, Tailwind CSS, `@/lib/db`, `@/lib/auth`.

---

## File Map

### Feature 1 — Medical Reports
| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add `MedicalRecord` model + relations on `Patient` and `Clinic` |
| `app/api/medical-records/route.ts` | Create | GET list for a patient, POST new record |
| `app/api/medical-records/[id]/route.ts` | Create | PATCH update, DELETE record |
| `app/api/patients/[id]/route.ts` | Modify | Include medical records deletion in patient DELETE transaction |
| `app/dashboard/patients/[id]/page.tsx` | Create | Patient profile server component (header + appointments + records) |
| `app/dashboard/patients/[id]/MedicalRecordsClient.tsx` | Create | Interactive add/edit/delete/expand medical records |
| `app/dashboard/patients/PatientSearchClient.tsx` | Modify | Add "الملف" link button per patient row |

### Feature 2 — Support Panel
| File | Action | Purpose |
|------|--------|---------|
| `app/api/support/health/route.ts` | Create | GET: DB status, subscription, queue stats, issue counts |
| `app/api/support/fix/route.ts` | Create | POST: run a named quick-fix action |
| `app/dashboard/support/page.tsx` | Create | Support page server component (auth guard + layout) |
| `app/dashboard/support/SupportClient.tsx` | Create | Health cards + fix buttons with toast feedback |
| `app/dashboard/layout.tsx` | Modify | Append support nav item to bottom of NAV array |

---

## Task 1: Prisma Schema — MedicalRecord Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `MedicalRecord` model and update relations**

In `prisma/schema.prisma`:

**Add to `model Clinic` body:**
```prisma
medicalRecords MedicalRecord[]
```

**Add to `model Patient` body:**
```prisma
medicalRecords MedicalRecord[]
```

**Add new model at the end of the file:**
```prisma
model MedicalRecord {
  id           String   @id @default(cuid())
  clinicId     String
  patientId    String
  date         DateTime @default(now())
  complaint    String
  diagnosis    String?
  prescription String?
  notes        String?
  createdAt    DateTime @default(now())
  clinic       Clinic   @relation(fields: [clinicId], references: [id])
  patient      Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([clinicId, patientId])
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-medical-records
```

Expected: `migrations/..._add_medical_records/migration.sql created and applied`

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add MedicalRecord model to schema"
```

---

## Task 2: API — Medical Records CRUD

**Files:**
- Create: `app/api/medical-records/route.ts`
- Create: `app/api/medical-records/[id]/route.ts`

- [ ] **Step 1: Create `app/api/medical-records/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId)
    return NextResponse.json({ error: "patientId مطلوب" }, { status: 400 });

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const records = await db.medicalRecord.findMany({
    where: { patientId, clinicId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const { patientId, complaint, diagnosis, prescription, notes, date } =
    await req.json();

  if (!patientId || !complaint?.trim())
    return NextResponse.json({ error: "المريض والشكوى مطلوبان" }, { status: 400 });

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const record = await db.medicalRecord.create({
    data: {
      clinicId,
      patientId,
      complaint: complaint.trim(),
      diagnosis: diagnosis?.trim() || null,
      prescription: prescription?.trim() || null,
      notes: notes?.trim() || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(record, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/medical-records/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const record = await db.medicalRecord.findFirst({ where: { id, clinicId } });
  if (!record)
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });

  const { complaint, diagnosis, prescription, notes, date } = await req.json();
  if (!complaint?.trim())
    return NextResponse.json({ error: "الشكوى مطلوبة" }, { status: 400 });

  const updated = await db.medicalRecord.update({
    where: { id },
    data: {
      complaint: complaint.trim(),
      diagnosis: diagnosis?.trim() || null,
      prescription: prescription?.trim() || null,
      notes: notes?.trim() || null,
      date: date ? new Date(date) : record.date,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const record = await db.medicalRecord.findFirst({ where: { id, clinicId } });
  if (!record)
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });

  await db.medicalRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Update patient DELETE to cascade medical records**

In `app/api/patients/[id]/route.ts`, replace the `$transaction` call in the `DELETE` handler:

```typescript
await db.$transaction([
  db.medicalRecord.deleteMany({ where: { patientId: id, clinicId } }),
  db.appointment.deleteMany({ where: { patientId: id, clinicId } }),
  db.patient.delete({ where: { id } }),
]);
```

- [ ] **Step 4: Commit**

```bash
git add app/api/medical-records/ app/api/patients/
git commit -m "feat: add medical records API and cascade delete on patient"
```

---

## Task 3: Patient Profile Page (Server Component)

**Files:**
- Create: `app/dashboard/patients/[id]/page.tsx`

- [ ] **Step 1: Create `app/dashboard/patients/[id]/page.tsx`**

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import MedicalRecordsClient from "./MedicalRecordsClient";

const STATUS_LABEL: Record<string, string> = {
  pending:   "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "منتهي",
  cancelled:  "ملغي",
};
const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const patient = await db.patient.findFirst({
    where: { id, clinicId },
    include: {
      appointments: { orderBy: { date: "desc" }, take: 20 },
      medicalRecords: { orderBy: { date: "desc" } },
    },
  });

  if (!patient) notFound();

  const completedCount = patient.appointments.filter(
    (a) => a.status === "completed"
  ).length;
  const lastCompleted = patient.appointments.find(
    (a) => a.status === "completed"
  );

  const serializedRecords = patient.medicalRecords.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    complaint: r.complaint,
    diagnosis: r.diagnosis,
    prescription: r.prescription,
    notes: r.notes,
  }));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Back */}
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        قائمة المرضى
      </Link>

      {/* Patient Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-700 font-bold text-xl">
              {patient.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5 dir-ltr">{patient.whatsappPhone}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{patient.appointments.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">إجمالي المواعيد</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">زيارة مكتملة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{patient.medicalRecords.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">سجل طبي</p>
          </div>
        </div>
        {lastCompleted && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            آخر زيارة:{" "}
            {new Date(lastCompleted.date).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Medical Records */}
      <MedicalRecordsClient
        patientId={patient.id}
        initialRecords={serializedRecords}
      />

      {/* Appointments History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">سجل المواعيد</h2>
        {patient.appointments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">لا توجد مواعيد</p>
        ) : (
          <div className="space-y-2">
            {patient.appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(a.date).toLocaleDateString("ar-EG", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.date).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {a.queueNumber ? ` · رقم ${a.queueNumber}` : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_COLOR[a.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/patients/[id]/page.tsx
git commit -m "feat: add patient profile page with stats and appointment history"
```

---

## Task 4: Medical Records Client Component

**Files:**
- Create: `app/dashboard/patients/[id]/MedicalRecordsClient.tsx`

- [ ] **Step 1: Create `app/dashboard/patients/[id]/MedicalRecordsClient.tsx`**

```typescript
"use client";

import { useState } from "react";

type MedicalRecord = {
  id: string;
  date: string;
  complaint: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
};

type FormState = {
  complaint: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  date: string;
};

function emptyForm(): FormState {
  return {
    complaint: "",
    diagnosis: "",
    prescription: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MedicalRecordsClient({
  patientId,
  initialRecords,
}: {
  patientId: string;
  initialRecords: MedicalRecord[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function startAdd() {
    setShowForm(true);
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  function startEdit(r: MedicalRecord) {
    setEditingId(r.id);
    setShowForm(false);
    setForm({
      complaint: r.complaint,
      diagnosis: r.diagnosis ?? "",
      prescription: r.prescription ?? "",
      notes: r.notes ?? "",
      date: r.date.slice(0, 10),
    });
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function saveNew() {
    if (!form.complaint.trim()) { setError("الشكوى الرئيسية مطلوبة"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/medical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, ...form }),
    });
    if (res.ok) {
      const created = await res.json();
      setRecords((prev) => [created, ...prev]);
      cancelForm();
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setLoading(false);
  }

  async function saveEdit(id: string) {
    if (!form.complaint.trim()) { setError("الشكوى الرئيسية مطلوبة"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/medical-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      cancelForm();
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setLoading(false);
  }

  async function deleteRecord(id: string) {
    setLoading(true);
    const res = await fetch(`/api/medical-records/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800">السجلات الطبية</h2>
        {!showForm && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            سجل جديد
          </button>
        )}
      </div>

      {showForm && (
        <RecordForm
          form={form}
          setForm={setForm}
          onSave={saveNew}
          onCancel={cancelForm}
          loading={loading}
          error={error}
          title="إضافة سجل طبي جديد"
        />
      )}

      {records.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          لا توجد سجلات طبية — اضغط &quot;سجل جديد&quot; لإضافة أول سجل
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const isEdit = editingId === r.id;
            const isExpanded = expandedId === r.id;
            const isDelete = deleteId === r.id;

            if (isEdit) {
              return (
                <div key={r.id} className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                  <RecordForm
                    form={form}
                    setForm={setForm}
                    onSave={() => saveEdit(r.id)}
                    onCancel={cancelForm}
                    loading={loading}
                    error={error}
                    title="تعديل السجل الطبي"
                  />
                </div>
              );
            }

            return (
              <div
                key={r.id}
                className={`border rounded-xl transition-all ${
                  isDelete
                    ? "border-red-200 bg-red-50/30"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                {!isDelete ? (
                  <>
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} className="w-4 h-4">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="1"/>
                            <line x1="9" y1="12" x2="15" y2="12"/>
                            <line x1="9" y1="16" x2="13" y2="16"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{r.complaint}</p>
                          <p className="text-xs text-gray-400">{formatDate(r.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mr-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(r); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          </svg>
                        </button>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                        {r.diagnosis && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">التشخيص</p>
                            <p className="text-sm text-gray-700">{r.diagnosis}</p>
                          </div>
                        )}
                        {r.prescription && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">الوصفة الطبية</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{r.prescription}</p>
                          </div>
                        )}
                        {r.notes && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">ملاحظات</p>
                            <p className="text-sm text-gray-700">{r.notes}</p>
                          </div>
                        )}
                        {!r.diagnosis && !r.prescription && !r.notes && (
                          <p className="text-xs text-gray-400">لا توجد تفاصيل إضافية</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4">
                    <p className="text-sm font-semibold text-red-700 mb-1">حذف هذا السجل؟</p>
                    <p className="text-xs text-gray-500 mb-3">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteRecord(r.id)}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {loading ? "جاري الحذف..." : "نعم، احذف"}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecordForm({
  form,
  setForm,
  onSave,
  onCancel,
  loading,
  error,
  title,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
  title: string;
}) {
  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-3 border border-blue-200 rounded-xl p-4 bg-blue-50/20 mb-4">
      <p className="text-sm font-bold text-blue-700">{title}</p>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            الشكوى الرئيسية <span className="text-red-500">*</span>
          </label>
          <input
            {...field("complaint")}
            placeholder="ما يشكو منه المريض"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">التشخيص</label>
          <input
            {...field("diagnosis")}
            placeholder="التشخيص الطبي"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">تاريخ الزيارة</label>
          <input
            type="date"
            {...field("date")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            dir="ltr"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">الوصفة الطبية</label>
          <textarea
            {...field("prescription")}
            placeholder="الأدوية والجرعات"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">ملاحظات إضافية</label>
          <textarea
            {...field("notes")}
            placeholder="أي ملاحظات أخرى"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "جاري الحفظ..." : "حفظ السجل"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/patients/[id]/MedicalRecordsClient.tsx
git commit -m "feat: add medical records client with add/edit/delete/expand"
```

---

## Task 5: Link Patient List to Profile

**Files:**
- Modify: `app/dashboard/patients/PatientSearchClient.tsx`

- [ ] **Step 1: Add Link import**

At the top of `app/dashboard/patients/PatientSearchClient.tsx`, after `"use client";`:

```typescript
import Link from "next/link";
```

- [ ] **Step 2: Add "الملف" button inside the normal row**

Find the `<div className="flex gap-2 shrink-0">` block inside the normal row (around line 139) and add this **before** the "تعديل" button:

```typescript
<Link
  href={`/dashboard/patients/${p.id}`}
  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
>
  الملف
</Link>
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/patients/PatientSearchClient.tsx
git commit -m "feat: link patient list rows to patient profile"
```

---

## Task 6: API — Support Health Check

**Files:**
- Create: `app/api/support/health/route.ts`

- [ ] **Step 1: Create `app/api/support/health/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const [subscription, todayAppts, stuckSessions, pendingOld] =
    await Promise.all([
      db.subscription.findUnique({ where: { clinicId } }),
      db.appointment.findMany({
        where: { clinicId, date: { gte: todayStart, lte: todayEnd } },
        select: { status: true, queueStatus: true },
      }),
      db.whatsappSession.count({
        where: {
          clinicId,
          updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.appointment.count({
        where: { clinicId, status: "pending", date: { lt: todayStart } },
      }),
    ]);

  const subDaysLeft = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.expiresAt).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return NextResponse.json({
    db: dbOk,
    subscription: {
      status: subscription?.status ?? "inactive",
      plan: subscription?.plan ?? "—",
      daysLeft: subDaysLeft,
    },
    queue: {
      total: todayAppts.length,
      waiting: todayAppts.filter((a) => a.queueStatus === "waiting").length,
      current: todayAppts.filter((a) => a.queueStatus === "current").length,
      done: todayAppts.filter((a) => a.queueStatus === "done").length,
    },
    issues: {
      stuckSessions,
      pendingOldAppointments: pendingOld,
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/support/health/
git commit -m "feat: add support health check API"
```

---

## Task 7: API — Support Quick-Fix Actions

**Files:**
- Create: `app/api/support/fix/route.ts`

- [ ] **Step 1: Create `app/api/support/fix/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const { action } = await req.json();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  switch (action) {
    case "clear-sessions": {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = await db.whatsappSession.deleteMany({
        where: { clinicId, updatedAt: { lt: cutoff } },
      });
      return NextResponse.json({
        success: true,
        message: `تم مسح ${result.count} محادثة معلقة`,
      });
    }

    case "fix-pending": {
      const result = await db.appointment.updateMany({
        where: { clinicId, status: "pending", date: { lt: todayStart } },
        data: { status: "completed", queueStatus: "done" },
      });
      return NextResponse.json({
        success: true,
        message: `تم إكمال ${result.count} موعد معلق من أيام سابقة`,
      });
    }

    case "reset-queue": {
      await db.appointment.updateMany({
        where: { clinicId, queueStatus: "current" },
        data: { queueStatus: "waiting" },
      });
      return NextResponse.json({
        success: true,
        message: "تم إعادة تعيين الطابور — المريض الحالي عاد إلى الانتظار",
      });
    }

    default:
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/support/fix/
git commit -m "feat: add support quick-fix API"
```

---

## Task 8: Support Page UI

**Files:**
- Create: `app/dashboard/support/page.tsx`
- Create: `app/dashboard/support/SupportClient.tsx`

- [ ] **Step 1: Create `app/dashboard/support/page.tsx`**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الدعم والصيانة</h1>
        <p className="text-sm text-gray-500 mt-1">
          فحص حالة النظام وإصلاح المشاكل الشائعة بضغطة واحدة
        </p>
      </div>
      <SupportClient />
    </div>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/support/SupportClient.tsx`**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";

type HealthData = {
  db: boolean;
  subscription: { status: string; plan: string; daysLeft: number };
  queue: { total: number; waiting: number; current: number; done: number };
  issues: { stuckSessions: number; pendingOldAppointments: number };
};

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبي",
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
};
const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  trial: "تجريبي",
  inactive: "منتهي",
};

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
        ok ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}

export default function SupportClient() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/support/health");
    if (res.ok) setHealth(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  async function runFix(action: string) {
    setFixing(action);
    const res = await fetch("/api/support/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setToast({ msg: data.message ?? data.error ?? "تم", ok: res.ok });
    setFixing(null);
    fetchHealth();
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-2xl border border-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-12 text-gray-400">
        تعذر تحميل حالة النظام
        <br />
        <button
          onClick={fetchHealth}
          className="mt-3 text-blue-600 text-sm underline"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const subOk = ["active", "trial"].includes(health.subscription.status);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">حالة النظام</h2>
          <button
            onClick={fetchHealth}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            تحديث
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">قاعدة البيانات</span>
            <div className="flex items-center gap-2">
              <StatusDot ok={health.db} />
              <span
                className={`text-xs font-semibold ${
                  health.db ? "text-green-600" : "text-red-600"
                }`}
              >
                {health.db ? "تعمل بشكل طبيعي" : "خطأ في الاتصال"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">الاشتراك</span>
            <div className="flex items-center gap-2">
              <StatusDot ok={subOk} />
              <span
                className={`text-xs font-semibold ${
                  subOk ? "text-green-600" : "text-red-600"
                }`}
              >
                {STATUS_LABELS[health.subscription.status] ??
                  health.subscription.status}{" "}
                · {PLAN_LABELS[health.subscription.plan] ?? health.subscription.plan}
                {subOk && ` · ${health.subscription.daysLeft} يوم متبقي`}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-600">طابور اليوم</span>
            <span className="text-xs font-semibold text-gray-700">
              {health.queue.total} موعد ·{" "}
              <span className="text-orange-500">
                {health.queue.waiting} انتظار
              </span>{" "}
              ·{" "}
              <span className="text-green-600">{health.queue.done} منتهي</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Fixes */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">إصلاح سريع</h2>
        <div className="space-y-3">
          <FixCard
            title="مسح محادثات الواتساب المعلقة"
            description={
              health.issues.stuckSessions > 0
                ? `يوجد ${health.issues.stuckSessions} محادثة معلقة منذ أكثر من 24 ساعة — قد تمنع بعض المرضى من الحجز`
                : "لا توجد محادثات معلقة — كل شيء يعمل"
            }
            hasIssue={health.issues.stuckSessions > 0}
            action="clear-sessions"
            actionLabel="مسح المحادثات"
            fixing={fixing}
            onFix={runFix}
          />
          <FixCard
            title="إكمال المواعيد القديمة المعلقة"
            description={
              health.issues.pendingOldAppointments > 0
                ? `يوجد ${health.issues.pendingOldAppointments} موعد قديم لم يُغلق — قد يؤثر على الإحصاءات`
                : "جميع المواعيد القديمة مغلقة بشكل صحيح"
            }
            hasIssue={health.issues.pendingOldAppointments > 0}
            action="fix-pending"
            actionLabel="إكمال المواعيد"
            fixing={fixing}
            onFix={runFix}
          />
          <FixCard
            title="إعادة تعيين الطابور الحالي"
            description="إذا علق النظام ولم يتحرك الطابور، اضغط هنا لإعادة تعيينه"
            hasIssue={false}
            isWarning
            action="reset-queue"
            actionLabel="إعادة تعيين"
            fixing={fixing}
            onFix={runFix}
          />
        </div>
      </div>

      {/* Help note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>ملاحظة:</strong> إذا استمرت المشكلة بعد الإصلاح، تواصل مع
          الدعم وأخبرهم بالمشكلة تحديداً — لا حاجة لإعادة تشغيل أي شيء.
        </p>
      </div>
    </div>
  );
}

function FixCard({
  title,
  description,
  hasIssue,
  isWarning,
  action,
  actionLabel,
  fixing,
  onFix,
}: {
  title: string;
  description: string;
  hasIssue: boolean;
  isWarning?: boolean;
  action: string;
  actionLabel: string;
  fixing: string | null;
  onFix: (action: string) => void;
}) {
  const containerCls = hasIssue
    ? "border-orange-200 bg-orange-50/40"
    : isWarning
    ? "border-gray-200 bg-gray-50"
    : "border-green-100 bg-green-50/30";

  const dotCls = hasIssue
    ? "bg-orange-400"
    : isWarning
    ? "bg-gray-400"
    : "bg-green-500";

  const btnCls = hasIssue
    ? "bg-orange-500 hover:bg-orange-600"
    : "bg-gray-600 hover:bg-gray-700";

  return (
    <div className={`border rounded-xl p-4 ${containerCls}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
        {(hasIssue || isWarning) && (
          <button
            onClick={() => onFix(action)}
            disabled={fixing === action}
            className={`shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${btnCls}`}
          >
            {fixing === action ? "جاري..." : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/support/
git commit -m "feat: add support page with health status and quick-fix panel"
```

---

## Task 9: Add Support Nav Item to Sidebar

**Files:**
- Modify: `app/dashboard/layout.tsx`

- [ ] **Step 1: Append support item to NAV array**

In `app/dashboard/layout.tsx`, find the closing `];` of the `NAV` array (after the `الاشتراك` entry) and add this item before it:

```typescript
{
  href: "/dashboard/support",
  label: "الدعم",
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
},
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: add support nav item to sidebar"
```

---

## Task 10: Push & Deploy

- [ ] **Step 1: Push all commits to trigger Vercel deploy**

```bash
git push
```

Expected: Vercel auto-deploy triggered. Check dashboard at vercel.com for build status.
