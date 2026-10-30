import { afterEach, describe, expect, it, vi } from "vitest";
import { getInitialLoadDelay } from "./discussion.loading";
import { createDiscussionRepository } from "./discussion.repository";

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
const input = { recordId: "record-001", authorId: "user-001", parentId: null, body: "Contribution", language: "en" as const };

describe("loading simulation across environments", () => {
  it.each([
    ["development", undefined, 1200], ["development", "", 1200],
    ["development", "0", 0], ["development", "1300", 1300],
    ["development", "-1", 1200], ["development", "invalid", 1200],
    ["development", "Infinity", 1200], ["development", "9000", 2000],
    ["production", "1500", 1500], ["production", undefined, 1200], ["test", "1500", 0], [undefined, "1500", 1500],
  ])("uses %s / %s → %s ms", (environment, configured, expected) => {
    expect(getInitialLoadDelay(environment, configured)).toBe(expected);
  });
  it.each(["development", "production"])("delays only the first opening per record and shares pending requests in %s", async environment => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", environment);
    vi.stubEnv("NEXT_PUBLIC_INITIAL_LOAD_DELAY_MS", "1200");
    const repository = createDiscussionRepository();
    expect((await repository.loadInitialData()).records).toHaveLength(4);
    let settled = false;
    const first = repository.loadRecord("record-001").then(() => { settled = true; });
    const duplicate = repository.loadRecord("record-001");
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1199);
    expect(settled).toBe(false);
    expect(repository.hasLoadedRecord("record-001")).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, duplicate]);
    await repository.loadRecord("record-001");
    expect(vi.getTimerCount()).toBe(0);
    const second = repository.loadRecord("record-002");
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1200);
    await second;
    await expect(repository.loadRecord("missing")).rejects.toThrow("UNAVAILABLE");
    expect(repository.hasLoadedRecord("missing")).toBe(false);
  });
  it.each(["development", "production"])("validates immediately, then delays valid roots and replies before insertion in %s", async environment => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", environment);
    vi.stubEnv("NEXT_PUBLIC_INITIAL_LOAD_DELAY_MS", "1200");
    const repository = createDiscussionRepository();
    await expect(repository.createComment({ ...input, body: " " })).rejects.toThrow("EMPTY_COMMENT");
    expect(vi.getTimerCount()).toBe(0);
    for (const parentId of [null, "comment-001"]) {
      const before = (await repository.loadInitialData()).comments.length;
      const pending = repository.createComment({ ...input, parentId });
      await vi.advanceTimersByTimeAsync(1199);
      expect((await repository.loadInitialData()).comments).toHaveLength(before);
      await vi.advanceTimersByTimeAsync(1);
      const saved = await pending;
      expect(saved.parentId).toBe(parentId);
      expect((await repository.loadInitialData()).comments).toContainEqual(saved);
    }
  });
  it("schedules no artificial timers in tests", async () => {
    const environment = "test";
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", environment);
    vi.stubEnv("NEXT_PUBLIC_INITIAL_LOAD_DELAY_MS", "2000");
    const repository = createDiscussionRepository();
    await repository.loadInitialData();
    await repository.loadRecord("record-001");
    await repository.createComment(input);
    expect(vi.getTimerCount()).toBe(0);
  });
});
