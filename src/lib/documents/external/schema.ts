import { z } from "zod";

export const urgencyValues = ["", "ด่วน", "ด่วนมาก", "ด่วนที่สุด"] as const;
export type Urgency = (typeof urgencyValues)[number];

export const externalLetterSchema = z.object({
  urgency: z.enum(urgencyValues).default(""),
  agencyName: z.string().default(""),
  agencyAddress: z.string().default(""),
  subject: z.string().default(""),
  date: z.string().default(""),
  docNum: z.string().default(""),
  salutation: z.enum(["เรียน", "กราบเรียน"]).default("เรียน"),
  receiver: z.string().default(""),
  references: z.array(z.string()).default([""]),
  attachments: z.array(z.string()).default([""]),
  paragraphs: z.array(z.string()).default([""]),
  closing: z
    .enum(["ขอแสดงความนับถือ", "ขอแสดงความเคารพอย่างยิ่ง"])
    .default("ขอแสดงความนับถือ"),
  signName: z.string().default(""),
  position: z.string().default(""),
  contactUnit: z.string().default(""),
  tel: z.string().default(""),
  fax: z.string().default(""),
  email: z.string().default(""),
  cc: z.string().default(""),
});

export type ExternalLetterPayload = z.infer<typeof externalLetterSchema>;

export const emptyExternalLetter = (): ExternalLetterPayload =>
  externalLetterSchema.parse({});

/** Normalize legacy payloads (department / reference / attachment / year) into the current shape. */
export function normalizeExternalPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  if (typeof obj.agencyName !== "string" && typeof obj.department === "string") {
    obj.agencyName = obj.department;
  }
  if (typeof obj.agencyAddress !== "string") {
    obj.agencyAddress = "";
  }
  if (typeof obj.contactUnit !== "string") {
    obj.contactUnit =
      typeof obj.agencyName === "string" ? obj.agencyName : "";
  }
  if (typeof obj.urgency !== "string") {
    obj.urgency = "";
  }
  if (typeof obj.cc !== "string") {
    obj.cc = "";
  }

  if (!Array.isArray(obj.references)) {
    if (typeof obj.reference === "string" && obj.reference.trim()) {
      obj.references = [obj.reference];
    } else {
      obj.references = [""];
    }
  }
  if (!Array.isArray(obj.attachments)) {
    if (typeof obj.attachment === "string" && obj.attachment.trim()) {
      obj.attachments = [obj.attachment];
    } else {
      obj.attachments = [""];
    }
  }

  delete obj.department;
  delete obj.year;
  delete obj.reference;
  delete obj.attachment;

  return obj;
}
