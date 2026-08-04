import {
  externalLetterSchema,
  type ExternalLetterPayload,
} from "@/lib/documents/external/schema";

export function parseExternalPayload(raw: unknown): ExternalLetterPayload {
  if (typeof raw === "string") {
    try {
      return externalLetterSchema.parse(JSON.parse(raw));
    } catch {
      return externalLetterSchema.parse({});
    }
  }
  try {
    return externalLetterSchema.parse(raw);
  } catch {
    return externalLetterSchema.parse({});
  }
}

export function stringifyPayload(payload: ExternalLetterPayload): string {
  return JSON.stringify(payload);
}
