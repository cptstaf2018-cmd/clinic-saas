import { db } from "@/lib/db";

function twimlReply(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function generateSlots(
  startTime: string,
  endTime: string,
  takenTimes: Date[]
): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const takenSet = new Set(
    takenTimes.map((d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`)
  );

  const slots: string[] = [];
  for (let m = startMinutes; m < endMinutes && slots.length < 6; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const key = `${h}:${String(min).padStart(2, "0")}`;
    if (!takenSet.has(key)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
  }
  return slots;
}

function formatSlotLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "صباحاً" : "مساءً";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

const EMOJI_NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

async function getAvailableSlotsMessage(clinicId: string): Promise<{ message: string; slots: string[] }> {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const workingHours = await db.workingHours.findUnique({
    where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
  });

  if (!workingHours || !workingHours.isOpen) {
    return { message: "عذراً، العيادة مغلقة اليوم 🚫", slots: [] };
  }

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await db.appointment.findMany({
    where: {
      clinicId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "cancelled" },
    },
    select: { date: true },
  });

  const takenTimes = existingAppointments.map((a: { date: Date }) => a.date);
  const slots = generateSlots(workingHours.startTime, workingHours.endTime, takenTimes);

  if (slots.length === 0) {
    return { message: "عذراً، لا تتوفر مواعيد متاحة اليوم 😔", slots: [] };
  }

  const lines = slots.map(
    (s, i) => `${EMOJI_NUMBERS[i]} ${formatSlotLabel(s)}`
  );
  const message = `اختر الوقت المناسب:\n${lines.join("\n")}`;
  return { message, slots };
}

export async function POST(req: Request) {
  let body: Record<string, string>;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } else {
    body = await req.json();
  }

  const from: string = body["From"] ?? "";
  const to: string = body["To"] ?? "";
  const messageBody: string = (body["Body"] ?? "").trim();

  const phone = from.replace("whatsapp:", "");
  const clinicWhatsapp = to.replace("whatsapp:", "");

  // Find clinic
  const clinic = await db.clinic.findUnique({
    where: { whatsappNumber: clinicWhatsapp },
    include: { subscription: true },
  });

  if (!clinic) {
    return twimlReply("عذراً، هذا الرقم غير مسجل في النظام.");
  }

  // Check subscription
  const sub = clinic.subscription;
  const isActive =
    sub &&
    (sub.status === "active" || sub.status === "trial") &&
    sub.expiresAt > new Date();

  if (!isActive) {
    return twimlReply("عذراً، العيادة غير متاحة حالياً 🔴");
  }

  const clinicId = clinic.id;

  // Find or create session
  let session = await db.whatsappSession.findUnique({
    where: { clinicId_phone: { clinicId, phone } },
  });

  // Treat missing session or "done" step as a fresh start
  if (!session || session.step === "done") {
    // Check if patient exists
    const patient = await db.patient.findUnique({
      where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      include: {
        appointments: {
          where: {
            date: { gte: new Date() },
            status: { not: "cancelled" },
          },
          orderBy: { date: "asc" },
          take: 1,
        },
      },
    });

    if (patient) {
      const upcoming = patient.appointments[0];
      if (upcoming) {
        const dateStr = upcoming.date.toLocaleDateString("ar-IQ", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const timeStr = upcoming.date.toLocaleTimeString("ar-IQ", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "confirm_new" },
          create: { clinicId, phone, step: "confirm_new" },
        });

        return twimlReply(
          `أهلاً ${patient.name}! 👋\nلديك موعد بتاريخ ${dateStr} الساعة ${timeStr} ✅\nهل تريد حجز موعد جديد؟ أرسل (نعم)`
        );
      } else {
        const { message, slots } = await getAvailableSlotsMessage(clinicId);
        if (slots.length === 0) {
          await db.whatsappSession.upsert({
            where: { clinicId_phone: { clinicId, phone } },
            update: { step: "done" },
            create: { clinicId, phone, step: "done" },
          });
          return twimlReply(`أهلاً ${patient.name}! 👋\n${message}`);
        }

        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: `awaiting_slot:${slots.join(",")}:${patient.id}` },
          create: {
            clinicId,
            phone,
            step: `awaiting_slot:${slots.join(",")}:${patient.id}`,
          },
        });

        return twimlReply(`أهلاً ${patient.name}! 👋\n${message}`);
      }
    } else {
      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: "awaiting_name" },
        create: { clinicId, phone, step: "awaiting_name" },
      });

      return twimlReply(
        "أهلاً! اكتب اسمك الكريم لتسجيلك في النظام 📝"
      );
    }
  }

  const step = session.step;

  // awaiting_name
  if (step === "awaiting_name") {
    const name = messageBody;
    const newPatient = await db.patient.create({
      data: { clinicId, name, whatsappPhone: phone },
    });

    const { message, slots } = await getAvailableSlotsMessage(clinicId);
    if (slots.length === 0) {
      await db.whatsappSession.update({
        where: { id: session.id },
        data: { step: "done" },
      });
      return twimlReply(`تم تسجيلك بنجاح ${name}! 🎉\n${message}`);
    }

    await db.whatsappSession.update({
      where: { id: session.id },
      data: { step: `awaiting_slot:${slots.join(",")}:${newPatient.id}` },
    });

    return twimlReply(message);
  }

  // awaiting_slot
  if (step.startsWith("awaiting_slot:")) {
    const parts = step.split(":");
    // format: awaiting_slot:slot1,slot2,...:patientId
    const patientId = parts[parts.length - 1];
    const slotsRaw = parts.slice(1, parts.length - 1).join(":");
    const slots = slotsRaw.split(",");

    const choice = parseInt(messageBody, 10);
    if (isNaN(choice) || choice < 1 || choice > slots.length) {
      return twimlReply(
        `يرجى إرسال رقم من 1 إلى ${slots.length} لاختيار الموعد.`
      );
    }

    const chosenSlot = slots[choice - 1];
    const [h, m] = chosenSlot.split(":").map(Number);
    const appointmentDate = new Date();
    appointmentDate.setHours(h, m, 0, 0);

    // Assign queue number
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const last = await db.appointment.findFirst({
      where: {
        clinicId,
        date: { gte: startOfDay, lte: endOfDay },
        queueNumber: { not: null },
      },
      orderBy: { queueNumber: "desc" },
    });
    const queueNumber = (last?.queueNumber ?? 0) + 1;

    await db.appointment.create({
      data: {
        clinicId,
        patientId,
        date: appointmentDate,
        queueNumber,
      },
    });

    await db.whatsappSession.update({
      where: { id: session.id },
      data: { step: "done" },
    });

    const dateStr = appointmentDate.toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = appointmentDate.toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return twimlReply(
      `✅ تم حجز موعدك بنجاح!\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nنراك قريباً 🏥`
    );
  }

  // confirm_new
  if (step === "confirm_new") {
    if (messageBody === "نعم") {
      const patient = await db.patient.findUnique({
        where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      });

      if (!patient) {
        await db.whatsappSession.update({
          where: { id: session.id },
          data: { step: "awaiting_name" },
        });
        return twimlReply("اكتب اسمك الكريم لتسجيلك في النظام 📝");
      }

      const { message, slots } = await getAvailableSlotsMessage(clinicId);
      if (slots.length === 0) {
        await db.whatsappSession.update({
          where: { id: session.id },
          data: { step: "done" },
        });
        return twimlReply(message);
      }

      await db.whatsappSession.update({
        where: { id: session.id },
        data: { step: `awaiting_slot:${slots.join(",")}:${patient.id}` },
      });

      return twimlReply(message);
    } else {
      await db.whatsappSession.update({
        where: { id: session.id },
        data: { step: "done" },
      });
      return twimlReply("حسناً، إذا احتجت شيئاً نحن هنا! 😊");
    }
  }

  // Fallback — reset
  await db.whatsappSession.update({
    where: { id: session.id },
    data: { step: "done" },
  });
  return twimlReply("أهلاً! أرسل أي رسالة للبدء.");
}
