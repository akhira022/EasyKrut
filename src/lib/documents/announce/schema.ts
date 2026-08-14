import { z } from "zod";
import { urgencyValues } from "@/lib/documents/external/schema";

/** ประกาศ — แบบที่ 7 ตามระเบียบสารบรรณ ข้อ 20 */
export const announceKindValues = ["ประกาศ", "แจ้งความ"] as const;

export const announceLetterSchema = z.object({
  urgency: z.enum(urgencyValues).default(""),
  kind: z.enum(announceKindValues).default("ประกาศ"),
  issuer: z.string().default(""),
  subject: z.string().default(""),
  paragraphs: z.array(z.string()).default([""]),
  date: z.string().default(""),
  signName: z.string().default(""),
  position: z.string().default(""),
});

export type AnnounceLetterPayload = z.infer<typeof announceLetterSchema>;

/** หัวประกาศตามแบบ: «ประกาศ/แจ้งความ» ตามด้วยชื่อส่วนราชการ */
export function announceHeading(kind: string, issuer: string): string {
  const name = issuer.trim();
  return name ? `${kind} ${name}` : kind;
}

export const emptyAnnounceLetter = (): AnnounceLetterPayload =>
  announceLetterSchema.parse({});

export function announceDocumentTitle(
  payload: AnnounceLetterPayload,
  fallback: string,
): string {
  const subject = payload.subject.trim();
  if (subject) return subject.length > 80 ? `${subject.slice(0, 80)}…` : subject;
  return fallback;
}
