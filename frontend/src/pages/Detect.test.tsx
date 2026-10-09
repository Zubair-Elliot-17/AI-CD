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

const engine = vi.hoisted(() => ({
  detectText: vi.fn(),
  detectFile: vi.fn(),
  status: { state: "ready" },
}));

vi.mock("../lib/engine", async (original) => {
  const actual = await original<typeof import("../lib/engine")>();
  return {
    ...actual,
    detectText: engine.detectText,
    detectFile: engine.detectFile,
    engine: { status: engine.status, load: vi.fn(), subscribe: () => () => {} },
  };
});

describe("Detect page (in-browser model)", () => {
  beforeEach(() => {
    history._reset();
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.clearAllMocks());

  it("analyses pasted text locally, shows the verdict and saves to history", async () => {
    engine.detectText.mockResolvedValue(result);
    renderPage();

    const analyse = screen.getByRole("button", { name: /analyse/i });
    expect(analyse).toBeDisabled();
    expect(screen.getByText(/never leaves this device/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Mixed sample" }));
    await userEvent.click(analyse);

    expect(await screen.findByRole("heading", { name: "Mixed signals" })).toBeInTheDocument();
    expect(history.list()[0].id).toBe(result.id);
    expect(engine.detectText.mock.calls[0][0]).toContain("bike");
  });

  it("shows the engine's validation message", async () => {
    const { EngineError } = await import("../lib/engine");
    engine.detectText.mockRejectedValue(new EngineError("Text must be at least 10 words long."));
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "AI sample" }));
    await userEvent.click(screen.getByRole("button", { name: /analyse/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("at least 10 words");
  });

  it("reads a dropped-in file locally", async () => {
    engine.detectFile.mockResolvedValue({ ...result, source: "file", filename: "essay.pdf" });
    const { container } = renderPage();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, new File(["%PDF"], "essay.pdf", { type: "application/pdf" }));

    expect(screen.getByText("essay.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /analyse/i }));
    await waitFor(() => expect(engine.detectFile).toHaveBeenCalled());
  });
});

describe("Detect page (FastAPI backend)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", "http://api.test");
    history._reset();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  async function renderServerPage() {
    const { default: Page } = await import("./Detect");
    const router = createMemoryRouter([{ path: "/", element: <Page /> }]);
    return render(<RouterProvider router={router} />);
  }

  it("posts the text to the API", async () => {
    fetchMock.mockImplementation((url: string) => (url.endsWith("/health") ? json(health) : json(result)));
    await renderServerPage();
    expect(await screen.findByText("Model ready")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mixed sample" }));
    await userEvent.click(screen.getByRole("button", { name: /analyse/i }));

    expect(await screen.findByRole("heading", { name: "Mixed signals" })).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls.find(([url]) => url === "http://api.test/api/detect")!;
    expect(JSON.parse(init.body).text).toContain("bike");
  });

  it("shows the server's error message", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.endsWith("/health") ? json(health) : json({ detail: "Too many requests. Try again in a minute." }, 429),
    );
    await renderServerPage();
    await userEvent.click(screen.getByRole("button", { name: "AI sample" }));
    await userEvent.click(screen.getByRole("button", { name: /analyse/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
  });
});
