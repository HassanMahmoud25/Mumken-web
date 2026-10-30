import { afterEach, describe, expect, it, vi } from "vitest";
import { createDiscussionRepository } from "./discussion.repository";

const input = { recordId: "record-001", parentId: null, authorId: "user-001", body: "Demo contribution", language: "en" as const };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  window.history.replaceState(null, "", "/");
});

function selectDemo(mode: string, environment = "development") {
  vi.stubEnv("NODE_ENV", environment);
  vi.stubEnv("NEXT_PUBLIC_INITIAL_LOAD_DELAY_MS", "0");
  window.history.replaceState(null, "", `/?demo=${mode}`);
  return createDiscussionRepository();
}

describe("browser demo scenarios through the real repository", () => {
  it("fails initial loading once, then recovers without changing the seed", async () => {
    const repository = selectDemo("initial-error");
    await expect(repository.loadInitialData()).rejects.toThrow("DEMO_REQUEST_FAILED");
    const seed = await repository.loadInitialData();
    expect(seed.records).toHaveLength(4);
    expect(seed.comments).toHaveLength(17);
    expect(seed.comments.filter(comment => comment.recordId === "record-002")).toEqual([]);
  });

  it("shares a failed discussion request, clears pending work, and caches only successful retries", async () => {
    const repository = selectDemo("load-error");
    await repository.loadInitialData();
    const results = await Promise.allSettled([repository.loadRecord("record-001"), repository.loadRecord("record-001")]);
    expect(results.every(result => result.status === "rejected")).toBe(true);
    expect(repository.hasLoadedRecord("record-001")).toBe(false);
    await repository.loadRecord("record-001");
    expect(repository.hasLoadedRecord("record-001")).toBe(true);
    await repository.loadRecord("record-003");
  });

  it.each([null, "comment-001"])("fails a valid submission once without insertion, then retries under parent %s", async parentId => {
    const repository = selectDemo("submit-error");
    const before = await repository.loadInitialData();
    await expect(repository.createComment({ ...input, parentId })).rejects.toThrow("DEMO_REQUEST_FAILED");
    expect((await repository.loadInitialData()).comments).toEqual(before.comments);
    const saved = await repository.createComment({ ...input, parentId });
    expect(saved.parentId).toBe(parentId);
    expect((await repository.loadInitialData()).comments).toHaveLength(18);
  });

  it("does not consume the failure on invalid input, retains the mode across navigation, and resets on a fresh session", async () => {
    const repository = selectDemo("submit-error");
    await repository.loadInitialData();
    window.history.replaceState(null, "", "/records/record-001");
    await expect(repository.createComment({ ...input, body: " " })).rejects.toThrow("EMPTY_COMMENT");
    await expect(repository.createComment(input)).rejects.toThrow("DEMO_REQUEST_FAILED");
    await repository.createComment(input);
    const fresh = selectDemo("submit-error");
    await expect(fresh.createComment(input)).rejects.toThrow("DEMO_REQUEST_FAILED");
  });

  it.each(["development", "production"])("holds the initial skeleton and valid operations for four seconds in %s slow mode", async environment => {
    vi.useFakeTimers();
    const repository = selectDemo("loading", environment);
    let loaded = false;
    const initial = repository.loadInitialData().then(() => { loaded = true; });
    await vi.advanceTimersByTimeAsync(3999);
    expect(loaded).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await initial;
    const detail = repository.loadRecord("record-001");
    expect(repository.hasLoadedRecord("record-001")).toBe(false);
    await vi.advanceTimersByTimeAsync(4000);
    await detail;
    const submission = repository.createComment(input);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(4000);
    await submission;
  });

  it.each(["initial", "load", "submit"] as const)("supports the explicit %s-error scenario in production", async operation => {
    const repository = selectDemo(`${operation}-error`, "production");
    const request = () => operation === "initial"
      ? repository.loadInitialData()
      : operation === "load"
        ? repository.loadRecord("record-001")
        : repository.createComment(input);
    await expect(request()).rejects.toThrow("DEMO_REQUEST_FAILED");
    await request();
  });

  it("keeps production requests immediate without a demo query", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");
    const repository = createDiscussionRepository();
    await repository.loadInitialData();
    await repository.loadRecord("record-001");
    await repository.createComment(input);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ignores unrecognised demo values", async () => {
    const repository = selectDemo("invalid");
    await repository.loadInitialData();
    await repository.loadRecord("record-001");
    await repository.createComment(input);
  });
});
