// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { result } from "../test/fixtures";
import { ResultView } from "./ResultView";

describe("ResultView", () => {
  it("warns when the text was tampered with", () => {
    render(<ResultView result={{ ...result, tampering: { invisible_chars: 12, homoglyphs: 1 } }} />);
    expect(screen.getByText("Possible evasion attempt")).toBeInTheDocument();
    expect(screen.getByText(/12 invisible characters and 1 look-alike letter\./)).toBeInTheDocument();
  });

  it("stays quiet for clean text and for history saved before the check existed", () => {
    const { rerender } = render(<ResultView result={{ ...result, tampering: { invisible_chars: 0, homoglyphs: 0 } }} />);
    expect(screen.queryByText("Possible evasion attempt")).not.toBeInTheDocument();
    rerender(<ResultView result={result} />);
    expect(screen.queryByText("Possible evasion attempt")).not.toBeInTheDocument();
  });
});
