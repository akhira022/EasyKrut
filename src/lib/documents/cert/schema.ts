import { z } from "zod";

/** หนังสือรับรอง — แบบที่ 10 ตามระเบียบสารบรรณ ข้อ 24 */
export const certLetterSchema = z.object({
  docNum: z.string().default(""),
  agencyName: z.string().default(""),
  agencyAddress: z.string().default(""),
  certifiedName: z.string().default(""),
  paragraphs: z.array(z.string()).default([""]),
  date: z.string().default(""),
  signName: z.string().default(""),
  position: z.string().default(""),
});

export type CertLetterPayload = z.infer<typeof certLetterSchema>;

export const emptyCertLetter = (): CertLetterPayload => certLetterSchema.parse({});

export function certDocumentTitle(payload: CertLetterPayload, fallback: string): string {
  const name = payload.certifiedName.trim();
  if (name) return `รับรอง ${name.split(/\r?\n/)[0]!.trim()}`;
  const first = (payload.paragraphs || [])
    .map((p) => p.replace(/\s+/g, " ").trim())
    .find((p) => p.length > 0);
  if (first) return first.length > 80 ? `${first.slice(0, 80)}…` : first;
  return fallback;
}
