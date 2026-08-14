import {
  emptyExternalLetter,
  externalLetterSchema,
  normalizeExternalPayload,
  type ExternalLetterPayload,
} from "@/lib/documents/external/schema";
import {
  emptyInternalLetter,
  internalLetterSchema,
  type InternalLetterPayload,
} from "@/lib/documents/internal/schema";
import {
  emptyStampLetter,
  stampLetterSchema,
  type StampLetterPayload,
} from "@/lib/documents/stamp/schema";
import {
  emptyOrderLetter,
  orderLetterSchema,
  type OrderLetterPayload,
} from "@/lib/documents/order/schema";
import {
  emptyAnnounceLetter,
  announceLetterSchema,
  type AnnounceLetterPayload,
} from "@/lib/documents/announce/schema";
import {
  emptyCertLetter,
  certLetterSchema,
  type CertLetterPayload,
} from "@/lib/documents/cert/schema";
import {
  emptyMeetingLetter,
  meetingLetterSchema,
  type MeetingLetterPayload,
} from "@/lib/documents/meeting/schema";
import type { ZodType } from "zod";

export type AnyPayload =
  | ExternalLetterPayload
  | InternalLetterPayload
  | StampLetterPayload
  | OrderLetterPayload
  | AnnounceLetterPayload
  | CertLetterPayload
  | MeetingLetterPayload;

function parseWith<T>(raw: unknown, schema: ZodType<T>, fallback: () => T, normalize?: (v: unknown) => unknown): T {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fallback();
    }
  }
  try {
    return schema.parse(normalize ? normalize(parsed) : parsed);
  } catch {
    return fallback();
  }
}

export function parseExternalPayload(raw: unknown): ExternalLetterPayload {
  return parseWith(raw, externalLetterSchema, emptyExternalLetter, normalizeExternalPayload);
}
export function parseInternalPayload(raw: unknown): InternalLetterPayload {
  return parseWith(raw, internalLetterSchema, emptyInternalLetter);
}
export function parseStampPayload(raw: unknown): StampLetterPayload {
  return parseWith(raw, stampLetterSchema, emptyStampLetter);
}
export function parseOrderPayload(raw: unknown): OrderLetterPayload {
  return parseWith(raw, orderLetterSchema, emptyOrderLetter);
}
export function parseAnnouncePayload(raw: unknown): AnnounceLetterPayload {
  return parseWith(raw, announceLetterSchema, emptyAnnounceLetter);
}
export function parseCertPayload(raw: unknown): CertLetterPayload {
  return parseWith(raw, certLetterSchema, emptyCertLetter);
}
export function parseMeetingPayload(raw: unknown): MeetingLetterPayload {
  return parseWith(raw, meetingLetterSchema, emptyMeetingLetter);
}

export function stringifyPayload(payload: AnyPayload): string {
  return JSON.stringify(payload);
}
