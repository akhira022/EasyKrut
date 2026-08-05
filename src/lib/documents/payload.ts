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

export function stringifyPayload(
  payload: ExternalLetterPayload | InternalLetterPayload,
): string {
  return JSON.stringify(payload);
}
