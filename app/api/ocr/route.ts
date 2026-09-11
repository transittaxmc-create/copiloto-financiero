import { NextRequest, NextResponse } from "next/server";

/**
 * OCR bancario — extrae saldo y posibles cargos de un screenshot/PDF.
 *
 * Acepta multipart/form-data con un campo `file` (imagen PNG/JPG o PDF).
 * Usa tesseract.js para imágenes, pdf-lib para extraer texto de PDFs.
 *
 * Respuesta:
 *   { ok: true, balance: number|null, charges: Array<{desc, amount}>, raw: string }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USD_REGEX = /\$?\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g;

function extractBalance(text: string): number | null {
  // Busca patrones comunes: "Balance", "Available", "Current balance"
  const lines = text.split("\n").map((l) => l.trim());
  const keywords = ["balance", "available", "saldo", "disponible", "current"];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      const matches = [...line.matchAll(USD_REGEX)];
      if (matches.length > 0) {
        // Toma el último número (usualmente es el balance más reciente)
        const last = matches[matches.length - 1][1].replace(/,/g, "");
        const val = parseFloat(last);
        if (!isNaN(val) && val > 0) return val;
      }
    }
  }
  // Fallback: último número con $ en todo el texto
  const all = [...text.matchAll(/\$[\d,]+\.\d{2}/g)];
  if (all.length > 0) {
    const last = all[all.length - 1][0].replace(/[$,]/g, "");
    const val = parseFloat(last);
    if (!isNaN(val) && val > 0) return val;
  }
  return null;
}

function extractCharges(text: string): Array<{ desc: string; amount: number }> {
  const lines = text.split("\n").map((l) => l.trim());
  const charges: Array<{ desc: string; amount: number }> = [];
  for (const line of lines) {
    const m = line.match(/\$[\d,]+\.\d{2}/);
    if (m && !/balance|saldo|total|summary/i.test(line)) {
      const amount = parseFloat(m[0].replace(/[$,]/g, ""));
      if (!isNaN(amount) && amount > 0 && amount < 10000) {
        charges.push({ desc: line.replace(m[0], "").trim() || "Charge", amount });
      }
    }
  }
  return charges.slice(0, 10);
}

async function ocrImage(buffer: Buffer): Promise<string> {
  const { default: Tesseract } = await import("tesseract.js");
  const result = await Tesseract.recognize(buffer, "eng");
  return result.data.text;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFDocument } = await import("pdf-lib");
  // pdf-lib no extrae texto directamente, pero intentamos leer el contenido crudo
  // como fallback para PDFs con texto embebido
  const raw = buffer.toString("latin1");
  // Busca patrones de texto entre streams de PDF
  const textChunks: string[] = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m;
  while ((m = streamRegex.exec(raw)) !== null) {
    const chunk = m[1]
      .replace(/[^\x20-\x7E\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (chunk.length > 10) textChunks.push(chunk);
  }
  return textChunks.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const buf = Buffer.from(await (file as File).arrayBuffer());
    const mime = (file as File).type || "";

    let rawText = "";
    if (mime.includes("pdf")) {
      rawText = await extractPdfText(buf);
    } else {
      rawText = await ocrImage(buf);
    }

    const balance = extractBalance(rawText);
    const charges = extractCharges(rawText);

    return NextResponse.json({
      ok: true,
      balance,
      charges,
      raw: rawText.slice(0, 2000),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
