import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';

function assertEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function buildPdfBase64(code: string): Promise<string> {
  // 4x6 inches at 72 points/inch:
  const width = 4 * 72;  // 288
  const height = 6 * 72; // 432

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([width, height]);

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Start large and shrink until it fits width with some margin
  const margin = 24; // points
  let fontSize = 220;

  const maxWidth = width - margin * 2;
  while (fontSize > 24) {
    const textWidth = font.widthOfTextAtSize(code, fontSize);
    if (textWidth <= maxWidth) break;
    fontSize -= 4;
  }

  const textWidth = font.widthOfTextAtSize(code, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  const x = (width - textWidth) / 2;
  const y = (height - textHeight) / 2;

  page.drawText(code, { x, y, size: fontSize, font });

  const bytes = await pdf.save();
  return Buffer.from(bytes).toString('base64');
}

async function printWithPrintNode(pdfBase64: string, title: string) {
  const apiKey = assertEnv('PRINTNODE_API_KEY');
  const printerId = Number(assertEnv('PRINTNODE_PRINTER_ID'));
  if (!Number.isFinite(printerId)) throw new Error('PRINTNODE_PRINTER_ID must be a number');

  const auth = Buffer.from(`${apiKey}:`).toString('base64'); // Basic auth: apiKey as username, blank password :contentReference[oaicite:4]{index=4}

  const res = await fetch('https://api.printnode.com/printjobs', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      printerId,
      title,
      contentType: 'pdf_base64',
      content: pdfBase64,
      source: 'barcode-number-label-webapp',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PrintNode error ${res.status}: ${text}`);
  }

  // Response is printjob id (number) per docs
  const id = await res.json().catch(() => null);
  return id;
}

export async function POST(req: Request) {
  try {
    const { code } = (await req.json()) as { code?: string };
    const clean = (code ?? '').trim();

    if (!/^\d{6,10}$/.test(clean)) {
      return NextResponse.json({ error: 'Code must be 6–8 digits.' }, { status: 400 });
    }

    const pdfBase64 = await buildPdfBase64(clean);
    const jobId = await printWithPrintNode(pdfBase64, `Label ${clean}`);

    return NextResponse.json({ ok: true, jobId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
