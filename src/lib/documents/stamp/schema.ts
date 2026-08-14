import { z } from "zod";
import { urgencyValues } from "@/lib/documents/external/schema";

/**
 * หนังสือประทับตรา (แบบที่ 3 ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ)
 * ใช้กระดาษตราครุฑ · ประทับตราแทนการลงชื่อหัวหน้าส่วนราชการระดับกรมขึ้นไป
 */
export const stampLetterSchema = z.object({
  urgency: z.enum(urgencyValues).default(""),
  docNum: z.string().default(""),
  /** ถึง — ส่วนราชการ หน่วยงาน หรือบุคคลที่หนังสือมีถึง */
  to: z.string().default(""),
  paragraphs: z.array(z.string()).default([""]),
  /** ชื่อส่วนราชการที่ส่งหนังสือออก (เหนือตรา) */
  senderAgency: z.string().default(""),
  /** ลายมือชื่อย่อกำกับตรา */
  initials: z.string().default(""),
  date: z.string().default(""),
  /** ส่วนราชการเจ้าของเรื่อง */
  contactUnit: z.string().default(""),
  tel: z.string().default(""),
  /** ที่ตั้ง (ถ้ามี) */
  address: z.string().default(""),
});

export type StampLetterPayload = z.infer<typeof stampLetterSchema>;

export const emptyStampLetter = (): StampLetterPayload => stampLetterSchema.parse({});

/** ชื่อเอกสารในรายการ — ใช้ข้อความย่อหน้าแรก หรือผู้รับ */
export function stampDocumentTitle(payload: StampLetterPayload, fallback: string): string {
  const firstPara = (payload.paragraphs || [])
    .map((p) => p.replace(/\s+/g, " ").trim())
    .find((p) => p.length > 0);
  if (firstPara) {
    return firstPara.length > 80 ? `${firstPara.slice(0, 80)}…` : firstPara;
  }
  const to = payload.to.trim();
  if (to) return `ถึง ${to.split(/\r?\n/)[0]!.trim()}`;
  return fallback;
}
