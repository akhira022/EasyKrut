import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExternalDocumentPdf } from "@/components/documents/pdf/ExternalDocumentPdf";
import { InternalDocumentPdf } from "@/components/documents/pdf/InternalDocumentPdf";
import { StampDocumentPdf } from "@/components/documents/pdf/StampDocumentPdf";
import { getGarudaImageBuffer, registerPdfFonts } from "@/components/documents/pdf/registerFonts";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import type { StampLetterPayload } from "@/lib/documents/stamp/schema";

export async function buildExternalPdf(data: ExternalLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  const buffer = await renderToBuffer(
    <ExternalDocumentPdf data={data} garudaSrc={getGarudaImageBuffer()} />,
  );
  return Buffer.from(buffer);
}

export async function buildInternalPdf(data: InternalLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  const buffer = await renderToBuffer(
    <InternalDocumentPdf data={data} garudaSrc={getGarudaImageBuffer()} />,
  );
  return Buffer.from(buffer);
}

export async function buildStampPdf(data: StampLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  const buffer = await renderToBuffer(
    <StampDocumentPdf data={data} garudaSrc={getGarudaImageBuffer()} />,
  );
  return Buffer.from(buffer);
}
