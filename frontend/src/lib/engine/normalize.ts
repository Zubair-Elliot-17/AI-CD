// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

// Port of backend/app/normalize.py: undo character tricks used to dodge detectors.

const INVISIBLE = /[\u00ad\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;

// Cyrillic and Greek letters that render the same as Latin ones.
const PAIRS: Record<string, string> = {
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j",
  ѕ: "s", ԁ: "d", ԛ: "q", ԝ: "w", һ: "h", А: "A", В: "B", Е: "E", К: "K",
  М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", Х: "X", І: "I", Ј: "J",
  Ѕ: "S", ο: "o", ι: "i", ν: "v", Α: "A", Β: "B", Ε: "E", Ζ: "Z", Η: "H",
  Ι: "I", Κ: "K", Μ: "M", Ν: "N", Ο: "O", Ρ: "P", Τ: "T", Υ: "Y", Χ: "X",
}; // prettier-ignore

const WORD = /[\p{L}\p{N}_]+/gu;
const LETTER = /\p{L}/u;

export interface Tampering {
  invisible_chars: number;
  homoglyphs: number;
}

const isLatin = (c: string) => {
  const l = c.toLowerCase();
  return l >= "a" && l <= "z";
};

export function normalize(input: string): { text: string; tampering: Tampering } {
  const invisible = input.match(INVISIBLE)?.length ?? 0;
  let text = input.replace(INVISIBLE, "").normalize("NFKC");
  const letters = Array.from(text).filter((c) => LETTER.test(c));
  const mostlyLatin = letters.filter(isLatin).length > letters.length / 2;
  let homoglyphs = 0;
  text = text.replace(WORD, (word) => {
    // Only touch words that mix scripts, so genuine Russian or Greek text is left alone.
    const chars = Array.from(word);
    const mixed = chars.some(isLatin);
    const disguised = mostlyLatin && chars.every((c) => c in PAIRS);
    if (!(mixed || disguised)) return word;
    homoglyphs += chars.filter((c) => c in PAIRS).length;
    return chars.map((c) => PAIRS[c] ?? c).join("");
  });
  return { text, tampering: { invisible_chars: invisible, homoglyphs } };
}
