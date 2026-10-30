import { describe, expect, it } from "vitest";
import {
  formatDate,
  getRecordById,
  getRecordComments,
  getReplies,
  getRootComments,
  getUserById,
} from "./discussion.utils";
import type { Comment, User, RecordItem } from "./discussion.types";

const comments: Comment[] = [
  {
    id: "c1",
    recordId: "r1",
    parentId: null,
    authorId: "u1",
    body: "First comment",
    language: "en",
    createdAt: "2026-10-24T09:00:00.000Z",
    updatedAt: null,
  },
  {
    id: "c2",
    recordId: "r1",
    parentId: "c1",
    authorId: "u2",
    body: "A reply",
    language: "en",
    createdAt: "2026-10-24T09:30:00.000Z",
    updatedAt: null,
  },
  {
    id: "c3",
    recordId: "r2",
    parentId: null,
    authorId: "u2",
    body: "Another record",
    language: "ar",
    createdAt: "2026-10-25T09:00:00.000Z",
    updatedAt: null,
  },
];

describe("discussion utilities", () => {
  it("filters comments by record and sorts them chronologically", () => {
    const result = getRecordComments(
      [comments[1], comments[0], comments[2]],
      "r1",
    );

    expect(result.map((comment) => comment.id)).toEqual(["c1", "c2"]);
  });

  it("returns only top-level comments", () => {
    expect(getRootComments(comments).map((comment) => comment.id)).toEqual([
      "c3",
      "c1",
    ]);
  });

  it("returns replies for a specific parent", () => {
    expect(getReplies(comments, "c1").map((comment) => comment.id)).toEqual([
      "c2",
    ]);

    expect(getReplies(comments, "missing")).toEqual([]);
  });

  it("sorts roots newest first and replies oldest first without changing input", () => {
    const newerRoot: Comment = { ...comments[0], id: "new-root", createdAt: "2026-10-25T12:00:00Z" };
    const olderReply: Comment = { ...comments[1], id: "old-reply", createdAt: "2026-10-24T09:05:00Z" };
    const newerReply: Comment = { ...comments[1], id: "new-reply", createdAt: "2026-10-25T13:00:00Z" };
    const input = Object.freeze([newerReply, comments[0], comments[1], newerRoot, olderReply]);
    const original = structuredClone(input);
    expect(getRootComments(input).map(comment => comment.id)).toEqual(["new-root", "c1"]);
    expect(getReplies(input, "c1").map(comment => comment.id)).toEqual(["old-reply", "c2", "new-reply"]);
    expect(input).toEqual(original);
    expect(getRootComments([...input, newerReply]).map(comment => comment.id)).toEqual(["new-root", "c1"]);
  });
  it("resolves tied creation times predictably and handles invalid dates", () => {
    const input: Comment[] = [comments[0], { ...comments[0], id: "later-insertion" }, { ...comments[0], id: "invalid", createdAt: "invalid" }];
    expect(getRootComments(input).map(comment => comment.id)).toEqual(["later-insertion", "c1", "invalid"]);
    expect(getRootComments(input)).toEqual(getRootComments(input));
    const replies: Comment[] = input.map(comment => ({ ...comment, parentId: "parent" }));
    expect(getReplies(replies, "parent").map(comment => comment.id)).toEqual(["invalid", "c1", "later-insertion"]);
  });
  it("formats valid dates for English and Arabic", () => {
    expect(formatDate("2026-10-24T09:00:00.000Z", "en")).not.toBe("");
    expect(formatDate("2026-10-24T09:00:00.000Z", "ar")).not.toBe("");
  });

  it("converts UTC instants once using explicit timezone rules, including DST", () => {
    const instant = "2026-10-24T09:15:00.000Z";
    expect(formatDate(instant, "en", "UTC")).toBe("Oct 24, 2026, 9:15 AM");
    expect(formatDate(instant, "en", "Africa/Cairo")).toBe("Oct 24, 2026, 12:15 PM");
    expect(formatDate(instant, "en", "Asia/Kolkata")).toBe("Oct 24, 2026, 2:45 PM");
    expect(formatDate("2026-10-30T09:15:00Z", "en", "Africa/Cairo")).toBe("Oct 30, 2026, 11:15 AM");
    expect(formatDate("2026-10-24T12:15:00+03:00", "en", "Africa/Cairo")).toBe(formatDate(instant, "en", "Africa/Cairo"));
    expect(formatDate(instant, "ar", "Africa/Cairo")).toBe(
      new Intl.DateTimeFormat("ar-SA", {dateStyle: "medium", timeStyle: "short", calendar: "gregory", timeZone: "Africa/Cairo"}).format(new Date(instant)),
    );
  });
  it("returns an empty string for invalid dates", () => {
    expect(formatDate("not-a-date", "en")).toBe("");
  });

  it("finds a user by ID", () => {
    const users: User[] = [{ id: "u1", name: "Noura", initials: "NA" }];

    expect(getUserById(users, "u1")?.name).toBe("Noura");
    expect(getUserById(users, "missing")).toBeUndefined();
  });

  it("finds a record by ID", () => {
    const records: RecordItem[] = [
      {
        id: "r1",
        title: { en: "Title", ar: "عنوان" },
        summary: { en: "Summary", ar: "ملخص" },
        source: "Source",
        publishedAt: "2026-10-24T08:30:00Z",
      },
    ];

    expect(getRecordById(records, "r1")?.title.en).toBe("Title");
    expect(getRecordById(records, "missing")).toBeUndefined();
  });
});
