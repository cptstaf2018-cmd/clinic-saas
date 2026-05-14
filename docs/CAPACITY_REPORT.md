# تقرير الطاقة الاستيعابية — Capacity Report
**تاريخ التقرير:** 2026-05-15  
**المنصة:** Hostinger VPS + PostgreSQL + Next.js 16  
**URL:** https://ayadti.duckdns.org

---

## 1. ملخص تنفيذي

| المؤشر | القيمة الحالية | بعد التحسينات |
|--------|---------------|--------------|
| الحد الأقصى الآمن للعيادات | **200–500** | **5,000+** |
| أقصى مرضى قابل للتحمل | ~500,000 | ~50,000,000 |
| أقصى مواعيد/يوم | ~10,000 | ~500,000 |
| أقصى رسائل WhatsApp/ثانية | ~2–5 | ~50–200 |

---

## 2. تحليل قاعدة البيانات

### الفهارس الموجودة ✅

```sql
-- Patient
@@index([clinicId])
@@unique([clinicId, whatsappPhone])

-- Appointment
@@index([clinicId])
@@index([clinicId, date])
@@index([clinicId, status])

-- IncomingMessage
@@index([clinicId])
@@index([clinicId, read])
@@index([clinicId, phone])
@@index([clinicId, direction])

-- Payment
@@index([clinicId])
@@index([status])

-- SystemEvent
@@index([clinicId])
@@index([severity])
@@index([source])
@@index([resolved])
@@index([createdAt])
```

**الحكم:** الفهارس الأساسية موجودة وجيدة لأي query مفلتر بـ clinicId.

### فهارس مفقودة ⚠️

```sql
-- Appointment: الكرون يبحث بـ reminder24hSent + date
CREATE INDEX ON "Appointment" (reminder24hSent, date)
  WHERE reminder24hSent = false AND status IN ('pending','confirmed');

-- Appointment: reminder1hSent
CREATE INDEX ON "Appointment" (reminder1hSent, date)
  WHERE reminder1hSent = false AND status IN ('pending','confirmed');

-- Subscription: الكرون اليومي
CREATE INDEX ON "Subscription" (status, "expiresAt");

-- Patient: بحث بالهاتف عند رسائل WhatsApp
CREATE INDEX ON "Patient" ("whatsappPhone");

-- IncomingMessage: تنظيف الرسائل القديمة
CREATE INDEX ON "IncomingMessage" ("createdAt");
```

### استعلامات N+1 المحتملة

| المكان | المشكلة | الحل |
|--------|---------|------|
| `/api/admin/clinics` | يجلب كل العيادات ثم subscription لكل واحدة | `include: { subscription: true }` موجود — لكن بدون pagination |
| `/api/appointments` (clinic) | لا pagination — يجلب كل المواعيد | أضف `take` + `skip` |
| `/api/patients` | لا pagination | أضف `take` + `skip` |

---

## 3. نقاط الاختناق (Bottlenecks)

### 3.1 الأعلى خطورة 🔴

#### `/api/admin/clinics` — بدون Pagination

```typescript
// الكود الحالي — يجلب كل العيادات دفعة واحدة
const clinics = await db.clinic.findMany({
  include: { subscription: true },
  orderBy: { createdAt: "desc" },
});
```

**التأثير:**
- عند 100 عيادة: ~50ms
- عند 1,000 عيادة: ~500ms  
- عند 10,000 عيادة: ~5,000ms+ (timeout محتمل)

**الحل:** أضف `take: 50, skip: page * 50`

---

#### اتصالات قاعدة البيانات (Connection Pool)

```typescript
// الكود الحالي — Prisma بدون PgBouncer
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
```

PostgreSQL يحتمل افتراضياً **100 اتصال متزامن**.  
مع Next.js serverless أو PM2 clusters، كل عملية تفتح pool منفصل.

**التأثير عند التوسع:**
- 1 process × 10 connections = مقبول
- 4 processes × 10 connections = 40 اتصال — بخير
- 8 processes + spikes = نفاد الـ connections

**الحل:** PgBouncer في وضع Transaction Pooling

---

### 3.2 متوسط الخطورة 🟠

#### Cron التذكيرات — `maxDuration = 60s`

```typescript
export const maxDuration = 60; // ثانية واحدة
const BATCH_SIZE = 50;
```

**الحسابات:**
- كل رسالة WhatsApp تأخذ ~200–500ms (طلب HTTP للـ Meta API)
- في دقيقة واحدة: 60,000ms ÷ 350ms = ~170 رسالة كحد أقصى
- مع BATCH_SIZE=50: ~3 batches = 150 رسالة/تشغيل

**التأثير:**
- عند 200 عيادة بـ 50 موعد/يوم تحتاج تذكير: 10,000 رسالة
- الكرون يحتاج: 10,000 ÷ 150 = **67 تشغيل** — مستحيل في تشغيل واحد

**الحل:** Queue (BullMQ) أو زيادة `maxDuration` على VPS

---

#### WhatsApp Throughput

```typescript
// الكود الحالي — يرسل رسائل بشكل متوازٍ داخل كل batch
const results = await Promise.allSettled(
  appointments.map(async (appt) => { ... sendWhatsApp(...) })
);
```

**القيود:**
- Meta WhatsApp API: يسمح بـ 80 رسالة/ثانية لكل رقم هاتف
- كل عيادة لها رقم مختلف → لا تعارض بين العيادات
- الخطر: إرسال 50 رسالة في نفس الوقت من عيادة واحدة قد يُعطي rate limit

---

### 3.3 منخفض الخطورة 🟡

#### تنظيف البيانات (Cron اليومي)

```typescript
// يحذف رسائل أقدم من 90 يوم
const messagesCleaned = await db.incomingMessage.deleteMany({
  where: { createdAt: { lt: ninetyDaysAgo } },
});
```

**التأثير عند الحجم الكبير:**
- 1,000 عيادة × 500 رسالة × 90 يوم = 45,000,000 سجل في `IncomingMessage`
- DELETE بدون index على `createdAt` = **Full Table Scan** 🚨

---

## 4. تحليل السعة بالأرقام

### سيناريو: Hostinger VPS (2 CPU, 4GB RAM)

| عدد العيادات | مرضى إجمالي | مواعيد إجمالي | حجم DB تقريبي | أداء Admin | أداء Cron |
|-------------|------------|--------------|--------------|-----------|---------|
| 100 | 100,000 | 200,000 | ~2 GB | ✅ سريع | ✅ كافٍ |
| 500 | 500,000 | 1,000,000 | ~10 GB | 🟡 مقبول | 🟡 يبطئ |
| 1,000 | 1,000,000 | 2,000,000 | ~20 GB | 🔴 بطيء | 🔴 قد يفوت |
| 5,000 | 5,000,000 | 10,000,000 | ~100 GB | 💀 timeout | 💀 مستحيل |

### سيناريو: بعد Pagination + Index + PgBouncer

| عدد العيادات | أداء Admin | أداء Cron | ملاحظة |
|-------------|-----------|---------|-------|
| 500 | ✅ سريع | ✅ كافٍ | الحالة المستهدفة قريباً |
| 2,000 | ✅ مقبول | 🟡 يحتاج Queue | مرحلة النضج |
| 10,000 | 🟡 مقبول | 🔴 Queue ضروري | يحتاج VPS أكبر |

---

## 5. اختبار الـ Cron — تحليل الأوقات

### cron/reminders

```
افتراضات:
- كل عيادة لها 10 مواعيد تحتاج تذكير 24h
- 1000 عيادة = 10,000 رسالة
- كل رسالة = 300ms (WhatsApp API)
- BATCH_SIZE = 50 (متوازٍ)

الوقت المتوقع لـ batch واحد:
  50 رسائل × 300ms ÷ 50 (تزامن) = 300ms

الوقت الكلي لـ 10,000 رسالة:
  10,000 ÷ 50 = 200 batch
  200 × 300ms = 60,000ms = 60 ثانية ← يتجاوز maxDuration!
```

**الحد الآمن الحالي:** ~150 رسالة/تشغيل = **30 عيادة** بمعدل 5 مواعيد/يوم

### cron/expire-subscriptions

```
updateMany على Subscription — استعلام واحد بغض النظر عن العدد:
  WHERE expiresAt < now AND status != 'inactive'

عند 10,000 عيادة:
  - بدون index: ~500ms (Full Scan)
  - مع index على (status, expiresAt): ~10ms ✅
```

---

## 6. اختبار WhatsApp Throughput

### إرسال 100,000 رسالة

```
الاستراتيجية الحالية (Sequential batches):
  100,000 ÷ 50 (batch) = 2,000 batch
  2,000 × 300ms = 600,000ms = 10 دقائق

الاستراتيجية المقترحة (Queue + Workers):
  10 workers × 50 رسالة = 500 رسالة/ثانية
  100,000 ÷ 500 = 200 ثانية = ~3.5 دقيقة
```

### إرسال 1,000,000 رسالة

```
بدون Queue: 100 دقيقة — مستحيل عملياً
مع Queue + 20 Worker: ~33 دقيقة
مع Queue + Redis + Rate Limiting per clinic: ✅ قابل للتنفيذ
```

---

## 7. الحد الأقصى الآمن — الخلاصة

### حالياً (بدون تعديلات)
> **200–300 عيادة** نشطة مع أداء مقبول

### بعد الأولوية 1 (Pagination + Indexes)
> **500–1,000 عيادة**

### بعد الأولوية 2 (PgBouncer + Queue)
> **2,000–5,000 عيادة**

### بعد الأولوية 3 (VPS أكبر + Redis)
> **10,000+ عيادة**

---

## 8. أهم 10 تحسينات مرتبة بالأولوية

| # | التحسين | الأثر | الجهد | الأولوية |
|---|---------|-------|-------|---------|
| 1 | إضافة Pagination لـ `/api/admin/clinics` | 🔴 عالي جداً | ⬜ ساعتان | **فوري** |
| 2 | فهرس على `(reminder24hSent, date)` في Appointment | 🔴 عالي | ⬜ 30 دقيقة | **فوري** |
| 3 | فهرس على `(status, expiresAt)` في Subscription | 🟠 متوسط | ⬜ 15 دقيقة | **هذا الأسبوع** |
| 4 | فهرس على `createdAt` في IncomingMessage | 🟠 متوسط | ⬜ 15 دقيقة | **هذا الأسبوع** |
| 5 | إضافة Pagination لـ `/api/patients` و `/api/appointments` | 🟠 متوسط | ⬜ 4 ساعات | **هذا الأسبوع** |
| 6 | PgBouncer للـ Connection Pooling | 🟠 متوسط | 🟨 يوم | **الشهر القادم** |
| 7 | زيادة `maxDuration` للـ Cron (VPS لا يقيّد) | 🟠 متوسط | ⬜ 5 دقائق | **فوري** |
| 8 | Queue (BullMQ + Redis) لرسائل WhatsApp | 🟡 بعيد المدى | 🟥 أسبوع | **عند 500+ عيادة** |
| 9 | Read Replica لـ PostgreSQL | 🟡 بعيد المدى | 🟥 يومان | **عند 2000+ عيادة** |
| 10 | Horizontal Scaling (PM2 Cluster) | 🟡 بعيد المدى | 🟨 يوم | **عند 1000+ عيادة** |

---

## 9. أوامر تشغيل الاختبارات

```bash
# إدخال 100 عيادة (الإعداد الافتراضي)
node scripts/seed-large.mjs

# إدخال 500 عيادة بمرضى أقل (أسرع)
CLINICS=500 PATIENTS_PER_CLINIC=1000 node scripts/seed-large.mjs

# معاينة الأرقام بدون إدخال
CLINICS=1000 DRY_RUN=true node scripts/seed-large.mjs

# اختبار الأداء
BASE_URL=https://ayadti.duckdns.org node scripts/load-test.mjs

# اختبار endpoint واحد فقط
BASE_URL=https://ayadti.duckdns.org ENDPOINT=clinics REQUESTS=50 node scripts/load-test.mjs

# تنظيف بيانات الاختبار
CLEANUP=true node scripts/seed-large.mjs
```
