"use client";

import { useState } from "react";

export default function ReportActions({ summary, clinicName, specialty }: {
  summary: string;
  clinicName: string;
  specialty: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handlePdfWhatsApp() {
    setPdfLoading(true);
    try {
      // 1. Show the print header temporarily
      const printHeader = document.querySelector("[data-print-header]") as HTMLElement | null;
      if (printHeader) printHeader.style.display = "block";

      // 2. Find the report container
      const reportEl = document.querySelector("[data-report-container]") as HTMLElement | null;
      if (!reportEl) throw new Error("no container");

      // 3. Dynamically import libraries
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // 4. Render to canvas
      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // 5. Build PDF
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, "JPEG", 0, y === 0 ? 0 : -y, pageW, imgH);
        remaining -= pageH;
        if (remaining > 0) { pdf.addPage(); y += pageH; }
      }

      const pdfBlob = pdf.output("blob");
      const fileName = `تقرير-${clinicName}-${new Date().toLocaleDateString("ar-IQ").replace(/\//g, "-")}.pdf`;

      // 6. Try Web Share API (works on mobile → opens WhatsApp directly)
      if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: "application/pdf" })] })) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        await navigator.share({
          title: `تقرير ${clinicName}`,
          text: `التقرير اليومي الرسمي — ${clinicName} | ${specialty}`,
          files: [file],
        });
      } else {
        // 7. Fallback: download PDF + open WhatsApp text
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(`تقرير ${clinicName} - تم تحميل الملف، أرسله عبر واتساب`)}`, "_blank");
        }, 1000);
      }
    } catch (e) {
      console.error(e);
      alert("تعذر توليد الـ PDF، جرب الطباعة");
    } finally {
      // Hide print header again
      const printHeader = document.querySelector("[data-print-header]") as HTMLElement | null;
      if (printHeader) printHeader.style.display = "";
      setPdfLoading(false);
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    alert("تم نسخ التقرير");
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        طباعة
      </button>

      <button
        type="button"
        onClick={handlePdfWhatsApp}
        disabled={pdfLoading}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pdfLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            جاري التوليد...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.118 1.522 5.852L.057 23.197a.75.75 0 0 0 .916.916l5.345-1.465A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.695-.5-5.246-1.377l-.376-.217-3.9 1.069 1.07-3.9-.217-.376A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            PDF + واتساب
          </>
        )}
      </button>

      <button
        type="button"
        onClick={copySummary}
        className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        نسخ
      </button>
    </div>
  );
}
