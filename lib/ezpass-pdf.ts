import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { EZPassRecord } from './ezpass-types';

export async function generateDisputePDF(record: EZPassRecord): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  // Header
  page.drawText('DISPUTA DE CARGO E-ZPASS', {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 30;

  // Número de disputa
  page.drawText(`No. Disputa: DIS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`, {
    x: margin,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 20;

  // Fecha
  page.drawText(`Fecha: ${new Date().toLocaleDateString('es-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

  // Línea separadora
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // Sección: Datos del Cargo en Disputa
  page.drawText('DATOS DEL CARGO EN DISPUTA', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;

  const fields = [
    ['Ubicación', record.location],
    ['Fecha', record.trip_date],
    ['Hora', record.trip_time || 'N/A'],
    ['Monto', `$${Number(record.amount).toFixed(2)}`],
    ['Fuente', getSourceLabel(record.source)],
    ['Estado', record.status.toUpperCase()],
  ];

  for (const [label, value] of fields) {
    page.drawText(`${label}:`, {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(value, {
      x: margin + 100,
      y,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 18;
  }

  y -= 15;

  // Sección: Motivo de la Disputa
  page.drawText('MOTIVO DE LA DISPUTA', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;

  const reason = `El presente cargo por $${Number(record.amount).toFixed(2)} en ${record.location} ` +
    `registrado el ${record.trip_date} a las ${record.trip_time || 'hora desconocida'} ` +
    `ha sido identificado como un posible cargo duplicado. ` +
    `Solicitamos la verificación y eliminación de este cargo de nuestra cuenta.`;

  const words = reason.split(' ');
  let line = '';
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const textWidth = font.widthOfTextAtSize(testLine, 10);
    if (textWidth > width - 2 * margin) {
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 15;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;
  }

  y -= 15;

  // Sección: Evidencia
  page.drawText('EVIDENCIA ADJUNTA', {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;

  page.drawText('Se adjunta la siguiente evidencia:', {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 18;

  const evidenceItems = [
    '• Captura de pantalla del viaje',
    '• Registro GPS del vehículo',
    '• Statement de E-ZPass (si aplica)',
  ];

  for (const item of evidenceItems) {
    page.drawText(item, {
      x: margin + 10,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 15;
  }

  y -= 20;

  // Footer
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  page.drawText('Documento generado automáticamente por Copiloto Financiero', {
    x: margin,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 12;

  page.drawText(`Generado: ${new Date().toISOString()}`, {
    x: margin,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    gps: 'GPS Automático',
    screenshot: 'Screenshot/Manual',
    ezpass_statement: 'Statement E-ZPass',
    company_invoice: 'Factura Compañía',
  };
  return labels[source] || source;
}