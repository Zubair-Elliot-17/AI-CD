# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Character-level evasion attacks from the RAID benchmark (Dugan et al., 2024)."""

import random

from app.normalize import _PAIRS

_TO_CYRILLIC = {latin: glyph for glyph, latin in _PAIRS.items() if "Ѐ" <= glyph <= "ӿ"}


def zero_width(text: str, rng: random.Random, rate: float = 0.5) -> str:
    """Insert a zero-width space after a share of characters."""
    return "".join(c + "​" if rng.random() < rate else c for c in text)


def homoglyph(text: str, rng: random.Random, rate: float = 0.5) -> str:
    """Swap a share of Latin letters for identical-looking Cyrillic ones."""
    return "".join(
        _TO_CYRILLIC[c] if c in _TO_CYRILLIC and rng.random() < rate else c for c in text
    )


ATTACKS = {"zero_width": zero_width, "homoglyph": homoglyph}
