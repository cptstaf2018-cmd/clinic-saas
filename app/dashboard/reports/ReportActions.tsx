"use client";

import { useState } from "react";

export default function ReportActions({ clinicName, specialty }: {
  summary?: string;
  clinicName: string;
  specialty: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const printHeader = document.querySelector("[data-print-header]") as HTMLElement | null;
      if (printHeader) printHeader.style.display = "block";

      const reportEl = document.querySelector("[data-report-container]") as HTMLElement | null;
      if (!reportEl) throw new Error("no container");

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

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

      const fileName = `تقرير-${clinicName}-${new Date().toLocaleDateString("ar-IQ").replace(/\//g, "-")}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      alert("تعذر توليد الـ PDF، جرب الطباعة");
    } finally {
      const printHeader = document.querySelector("[data-print-header]") as HTMLElement | null;
      if (printHeader) printHeader.style.display = "";
      setPdfLoading(false);
    }
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
        onClick={handleDownloadPdf}
        disabled={pdfLoading}
        className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            تنزيل PDF
          </>
        )}
      </button>
    </div>
  );
}
