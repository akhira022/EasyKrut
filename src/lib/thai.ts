const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

export function toThaiNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/\d/g, (d) => THAI_DIGITS[Number(d)]);
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
