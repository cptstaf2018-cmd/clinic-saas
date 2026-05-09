import { PrismaClient } from "../app/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

async function main() {
  // Find the clinic
  const clinic = await db.clinic.findFirst({
    where: { name: { contains: "خالد التميمي" } },
  });

  if (!clinic) {
    console.log("❌ لم يتم العثور على العيادة");
    process.exit(1);
  }

  console.log(`✅ العيادة: ${clinic.name} — ID: ${clinic.id}`);

  // Delete old test patients for this clinic (cleanup)
  await db.appointment.deleteMany({ where: { clinicId: clinic.id } });
  await db.patient.deleteMany({ where: { clinicId: clinic.id } });

  // Create 5 patients
  const names = ["أحمد محمد", "فاطمة علي", "حسن عبدالله", "زينب كريم", "عمر سالم"];
  const phones = ["07701111001", "07701111002", "07701111003", "07701111004", "07701111005"];

  const patients = [];
  for (let i = 0; i < names.length; i++) {
    const p = await db.patient.create({
      data: {
        clinicId: clinic.id,
        name: names[i],
        whatsappPhone: phones[i],
      },
    });
    patients.push(p);
    console.log(`👤 مريض: ${p.name}`);
  }

  // Create today's appointments
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  for (let i = 0; i < patients.length; i++) {
    const apptTime = new Date(today);
    apptTime.setMinutes(i * 30);

    const queueStatus = i === 0 ? "current" : "waiting";
    const status = i === 0 ? "confirmed" : "pending";

    await db.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[i].id,
        date: apptTime,
        status,
        queueNumber: i + 1,
        queueStatus,
      },
    });
    console.log(`📅 موعد: ${patients[i].name} — رقم ${i + 1} — ${queueStatus}`);
  }

  console.log("\n✅ تم إضافة 5 مرضى و5 مواعيد اليوم");
  console.log(`🔗 رابط الشاشة: https://clinicplt.vercel.app/display/${clinic.id}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
