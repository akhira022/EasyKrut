/** Soft character budgets — warn in UI, never hard-truncate on save/export. */

export const DOC_SOFT_LIMITS = {
  subject: 120,
  paragraph: 600,
  /** รวมทุกย่อหน้า — เตือนว่าอาจเกิน 1 หน้า A4 */
  bodyTotal: 1500,
} as const;

export function countChars(text: string): number {
  return [...text].length;
}

export function bodyTotalChars(paragraphs: string[]): number {
  return paragraphs.reduce((sum, p) => sum + countChars(p), 0);
}

export function overSoftLimit(text: string, limit: number): boolean {
  return countChars(text) > limit;
}
