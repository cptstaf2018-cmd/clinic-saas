import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; aid: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { aid } = await params;

  const attachment = await db.patientAttachment.findFirst({
    where: { id: aid, clinicId },
  });

  if (!attachment) return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });

  // حذف الملف من التخزين إذا وُجد
  if (attachment.fileUrl) {
    await deleteFile(attachment.fileUrl).catch(() => {});
  }

  await db.patientAttachment.delete({ where: { id: aid } });
  return NextResponse.json({ ok: true });
}
