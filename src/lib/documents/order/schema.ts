import { z } from "zod";
import { urgencyValues } from "@/lib/documents/external/schema";

/** คำสั่ง — แบบที่ 4 ตามระเบียบสารบรรณ ข้อ 16 */
export const orderLetterSchema = z.object({
  urgency: z.enum(urgencyValues).default(""),
  issuer: z.string().default(""),
  docNum: z.string().default(""),
  subject: z.string().default(""),
  paragraphs: z.array(z.string()).default([""]),
  effectiveFrom: z.string().default(""),
  date: z.string().default(""),
  signName: z.string().default(""),
  position: z.string().default(""),
});

export type OrderLetterPayload = z.infer<typeof orderLetterSchema>;

/** หัวคำสั่งตามแบบ: «คำสั่ง» ตามด้วยส่วนราชการหรือตำแหน่งผู้ออก */
export function orderHeading(issuer: string): string {
  const name = issuer.trim();
  return name ? `คำสั่ง ${name}` : "คำสั่ง";
}

export const emptyOrderLetter = (): OrderLetterPayload => orderLetterSchema.parse({});

export function orderDocumentTitle(payload: OrderLetterPayload, fallback: string): string {
  const subject = payload.subject.trim();
  if (subject) return subject.length > 80 ? `${subject.slice(0, 80)}…` : subject;
  return fallback;
}
