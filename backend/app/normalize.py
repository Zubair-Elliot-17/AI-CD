# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Undo character tricks (invisible characters, look-alike letters) used to dodge detectors."""

import re
import unicodedata
from dataclasses import dataclass

INVISIBLE = re.compile("[\u00ad\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]")

# Cyrillic and Greek letters that render the same as Latin ones.
_PAIRS = {
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j",
    "ѕ": "s", "ԁ": "d", "ԛ": "q", "ԝ": "w", "һ": "h", "А": "A", "В": "B", "Е": "E", "К": "K",
    "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X", "І": "I", "Ј": "J",
    "Ѕ": "S", "ο": "o", "ι": "i", "ν": "v", "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H",
    "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X",
}  # fmt: skip
HOMOGLYPHS = str.maketrans(_PAIRS)
_HOMOGLYPH_CHARS = frozenset(_PAIRS)
_WORD = re.compile(r"\w+")


@dataclass
class Tampering:
    invisible_chars: int = 0
    homoglyphs: int = 0

    @property
    def detected(self) -> bool:
        return self.invisible_chars + self.homoglyphs > 0


def _is_latin(c: str) -> bool:
    return "a" <= c.lower() <= "z"


def _fix_word(word: str, mostly_latin: bool, counter: list[int]) -> str:
    # Only touch words that mix scripts, so genuine Russian or Greek text is left alone.
    # In English text, a word made only of look-alikes (a lone Cyrillic "а") is swapped too.
    mixed = any(_is_latin(c) for c in word)
    disguised = mostly_latin and all(c in _HOMOGLYPH_CHARS for c in word)
    if not (mixed or disguised):
        return word
    counter[0] += sum(c in _HOMOGLYPH_CHARS for c in word)
    return word.translate(HOMOGLYPHS)


def normalize(text: str) -> tuple[str, Tampering]:
    invisible = len(INVISIBLE.findall(text))
    text = INVISIBLE.sub("", text)
    text = unicodedata.normalize("NFKC", text)
    letters = [c for c in text if c.isalpha()]
    mostly_latin = sum(map(_is_latin, letters)) > len(letters) / 2
    counter = [0]
    text = _WORD.sub(lambda m: _fix_word(m.group(), mostly_latin, counter), text)
    return text, Tampering(invisible_chars=invisible, homoglyphs=counter[0])
