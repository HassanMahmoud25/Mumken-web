import { afterEach, describe, expect, it, vi } from "vitest";
import { createDiscussionRepository } from "./discussion.repository";
import type { CreateCommentInput } from "./discussion.types";

afterEach(() => vi.useRealTimers());

const input: CreateCommentInput = { recordId: "record-001", parentId: null, authorId: "user-001", body: "  A useful contribution  ", language: "en" };

describe("local discussion repository", () => {
  it("loads both supplied records and resolves the current user object", async () => {
    const data = await createDiscussionRepository().loadInitialData();
    expect(data.records.map(record => record.id)).toEqual(["record-001", "record-002", "record-003", "record-004"]);
    expect(data.currentUser).toEqual({ id: "user-001", name: "Noura Alharbi", initials: "NA" });
    expect(data.comments.filter(comment => comment.recordId === "record-002")).toEqual([]);
  });
  it("persists trimmed comments through reloads of the same session and isolates new sessions", async () => {
    const repository = createDiscussionRepository();
    const comment = await repository.createComment(input);
    expect(comment.body).toBe("A useful contribution");
    expect((await repository.loadInitialData()).comments).toContainEqual(comment);
    expect((await createDiscussionRepository().loadInitialData()).comments).not.toContainEqual(comment);
  });
  it("does not let callers mutate stored data", async () => {
    const repository = createDiscussionRepository();
    const data = await repository.loadInitialData();
    data.records.length = 0;
    expect((await repository.loadInitialData()).records).toHaveLength(4);
  });
  it.each([
    [{ body: " \n " }, "EMPTY_COMMENT"],
    [{ body: "a".repeat(2001) }, "COMMENT_TOO_LONG"],
    [{ recordId: "missing" }, "UNAVAILABLE"],
    [{ authorId: "missing" }, "INVALID_AUTHOR"],
    [{ parentId: "missing" }, "INVALID_REPLY_TARGET"],
    [{ parentId: "comment-002" }, "INVALID_REPLY_TARGET"],
    [{ recordId: "record-002", parentId: "comment-001" }, "INVALID_REPLY_TARGET"],
  ])("rejects invalid input %j without adding a comment", async (change, code) => {
    const repository = createDiscussionRepository();
    await expect(repository.createComment({ ...input, ...change })).rejects.toThrow(code);
    expect((await repository.loadInitialData()).comments).toHaveLength(17);
  });
  it("stores the exact current instant as UTC ISO for new roots and replies", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-10-30T01:23:45.678Z");
    vi.setSystemTime(now);
    const repository = createDiscussionRepository();
    for (const parentId of [null, "comment-001"]) {
      const saved = await repository.createComment({ ...input, parentId });
      expect(saved.createdAt).toBe(now.toISOString());
      expect(Date.parse(saved.createdAt)).toBe(now.getTime());
      expect((await repository.loadInitialData()).comments.find(comment => comment.id === saved.id)?.createdAt).toBe(saved.createdAt);
    }
    expect((await repository.loadInitialData()).comments.find(comment => comment.id === "comment-001")?.createdAt).toBe("2026-10-24T09:15:00Z");
  });
  it("supports replies to roots including roots created during the session", async () => {
    const repository = createDiscussionRepository();
    const parent = await repository.createComment(input);
    const reply = await repository.createComment({ ...input, parentId: parent.id });
    expect(reply.parentId).toBe(parent.id);
    await expect(repository.createComment({ ...input, parentId: reply.id })).rejects.toThrow("INVALID_REPLY_TARGET");
  });
});
