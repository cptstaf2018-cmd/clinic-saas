# خارطة التوسع — Scaling Roadmap
**من 100 إلى 10,000 عيادة**

---

## المراحل

```
100 عيادة ──► 500 ──► 1,000 ──► 5,000 ──► 10,000+
   الآن       M1      M2        M3         M4
```

---

## المرحلة الحالية — 100 عيادة ✅

**البنية الحالية تكفي تماماً.**

| المكوّن | الحالة |
|---------|--------|
| PostgreSQL واحدة | ✅ كافٍ |
| Next.js + PM2 | ✅ كافٍ |
| Cron مباشر | ✅ كافٍ |
| WhatsApp API مباشر | ✅ كافٍ |

**لا يحتاج أي تغيير الآن.**

---

## M1 — 500 عيادة (قريباً)

**المشكلة:** `/api/admin/clinics` يبطئ، cron يبدأ بالضغط.

### التغييرات المطلوبة

#### 1. Pagination للـ Admin API (أولوية قصوى)

```typescript
// في app/api/admin/clinics/route.ts
export async function GET(req: NextRequest) {
  const page  = parseInt(req.nextUrl.searchParams.get("page") ?? "0");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

  const [clinics, total] = await Promise.all([
    db.clinic.findMany({
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: page * limit,
    }),
    db.clinic.count(),
  ]);

  return NextResponse.json({ clinics, total, page, limit });
}
```

#### 2. فهارس PostgreSQL مفقودة

```sql
-- أضف هذه الفهارس مباشرة في قاعدة البيانات:

CREATE INDEX CONCURRENTLY idx_appointment_reminder24h
  ON "Appointment" ("clinicId", date)
  WHERE reminder24hSent = false AND status IN ('pending','confirmed');

CREATE INDEX CONCURRENTLY idx_appointment_reminder1h
  ON "Appointment" ("clinicId", date)
  WHERE reminder1hSent = false AND status IN ('pending','confirmed');

CREATE INDEX CONCURRENTLY idx_subscription_expiry
  ON "Subscription" (status, "expiresAt");

CREATE INDEX CONCURRENTLY idx_incoming_message_created
  ON "IncomingMessage" ("createdAt");

CREATE INDEX CONCURRENTLY idx_patient_phone
  ON "Patient" ("whatsappPhone");
```

**أو عبر Prisma Migration:**

```bash
npx prisma migrate dev --name add_capacity_indexes
```

#### 3. Pagination للـ Patients و Appointments

```typescript
// نمط موحد لكل القوائم
const page  = parseInt(req.nextUrl.searchParams.get("page") ?? "0");
const limit = 50;
const data  = await db.patient.findMany({
  where: { clinicId },
  take: limit,
  skip: page * limit,
  orderBy: { createdAt: "desc" },
});
```

**المتوقع بعد M1:** يتحمل 500 عيادة بسهولة.

---

## M2 — 1,000 عيادة

**المشكلة:** Connection Pool قد ينضب، Cron يحتاج أكثر من 60 ثانية.

### التغييرات المطلوبة

#### 1. رفع حد Cron Duration (VPS لا يقيّد)

```typescript
// في app/api/cron/reminders/route.ts
// احذف أو رفع الحد — VPS لا يُطبق Vercel limits
export const maxDuration = 300; // 5 دقائق
```

#### 2. PgBouncer — Connection Pooling

```bash
# تثبيت PgBouncer على الـ VPS
apt install pgbouncer

# /etc/pgbouncer/pgbouncer.ini
[databases]
clinic_db = host=127.0.0.1 port=5432 dbname=clinic_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

```env
# .env — وجّه التطبيق للـ PgBouncer
DATABASE_URL=postgresql://user:pass@localhost:6432/clinic_db
```

#### 3. PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "clinic-saas",
    script: "node_modules/.bin/next",
    args: "start",
    instances: "max",     // بعدد الـ CPU cores
    exec_mode: "cluster",
    max_memory_restart: "1G",
  }]
};
```

**المتوقع بعد M2:** يتحمل 1,000–2,000 عيادة.

---

## M3 — 5,000 عيادة

**المشكلة:** WhatsApp reminders لا يمكن إرسالها في تشغيل cron واحد.

### التغييرات المطلوبة

#### 1. BullMQ + Redis Queue للتذكيرات

```bash
# تثبيت Redis
apt install redis-server

# تثبيت BullMQ
npm install bullmq ioredis
```

```typescript
// lib/reminder-queue.ts
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL);
export const reminderQueue = new Queue("reminders", { connection });

// Worker يعمل في الخلفية
new Worker("reminders", async (job) => {
  const { phone, message, clinicId, appointmentId, token } = job.data;
  await sendWhatsApp(phone, message, token, { clinicId, appointmentId });
}, { connection, concurrency: 20 });
```

```typescript
// في cron/reminders — بدل الإرسال المباشر
await reminderQueue.addBulk(
  appointments.map(appt => ({
    name: "send-reminder",
    data: { phone: appt.patient.whatsappPhone, message, clinicId: appt.clinicId, ... },
    opts: { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  }))
);
```

#### 2. Read Replica لـ PostgreSQL

```typescript
// lib/db.ts — قراءة من Replica، كتابة على Primary
const readDb  = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL_REPLICA });
const writeDb = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// استخدام readDb في GET routes
// استخدام writeDb في POST/PATCH/DELETE
```

**المتوقع بعد M3:** يتحمل 5,000 عيادة.

---

## M4 — 10,000+ عيادة

**المشكلة:** قاعدة بيانات واحدة تصبح عنق الزجاجة، حتى مع Read Replica.

### التغييرات المطلوبة

#### 1. Database Partitioning

```sql
-- تقسيم جدول Appointment بالتاريخ
CREATE TABLE "Appointment" PARTITION BY RANGE (date);
CREATE TABLE "Appointment_2025" PARTITION OF "Appointment"
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE "Appointment_2026" PARTITION OF "Appointment"
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

#### 2. Managed Database (ترقية من VPS)

| الخيار | السعر/شهر | ما يوفر |
|--------|---------|---------|
| Supabase Pro | $25 | Connection pooling + Backups + Dashboard |
| Neon | $19 | Serverless PostgreSQL + Auto-scaling |
| AWS RDS | $50+ | Enterprise-grade + Read Replicas |

#### 3. CDN + Edge Caching

```typescript
// next.config.ts — cache الـ display page
export async function headers() {
  return [{
    source: "/api/display/:clinicId",
    headers: [{ key: "Cache-Control", value: "s-maxage=5, stale-while-revalidate=10" }],
  }];
}
```

**المتوقع بعد M4:** 10,000+ عيادة — احتياجات Enterprise.

---

## جدول زمني مقترح

| المرحلة | متى | ما الذي يُنجز |
|---------|-----|---------------|
| **الآن** | الأسبوع القادم | Pagination + Indexes → يتحمل 500 عيادة |
| **M2** | بعد 3 أشهر | PgBouncer + PM2 Cluster → 1,000 عيادة |
| **M3** | بعد 6 أشهر | BullMQ + Redis + Replica → 5,000 عيادة |
| **M4** | بعد سنة | Partitioning + Managed DB → 10,000+ عيادة |

---

## تكاليف التوسع المقدرة

| عدد العيادات | إيراد شهري (متوسط 40K/عيادة) | تكلفة البنية التحتية |
|-------------|------------------------------|---------------------|
| 100 | 4,000,000 IQD | الـ VPS الحالي |
| 500 | 20,000,000 IQD | VPS أكبر + Redis ~$30/شهر |
| 1,000 | 40,000,000 IQD | VPS كبير + PgBouncer ~$60/شهر |
| 5,000 | 200,000,000 IQD | Managed DB + Redis Cluster ~$200/شهر |
| 10,000 | 400,000,000 IQD | AWS/GCP Enterprise ~$1000/شهر |

---

## أوامر تشغيل الاختبارات

```bash
# اختبار 100 عيادة (الإعداد الافتراضي)
node scripts/seed-large.mjs

# اختبار 500 عيادة (أسرع — مرضى أقل)
CLINICS=500 PATIENTS_PER_CLINIC=500 APPOINTMENTS_PER_CLINIC=500 node scripts/seed-large.mjs

# اختبار 1000 عيادة
CLINICS=1000 PATIENTS_PER_CLINIC=200 APPOINTMENTS_PER_CLINIC=200 node scripts/seed-large.mjs

# معاينة الأرقام بدون إدخال
CLINICS=5000 DRY_RUN=true node scripts/seed-large.mjs

# اختبار الأداء بعد الإدخال
BASE_URL=https://ayadti.duckdns.org node scripts/load-test.mjs

# تنظيف كل بيانات الاختبار
CLEANUP=true node scripts/seed-large.mjs
```
