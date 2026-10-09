// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { history } from "../lib/history";
import { result } from "../test/fixtures";
import Detect from "./Detect";

const health = {
  status: "ok",
  model: result.model,
  min_words: 10,
  max_chars: 50000,
  max_file_bytes: 1000000,
  supported_extensions: [".pdf"],
};

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

function renderPage() {
  const router = createMemoryRouter([{ path: "/", element: <Detect /> }]);
  return render(<RouterProvider router={router} />);
}

describe("Detect page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    history._reset();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("analyses pasted text, shows the verdict and saves to history", async () => {
    fetchMock.mockImplementation((url: string) => (url.endsWith("/health") ? json(health) : json(result)));
    renderPage();

    const analyse = screen.getByRole("button", { name: /analyse/i });
    expect(analyse).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Mixed sample" }));
    expect(analyse).toBeEnabled();
    await userEvent.click(analyse);

    expect(await screen.findByRole("heading", { name: "Mixed signals" })).toBeInTheDocument();
    expect(screen.getByText("Model ready")).toBeInTheDocument();
    expect(history.list()[0].id).toBe(result.id);

    const [, init] = fetchMock.mock.calls.find(([url]) => url.endsWith("/api/detect"))!;
    expect(JSON.parse(init.body).text).toContain("bike");
  });

  it("shows the server's error message", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.endsWith("/health") ? json(health) : json({ detail: "Too many requests. Try again in a minute." }, 429),
    );
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "AI sample" }));
    await userEvent.click(screen.getByRole("button", { name: /analyse/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
  });

  it("uploads a dropped-in file instead of text", async () => {
    fetchMock.mockImplementation((url: string) => (url.endsWith("/health") ? json(health) : json({ ...result, source: "file", filename: "essay.pdf" })));
    const { container } = renderPage();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, new File(["%PDF"], "essay.pdf", { type: "application/pdf" }));

    expect(screen.getByText("essay.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /analyse/i }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/api/detect/file"))).toBe(true));
  });
});
