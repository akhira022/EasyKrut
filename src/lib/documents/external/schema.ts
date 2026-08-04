import { z } from "zod";

export const externalLetterSchema = z.object({
  department: z.string().default(""),
  subject: z.string().default(""),
  date: z.string().default(""),
  year: z.string().default(""),
  docNum: z.string().default(""),
  salutation: z.enum(["เรียน", "กราบเรียน"]).default("เรียน"),
  receiver: z.string().default(""),
  attachment: z.string().default(""),
  reference: z.string().default(""),
  paragraphs: z.array(z.string()).default([""]),
  closing: z
    .enum(["ขอแสดงความนับถือ", "ขอแสดงความเคารพอย่างยิ่ง"])
    .default("ขอแสดงความนับถือ"),
  signName: z.string().default(""),
  position: z.string().default(""),
  tel: z.string().default(""),
  fax: z.string().default(""),
  email: z.string().default(""),
});

export type ExternalLetterPayload = z.infer<typeof externalLetterSchema>;

export const emptyExternalLetter = (): ExternalLetterPayload =>
  externalLetterSchema.parse({});
