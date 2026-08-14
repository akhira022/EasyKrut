import { z } from "zod";

const agendaSchema = z.object({
  title: z.string().default(""),
  body: z.string().default(""),
  resolution: z.string().default(""),
});

/** รายงานการประชุม — แบบที่ 11 ตามระเบียบสารบรรณ ข้อ 25 */
export const meetingLetterSchema = z.object({
  committee: z.string().default(""),
  session: z.string().default(""),
  date: z.string().default(""),
  place: z.string().default(""),
  attendees: z.array(z.string()).default([""]),
  absentees: z.array(z.string()).default([""]),
  participants: z.array(z.string()).default([""]),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
  agendas: z.array(agendaSchema).default([{ title: "", body: "", resolution: "" }]),
  recorderName: z.string().default(""),
});

export type MeetingLetterPayload = z.infer<typeof meetingLetterSchema>;

export const emptyMeetingLetter = (): MeetingLetterPayload =>
  meetingLetterSchema.parse({});

export function meetingDocumentTitle(
  payload: MeetingLetterPayload,
  fallback: string,
): string {
  const committee = payload.committee.trim();
  const session = payload.session.trim();
  if (committee && session) return `รายงานการประชุม ${committee} ครั้งที่ ${session}`;
  if (committee) return `รายงานการประชุม ${committee}`;
  return fallback;
}
