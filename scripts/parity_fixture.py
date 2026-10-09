# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Record Python outputs that the browser engine must match. Run from backend/: PYTHONPATH=. uv run python ../scripts/parity_fixture.py"""

import json
from pathlib import Path

from app.analysis import analyse, split_sentences
from app.detector import clean_text
from app.normalize import normalize

OUT = Path(__file__).resolve().parent.parent / "frontend/src/lib/engine/parity.json"

TEXTS = [
    "Dr. Smith went to Washington. He arrived at 5 p.m. and left! Did he stay? No.",
    "First line\nSecond line without a stop\n\nA new paragraph (with brackets.) Then more.",
    'She said "hello." Then she left. The U.S. economy grew by 3% in Q2, e.g. in tech.',
    "Ρlеаsе rеаd thіs​ саrеfullу, it is а tеst.",
    "Это настоящий русский текст. Он не должен меняться.",
    "Ｆｕｌｌ－ｗｉｄｔｈ letters and ligatures: ﬁne ﬂow.",
    "Mixed: the word Pаris has a Cyrillic а, and ­soft­ hyphens.",
    "# Heading\n\n- item one with **bold** and _italic_\n1. numbered [link](http://x.y) `code`\n<b>tag</b> &amp; &#39;quote&#39; ,comma",
    "```\nblock\n``` After the code block, text continues. Short. Another sentence here, quite long.",
    "Emoji test 🎉 works fine. Another sentence follows it. A. B. c. Final bit.",
]

LONG = " ".join(
    f"Sentence number {i} talks about topic {i % 7} in a fairly ordinary way." for i in range(80)
)


class FakeDetector:
    """Deterministic scores spread over [0, 1] so every verdict branch gets exercised."""

    name = "fake"

    def predict(self, texts):
        return [((sum(map(ord, t)) * 2654435761) % 1000) / 999 for t in texts]


def main() -> None:
    cases = []
    for text in [*TEXTS, LONG]:
        normalized, tampering = normalize(text)
        a = analyse(normalized, FakeDetector())
        cases.append(
            {
                "input": text,
                "normalized": normalized,
                "tampering": {
                    "invisible_chars": tampering.invisible_chars,
                    "homoglyphs": tampering.homoglyphs,
                },
                "sentences": [s.text for s in split_sentences(normalized)],
                "cleaned": clean_text(text),
                "analysis": {
                    "ai_probability": a.ai_probability,
                    "verdict": a.verdict,
                    "ai_sentence_share": a.ai_sentence_share,
                    "word_count": a.word_count,
                    "scores": [s.ai_probability for s in a.sentences],
                },
            }
        )
    OUT.write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(cases)} cases to {OUT}")


if __name__ == "__main__":
    main()
