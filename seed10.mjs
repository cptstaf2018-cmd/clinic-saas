import { PrismaClient } from './app/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: "postgresql://postgres.huhxtphajlafmsqtygtf:Saad.20261981@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
const db = new PrismaClient({ adapter });

const CLINICS = [
  { name: 'عيادة د. محمد الكرباسي - باطنية', whatsapp: '07701001001', email: 'karbasi@clinic.iq', plan: 'premium', status: 'active' },
  { name: 'عيادة د. زينب العبيدي - أطفال', whatsapp: '07701002002', email: 'ubaidi@clinic.iq', plan: 'standard', status: 'active' },
  { name: 'عيادة د. حسن الجابري - عيون', whatsapp: '07701003003', email: 'jabri@clinic.iq', plan: 'basic', status: 'active' },
  { name: 'عيادة د. نور الهاشمي - نساء وولادة', whatsapp: '07701004004', email: 'hashimi@clinic.iq', plan: 'premium', status: 'active' },
  { name: 'عيادة د. علي الشمري - عظام', whatsapp: '07701005005', email: 'shamri@clinic.iq', plan: 'standard', status: 'active' },
  { name: 'عيادة د. سلمى التكريتي - جلدية', whatsapp: '07701006006', email: 'takriti@clinic.iq', plan: 'basic', status: 'active' },
  { name: 'عيادة د. كريم الدليمي - أسنان', whatsapp: '07701007007', email: 'dulimi@clinic.iq', plan: 'standard', status: 'active' },
  { name: 'عيادة د. رنا الراوي - أنف وأذن', whatsapp: '07701008008', email: 'rawi@clinic.iq', plan: 'premium', status: 'active' },
  { name: 'عيادة د. عمر الجميلي - قلب', whatsapp: '07701009009', email: 'jumaily@clinic.iq', plan: 'basic', status: 'inactive' },
  { name: 'عيادة د. فاطمة السامرائي - مسالك', whatsapp: '07701010010', email: 'samarrai@clinic.iq', plan: 'trial', status: 'trial' },
];

const PATIENT_NAMES = [
  'أحمد محمد علي','فاطمة حسن جاسم','علي كريم سلمان','زينب عبدالله محمد',
  'حسين عمر خالد','نور الهدى جاسم','سعد الرضا إبراهيم','ليلى حمدان عيسى',
  'محمود طارق يوسف','رنا سامي مصطفى','كريم باسم رشيد','هدى نجاح حميد',
];

const STATUSES = ['confirmed','confirmed','confirmed','pending','completed','cancelled'];

async function main() {
  console.log('🚀 Creating 10 clinics...\n');
  
  const hash = await bcrypt.hash('Clinic@2026', 10);
  const today = new Date();

  for (const c of CLINICS) {
    const existing = await db.clinic.findFirst({ where: { whatsappNumber: c.whatsapp } });
    if (existing) { console.log(`⏭  Skip: ${c.name}`); continue; }

    const expiresAt = new Date();
    if (c.status === 'active') expiresAt.setDate(expiresAt.getDate() + 30);
    else if (c.status === 'trial') expiresAt.setDate(expiresAt.getDate() + 3);
    else expiresAt.setDate(expiresAt.getDate() - 1);

    const clinic = await db.clinic.create({
      data: {
        name: c.name,
        whatsappNumber: c.whatsapp,
        users: { create: { email: c.email, passwordHash: hash, role: 'doctor' } },
        subscription: { create: { plan: c.plan, status: c.status, expiresAt } },
        workingHours: {
          create: [0,1,2,3,4,6].map(d => ({
            dayOfWeek: d, startTime: '09:00',
            endTime: d === 6 ? '13:00' : '17:00', isOpen: true
          }))
        }
      }
    });

    // Add 8-12 patients per clinic
    const patientCount = 8 + Math.floor(Math.random() * 5);
    const patients = [];
    for (let i = 0; i < patientCount; i++) {
      const name = PATIENT_NAMES[i % PATIENT_NAMES.length];
      const phone = `0771${c.whatsapp.slice(-4)}${String(i).padStart(3,'0')}`;
      try {
        const p = await db.patient.create({
          data: { clinicId: clinic.id, name, whatsappPhone: phone }
        });
        patients.push(p);
      } catch {}
    }

    // Add today's appointments
    for (let i = 0; i < Math.min(patients.length, 6); i++) {
      const date = new Date(today);
      date.setHours(9 + i, 0, 0, 0);
      const status = STATUSES[i % STATUSES.length];
      const queueStatus = i === 0 ? 'done' : i === 1 ? 'current' : 'waiting';
      await db.appointment.create({
        data: {
          clinicId: clinic.id,
          patientId: patients[i].id,
          date, status, queueNumber: i + 1,
          queueStatus: status === 'cancelled' ? 'waiting' : queueStatus,
        }
      });
    }

    // Add pending payment for active clinics
    if (c.status === 'active' || c.status === 'trial') {
      await db.payment.create({
        data: {
          clinicId: clinic.id,
          amount: c.plan === 'premium' ? 55000 : c.plan === 'standard' ? 45000 : 35000,
          method: 'superkey',
          status: Math.random() > 0.5 ? 'approved' : 'pending',
          reference: `TXN-2026-${Math.floor(Math.random()*99999)}`,
        }
      });
    }

    console.log(`✅ ${c.name} — ${patients.length} مريض`);
  }

  const total = await db.clinic.count();
  const totalPatients = await db.patient.count();
  const totalAppts = await db.appointment.count();
  
  console.log(`\n📊 الإجماليات:`);
  console.log(`   عيادات: ${total}`);
  console.log(`   مرضى:   ${totalPatients}`);
  console.log(`   مواعيد: ${totalAppts}`);
  console.log(`\n🔑 كلمة المرور لجميع العيادات الجديدة: Clinic@2026`);
  
  await db.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
