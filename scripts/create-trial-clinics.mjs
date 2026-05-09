import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

const PASSWORD = "Demo@2026";

const clinics = [
  {
    name: "عيادة تجريبية - د. أحمد",
    phone: "07708881001",
    plan: "trial",
    status: "trial",
    days: 14,
  },
  {
    name: "عيادة تجريبية - د. زينب",
    phone: "07708881002",
    plan: "basic",
    status: "active",
    days: 30,
  },
  {
    name: "عيادة تجريبية - د. عمر",
    phone: "07708881003",
    plan: "standard",
    status: "active",
    days: 7,
  },
  {
    name: "عيادة تجريبية - د. سارة",
    phone: "07708881004",
    plan: "premium",
    status: "inactive",
    days: -2,
  },
];

function expiry(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const item of clinics) {
    const clinic = await db.clinic.upsert({
      where: { whatsappNumber: item.phone },
      update: {
        name: item.name,
        botEnabled: true,
      },
      create: {
        name: item.name,
        whatsappNumber: item.phone,
        botEnabled: true,
        users: {
          create: {
            role: "doctor",
            passwordHash,
          },
        },
      },
    });

    await db.user.upsert({
      where: { email: `trial-${item.phone}@clinic.local` },
      update: {
        clinicId: clinic.id,
        role: "doctor",
        passwordHash,
      },
      create: {
        clinicId: clinic.id,
        email: `trial-${item.phone}@clinic.local`,
        role: "doctor",
        passwordHash,
      },
    });

    await db.subscription.upsert({
      where: { clinicId: clinic.id },
      update: {
        plan: item.plan,
        status: item.status,
        expiresAt: expiry(item.days),
      },
      create: {
        clinicId: clinic.id,
        plan: item.plan,
        status: item.status,
        expiresAt: expiry(item.days),
      },
    });

    console.log(`${item.name} | ${item.phone} | ${item.status}/${item.plan}`);
  }

  const firstClinic = await db.clinic.findUnique({ where: { whatsappNumber: clinics[0].phone } });
  if (firstClinic) {
    const reference = "[plan:standard] TEST-TRIAL-001";
    const existing = await db.payment.findFirst({
      where: { clinicId: firstClinic.id, reference },
    });

    if (!existing) {
      await db.payment.create({
        data: {
          clinicId: firstClinic.id,
          amount: 45000,
          method: "superkey",
          status: "pending",
          reference,
        },
      });
      console.log("created pending payment TEST-TRIAL-001");
    }
  }

  console.log(`\nTrial login password for all demo clinics: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
