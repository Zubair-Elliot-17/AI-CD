// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { result } from "../test/fixtures";
import { HighlightedText } from "./HighlightedText";

describe("HighlightedText", () => {
  it("preserves the original text, including gaps between sentences", () => {
    const { container } = render(<HighlightedText text={result.text} sentences={result.sentences} />);
    const body = container.querySelector(".whitespace-pre-wrap")!;
    expect(body.textContent).toBe(result.text);
  });

  it("shades sentences by score and reports the hovered one", async () => {
    render(<HighlightedText text={result.text} sentences={result.sentences} />);
    const marks = screen.getAllByRole("mark");
    expect(marks.map((m) => m.dataset.tone)).toEqual(["human", "ai-strong"]);

    await userEvent.hover(marks[1]);
    expect(screen.getByText("Sentence 2: 97% likely AI")).toBeInTheDocument();
  });
});
