// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { describe, expect, it } from "vitest";
import { sentenceTone } from "../format";
import { analyse, BROWSER_THRESHOLDS, cleanText, splitSentences, verdictFor } from "./analysis";
import { normalize } from "./normalize";
import cases from "./parity.json";

// Same deterministic scorer as FakeDetector in scripts/parity_fixture.py.
const fake = async (texts: string[]) =>
  texts.map((t) => {
    const sum = Array.from(t).reduce((a, c) => a + BigInt(c.codePointAt(0)!), 0n);
    return Number((sum * 2654435761n) % 1000n) / 999;
  });

describe("browser engine matches the Python backend", () => {
  it.each(cases.map((c, i) => [i, c] as const))("case %i", async (_, c) => {
    const { text, tampering } = normalize(c.input);
    expect(text).toBe(c.normalized);
    expect(tampering).toEqual(c.tampering);
    expect(splitSentences(text).map((s) => s.text)).toEqual(c.sentences);
    expect(cleanText(c.input)).toBe(c.cleaned);

    const a = await analyse(text, fake);
    expect(a.verdict).toBe(c.analysis.verdict);
    expect(a.word_count).toBe(c.analysis.word_count);
    expect(a.ai_probability).toBeCloseTo(c.analysis.ai_probability, 9);
    expect(a.ai_sentence_share).toBeCloseTo(c.analysis.ai_sentence_share, 9);
    expect(a.sentences.map((s) => s.ai_probability)).toEqual(c.analysis.scores);
  });

  it("offsets point back into the text", () => {
    const text = "Dr. Smith left.  Then he came back!\nNew line here.";
    for (const s of splitSentences(text)) expect(text.slice(s.start, s.end)).toBe(s.text);
  });

  it("covers every verdict branch", () => {
    expect(verdictFor(0.97, 0, 10)).toBe("ai");
    expect(verdictFor(0.2, 0, 10)).toBe("human");
    expect(verdictFor(0.7, 0, 10)).toBe("mixed");
    expect(verdictFor(0.2, 0.5, 10)).toBe("mixed");
    expect(verdictFor(0.2, 0.5, 3)).toBe("human");
  });

  it("uses the 8-bit model's own cut-offs in the browser", () => {
    expect(verdictFor(0.97, 0, 10, BROWSER_THRESHOLDS)).toBe("mixed");
    expect(verdictFor(0.6, 0, 10, BROWSER_THRESHOLDS)).toBe("human");
    expect(sentenceTone(0.96)).toBe("ai-strong");
  });
});
