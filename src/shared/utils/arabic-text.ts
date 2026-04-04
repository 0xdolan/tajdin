/** Arabic and Arabic Supplement / Extended-A blocks (common station names). */
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function textContainsArabicScript(text: string): boolean {
  return ARABIC_RANGE.test(text);
}
