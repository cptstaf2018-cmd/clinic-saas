import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSignedFileUrl } from "@/lib/storage";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; aid: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const { id: patientId, aid } = await params;

  const attachment = await db.patientAttachment.findFirst({
    where: { id: aid, patientId, clinicId },
    select: { fileUrl: true },
  });

  if (!attachment?.fileUrl) {
    return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
  }

  const signedUrl = await createSignedFileUrl(attachment.fileUrl);
  if (!signedUrl) {
    return NextResponse.json({ error: "تعذر فتح الملف" }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
