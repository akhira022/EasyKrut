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

export function parseExternalPayload(raw: unknown): ExternalLetterPayload {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return emptyExternalLetter();
    }
  }
  try {
    return externalLetterSchema.parse(normalizeExternalPayload(parsed));
  } catch {
    return emptyExternalLetter();
  }
}

export function parseInternalPayload(raw: unknown): InternalLetterPayload {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return emptyInternalLetter();
    }
  }
  try {
    return internalLetterSchema.parse(parsed);
  } catch {
    return emptyInternalLetter();
  }
}

export function parseStampPayload(raw: unknown): StampLetterPayload {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return emptyStampLetter();
    }
  }
  try {
    return stampLetterSchema.parse(parsed);
  } catch {
    return emptyStampLetter();
  }
}

export function stringifyPayload(
  payload: ExternalLetterPayload | InternalLetterPayload | StampLetterPayload,
): string {
  return JSON.stringify(payload);
}
