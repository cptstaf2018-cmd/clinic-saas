/**
 * Reads a purchase receipt (photo or PDF) on the owner's own device, with no server and no paid service:
 * a PDF with a text layer is read directly; photos and scanned PDFs go through Tesseract (Arabic + English).
 * Browser only. Import it dynamically so the OCR code is downloaded only when a receipt is read.
 */

export type OcrProgress = (percent: number) => void;

const MAX_PDF_PAGES = 6;
const OCR_LANGUAGES = ["ara", "eng"];
const OCR_MAX_SIDE = 2400;
const OCR_MIN_SIDE = 1400;
const PDF_RENDER_SCALE = 2.5;
const MIN_TEXT_LAYER_CHARS = 30;
const SAME_LINE_TOLERANCE = 4;
const WIDE_GAP = 18;

export const isPdfFile = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);

/** Grayscale + stretched contrast on a canvas of a sensible size: what Tesseract reads best. */
function prepareForOcr(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const longest = Math.max(width, height);
  const scale = longest > OCR_MAX_SIDE ? OCR_MAX_SIDE / longest : longest < OCR_MIN_SIDE ? OCR_MIN_SIDE / longest : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas unavailable");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  let low = 255;
  let high = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = data[i + 1] = data[i + 2] = gray;
    if (gray < low) low = gray;
    if (gray > high) high = gray;
  }
  const range = Math.max(1, high - low);
  for (let i = 0; i < data.length; i += 4) {
    const stretched = Math.min(255, Math.max(0, Math.round(((data[i] - low) * 255) / range)));
    data[i] = data[i + 1] = data[i + 2] = stretched;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

type OcrWord = { text: string };
type OcrPage = { text: string; blocks?: { paragraphs: { lines: { words: OcrWord[] }[] }[] }[] | null };

/**
 * Lines of text from a recognized page, built from single words. Tesseract's own joined text glues neighbouring
 * numbers together on right-to-left lines ("1,50015,000"); its words stay separate.
 */
export function linesFromOcrPage(page: OcrPage): string[] {
  if (!page.blocks?.length) return page.text.split("\n");
  return page.blocks.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.map((line) => line.words.map((word) => word.text).join(" "))));
}

async function recognize(canvases: HTMLCanvasElement[], onProgress?: OcrProgress): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  let page = 0;
  const worker = await createWorker(OCR_LANGUAGES, 1, {
    logger: (message) => {
      if (message.status === "recognizing text") onProgress?.(Math.round(((page + message.progress) / canvases.length) * 100));
    },
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const lines: string[] = [];
    for (page = 0; page < canvases.length; page++) {
      const { data } = await worker.recognize(canvases[page], {}, { blocks: true });
      lines.push(...linesFromOcrPage(data));
    }
    return lines;
  } finally {
    await worker.terminate();
  }
}

async function readImage(file: File, onProgress?: OcrProgress): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  try {
    return await recognize([prepareForOcr(bitmap, bitmap.width, bitmap.height)], onProgress);
  } finally {
    bitmap.close();
  }
}

type TextPiece = { text: string; x: number; y: number };

/** Groups the pieces of a PDF text layer into visual lines, top to bottom, left to right. */
function linesFromPieces(pieces: TextPiece[]): string[] {
  const sorted = [...pieces].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: TextPiece[][] = [];
  for (const piece of sorted) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - piece.y) <= SAME_LINE_TOLERANCE) row.push(piece);
    else rows.push([piece]);
  }
  return rows.map((row) => {
    let line = "";
    let lastEnd = Number.NEGATIVE_INFINITY;
    for (const piece of row.sort((a, b) => a.x - b.x)) {
      line += (line && piece.x - lastEnd > WIDE_GAP ? "   " : line ? " " : "") + piece.text;
      lastEnd = piece.x + piece.text.length * 4;
    }
    return line;
  });
}

async function readPdf(file: File, onProgress?: OcrProgress): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);

  const textLines: string[] = [];
  for (let number = 1; number <= pageCount; number++) {
    const content = await (await pdf.getPage(number)).getTextContent();
    const pieces = content.items.flatMap((item) =>
      "str" in item && item.str.trim() ? [{ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }] : []
    );
    textLines.push(...linesFromPieces(pieces));
  }
  if (textLines.join("").length >= MIN_TEXT_LAYER_CHARS) return textLines;

  // a scanned PDF has no text layer: draw each page and read it like a photo
  const canvases: HTMLCanvasElement[] = [];
  for (let number = 1; number <= pageCount; number++) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    canvases.push(prepareForOcr(canvas, canvas.width, canvas.height));
  }
  return recognize(canvases, onProgress);
}

/** The text lines of a receipt, read on this device. */
export function readReceiptOnDevice(file: File, onProgress?: OcrProgress): Promise<string[]> {
  return isPdfFile(file) ? readPdf(file, onProgress) : readImage(file, onProgress);
}
