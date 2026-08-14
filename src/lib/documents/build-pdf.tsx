import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExternalDocumentPdf } from "@/components/documents/pdf/ExternalDocumentPdf";
import { InternalDocumentPdf } from "@/components/documents/pdf/InternalDocumentPdf";
import { StampDocumentPdf } from "@/components/documents/pdf/StampDocumentPdf";
import { OrderDocumentPdf } from "@/components/documents/pdf/OrderDocumentPdf";
import { AnnounceDocumentPdf } from "@/components/documents/pdf/AnnounceDocumentPdf";
import { CertDocumentPdf } from "@/components/documents/pdf/CertDocumentPdf";
import { MeetingDocumentPdf } from "@/components/documents/pdf/MeetingDocumentPdf";
import { getGarudaImageBuffer, registerPdfFonts } from "@/components/documents/pdf/registerFonts";
import type { ExternalLetterPayload } from "@/lib/documents/external/schema";
import type { InternalLetterPayload } from "@/lib/documents/internal/schema";
import type { StampLetterPayload } from "@/lib/documents/stamp/schema";
import type { OrderLetterPayload } from "@/lib/documents/order/schema";
import type { AnnounceLetterPayload } from "@/lib/documents/announce/schema";
import type { CertLetterPayload } from "@/lib/documents/cert/schema";
import type { MeetingLetterPayload } from "@/lib/documents/meeting/schema";

function garuda() {
  return getGarudaImageBuffer();
}

export async function buildExternalPdf(data: ExternalLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<ExternalDocumentPdf data={data} garudaSrc={garuda()} />));
}
export async function buildInternalPdf(data: InternalLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<InternalDocumentPdf data={data} garudaSrc={garuda()} />));
}
export async function buildStampPdf(data: StampLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<StampDocumentPdf data={data} garudaSrc={garuda()} />));
}
export async function buildOrderPdf(data: OrderLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<OrderDocumentPdf data={data} garudaSrc={garuda()} />));
}
export async function buildAnnouncePdf(data: AnnounceLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<AnnounceDocumentPdf data={data} garudaSrc={garuda()} />));
}
export async function buildCertPdf(data: CertLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<CertDocumentPdf data={data} garudaSrc={garuda()} />));
}
export async function buildMeetingPdf(data: MeetingLetterPayload): Promise<Buffer> {
  registerPdfFonts();
  return Buffer.from(await renderToBuffer(<MeetingDocumentPdf data={data} />));
}
