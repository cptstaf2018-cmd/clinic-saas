import { NextResponse } from "next/server";
import { requirePharmacy } from "@/lib/pharmacy/access";

const HEADERS = ["اسم الدواء", "المادة الفعالة", "سعر البيع", "سعر الشراء", "الكمية", "الباركود", "تاريخ الانتهاء", "التصنيف", "الشكل", "الحد الأدنى", "بوصفة"];
const EXAMPLES = [
  ["بنادول إكسترا", "باراسيتامول", "3500", "2500", "40", "6281001000011", "06/2027", "أدوية", "24 قرص", "10", "لا"],
  ["فيتامين سي 1000", "حمض الأسكوربيك", "7000", "5000", "25", "", "12/2026", "فيتامينات", "20 فوار", "5", "لا"],
];

/** A ready-to-fill sheet: UTF-8 with BOM so Excel shows the Arabic headers correctly. */
export async function GET() {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;

  const csv = "﻿" + [HEADERS, ...EXAMPLES].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="medicines-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
