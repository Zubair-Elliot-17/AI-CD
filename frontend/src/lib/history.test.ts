// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import { beforeEach, describe, expect, it } from "vitest";
import { result } from "../test/fixtures";
import { history } from "./history";

describe("history store", () => {
  beforeEach(() => history._reset());

  it("adds newest first, de-duplicates and persists", () => {
    history.add(result);
    history.add({ ...result, id: "second" });
    history.add(result);
    expect(history.list().map((e) => e.id)).toEqual(["abc-123", "second"]);

    history._reset();
    expect(history.list()).toHaveLength(2);
  });

  it("removes and clears", () => {
    history.add(result);
    history.add({ ...result, id: "second" });
    history.remove("second");
    expect(history.list().map((e) => e.id)).toEqual(["abc-123"]);
    history.clear();
    expect(history.list()).toEqual([]);
  });

  it("survives corrupt storage", () => {
    localStorage.setItem("aicd-history-v2", "{not json");
    expect(history.list()).toEqual([]);
  });
});
