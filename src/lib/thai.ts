const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

export function toThaiNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\d/g, (d) => THAI_DIGITS[Number(d)]);
}

/** Zero-width space — an invisible, valid line-break opportunity. */
const ZWSP = "\u200B";

let thaiWordSegmenter: Intl.Segmenter | undefined;
function getThaiWordSegmenter(): Intl.Segmenter | undefined {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return undefined;
  thaiWordSegmenter ??= new Intl.Segmenter("th", { granularity: "word" });
  return thaiWordSegmenter;
}

/**
 * Thai script has no spaces between words, so text layout engines (browsers,
 * @react-pdf/renderer, etc.) treat an entire Thai sentence as a single
 * unbreakable "word" and either overflow it or fall back to splitting it at
 * an arbitrary character boundary (ugly mid-word breaks).
 *
 * This inserts an invisible zero-width space (U+200B) between Thai word
 * boundaries — as detected by `Intl.Segmenter` — so renderers can wrap the
 * text at real word boundaries instead. The ZWSP is never visible and adds
 * no extra spacing; it only exists as a break opportunity.
 *
 * Safe to call on mixed Thai/English/number text and safe to call twice
 * (idempotent — re-segmenting text that already contains ZWSP just yields
 * the same boundaries again since ZWSP itself isn't word content).
 */
export function insertThaiWordBreaks(text: string | null | undefined): string {
  if (!text) return "";
  const segmenter = getThaiWordSegmenter();
  if (!segmenter) return text; // Intl.Segmenter unsupported — return unchanged.
  const words = Array.from(segmenter.segment(text), (s) => s.segment);
  return words.join(ZWSP);
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/** Convert ISO date (yyyy-mm-dd) to Thai Buddhist date with Thai digits */
export function getThaiDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const day = toThaiNumber(d.getDate());
  const year = toThaiNumber(d.getFullYear() + 543);
  return `${day} ${THAI_MONTHS[d.getMonth()]} ${year}`;
}

export function currentYearMonth(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
