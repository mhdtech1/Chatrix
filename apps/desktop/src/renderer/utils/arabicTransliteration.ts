/**
 * Arabic -> Egyptian "franco" (Arabizi) transliteration.
 *
 * Lives here rather than in ChatShell so the history hydration path can
 * share the single definition -- ui/utils/history.ts previously called
 * transliterateArabicToEgyptianFranco without importing it, which threw a
 * ReferenceError whenever recent history was restored from localStorage.
 */
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/;
const ARABIC_DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_CHAR_TO_EGYPTIAN_FRANCO: Record<string, string> = {
  ء: "2",
  آ: "aa",
  أ: "a",
  ؤ: "2w",
  إ: "e",
  ئ: "2y",
  ا: "a",
  ٱ: "a",
  ب: "b",
  ة: "a",
  ت: "t",
  ث: "s",
  ج: "g",
  ح: "7",
  خ: "5",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "9",
  ض: "9'",
  ط: "6",
  ظ: "6'",
  ع: "3",
  غ: "8",
  ف: "f",
  ق: "2",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ى: "a",
  ي: "y",
  پ: "p",
  ڤ: "v",
  چ: "ch",
  ژ: "zh",
  گ: "g",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "؟": "?",
  "،": ",",
  "؛": ";",
};
export const transliterateArabicToEgyptianFranco = (input: string) => {
  if (!input || !ARABIC_SCRIPT_REGEX.test(input)) return input;
  const normalized = input
    .normalize("NFKC")
    .replace(/\u0640/g, "")
    .replace(ARABIC_DIACRITICS_REGEX, "");
  let output = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1] ?? "";
    if (char === "ل" && next === "ا") {
      output += "la";
      index += 1;
      continue;
    }
    output += ARABIC_CHAR_TO_EGYPTIAN_FRANCO[char] ?? char;
  }
  return output;
};
