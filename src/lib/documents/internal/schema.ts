import { z } from "zod";
import { urgencyValues } from "@/lib/documents/external/schema";

export const internalLetterSchema = z.object({
  urgency: z.enum(urgencyValues).default(""),
  agencyName: z.string().default(""),
  docNum: z.string().default(""),
  date: z.string().default(""),
  subject: z.string().default(""),
  salutation: z.enum(["เรียน", "กราบเรียน"]).default("เรียน"),
  receiver: z.string().default(""),
  from: z.string().default(""),
  references: z.array(z.string()).default([""]),
  attachments: z.array(z.string()).default([""]),
  paragraphs: z.array(z.string()).default([""]),
  closing: z
    .enum(["จึงเรียนมาเพื่อโปรดทราบ", "จึงเรียนมาเพื่อโปรดพิจารณา", "จึงเรียนมาเพื่อโปรดดำเนินการ"])
    .default("จึงเรียนมาเพื่อโปรดทราบ"),
  signName: z.string().default(""),
  position: z.string().default(""),
});

export type InternalLetterPayload = z.infer<typeof internalLetterSchema>;

export const emptyInternalLetter = (): InternalLetterPayload =>
  internalLetterSchema.parse({});
