import threadCss from "./components/CommentItem.module.css?inline";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiscussionProvider, useDiscussion } from "./DiscussionProvider";
import { createDiscussionRepository } from "./discussion.repository";
import type { Comment, DiscussionRepository } from "./discussion.types";
import RecordsPage from "../records/RecordsPage";

// Render real React forms without introducing a testing-library dependency.
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: ReactNode }) => <a {...props}>{children}</a> }));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  localStorage.clear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mediaQuery(false)));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const style = document.createElement("style");
  style.dataset.testThreadStyles = "true";
  style.textContent = threadCss;
  document.head.append(style);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  document.querySelector("style[data-test-thread-styles]")?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function button(text: string) {
  const result = Array.from(container.querySelectorAll("button")).find(item => item.textContent?.trim() === text);
  if (!result) throw new Error(`Missing button: ${text}`);
  return result;
}
async function click(text: string) { await act(async () => button(text).click()); }
function rootIds() {
  return Array.from(container.querySelectorAll("article[data-comment-id]"), article => article.getAttribute("data-comment-id"));
}
function thread(commentId: string) {
  const article = container.querySelector(`article[data-comment-id="${commentId}"]`);
  if (!article) throw new Error(`Missing thread: ${commentId}`);
  return article;
}
async function clickReply(commentId: string) {
  const reply = Array.from(thread(commentId).querySelectorAll("button")).find(item => item.textContent === "Reply");
  if (!reply) throw new Error(`Missing reply button: ${commentId}`);
  await act(async () => reply.click());
}
async function type(body: string) {
  const textarea = container.querySelector("textarea");
  if (!textarea) throw new Error("Missing composer");
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(textarea, body);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches, media: "(prefers-reduced-motion: reduce)", onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(),
    removeEventListener: vi.fn(), dispatchEvent: () => true,
  };
}
async function renderPage(repository: DiscussionRepository, recordId = "record-002") {
  await act(async () => root.render(<DiscussionProvider repository={repository}><RecordsPage key={recordId} recordId={recordId} /></DiscussionProvider>));
}

describe("discussion journey", () => {
  it("renders loading, a failed initial load, and genuine retry", async () => {
    const seed = await createDiscussionRepository().loadInitialData();
    let rejectLoad!: (reason: Error) => void;
    const loadInitialData = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => { rejectLoad = reject; })).mockResolvedValue(seed);
    const repository = { ...createDiscussionRepository(), loadInitialData };
    await renderPage(repository);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    await act(async () => rejectLoad(new Error("offline")));
    expect(container.textContent).toContain("We couldn't load");
    await click("Try again");
    expect(loadInitialData).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("No comments yet");
    expect(container.querySelector("textarea")).not.toBeNull();
  });
  it("replaces the correct loading skeletons with loaded content", async () => {
    const seed = await createDiscussionRepository().loadInitialData();
    let finishLoad!: (data: typeof seed) => void;
    const repository = { ...createDiscussionRepository(), loadInitialData: () => new Promise<typeof seed>(resolve => { finishLoad = resolve; }) };
    await act(async () => root.render(<DiscussionProvider repository={repository}><RecordsPage /></DiscussionProvider>));
    expect(container.querySelector('[role="status"][aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(5);
    expect(container.textContent).not.toContain("No updates");
    await act(async () => finishLoad(seed));
    expect(container.querySelector(".skeleton")).toBeNull();
    expect(container.textContent).toContain(seed.records[0].title.en);
    expect(container.textContent).toContain(seed.records[1].title.en);
  });
  it("keeps the detail-route fallback in skeleton mode even when session data is already loaded", async () => {
    await act(async () => root.render(<DiscussionProvider repository={createDiscussionRepository()}><RecordsPage loadingDetail /></DiscussionProvider>));
    expect(container.querySelector('header a img')?.getAttribute("alt")).toBe("MUMKEN");
    expect(container.querySelectorAll(".skeleton.rounded-full")).toHaveLength(5);
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("textarea")?.disabled).toBe(true);
    expect(container.textContent).not.toContain("Update unavailable");
    expect(container.textContent).not.toContain("No comments yet");
  });
  it("shows detail-shaped placeholders, not empty comments, while discussion loads", async () => {
    const repository = { ...createDiscussionRepository(), loadInitialData: () => new Promise<never>(() => {}) };
    await renderPage(repository, "record-002");
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll(".skeleton.rounded-full")).toHaveLength(5);
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("textarea")?.disabled).toBe(true);
    expect(container.textContent).not.toContain("No comments yet");
    await click("文Aالعربية");
    expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe("جارٍ تحميل النقاش...");
    expect(container.querySelector('[data-skeleton="composer"] button')?.textContent).toBe("نشر التعليق");
  });
  it("scrolls and focuses after reply selection, updates the target, and keeps a cancelled draft", async () => {
    await renderPage(createDiscussionRepository(), "record-001");
    await clickReply("comment-001");
    expect(container.textContent).toContain("Replying to Omar Saleh");
    expect(document.activeElement).toBe(container.querySelector("textarea"));
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "center" });
    await type("Draft to keep");
    await clickReply("comment-003");
    expect(container.textContent).toContain("Replying to Fahad Alqahtani");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    await click("Cancel");
    expect(container.textContent).not.toContain("Replying to");
    expect(container.querySelector("textarea")?.value).toBe("Draft to keep");
    expect(button("Post comment")).not.toBeNull();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
  });
  it("reselecting the same reply target scrolls and focuses the composer again", async () => {
    await renderPage(createDiscussionRepository(), "record-001");
    await clickReply("comment-001");
    await type("Preserve my reply draft");
    await clickReply("comment-001");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(container.querySelector("textarea"));
    expect(container.querySelector("textarea")?.value).toBe("Preserve my reply draft");
  });
  it("has a banner, main landmark, keyboard skip link and localized invalid-target feedback", async () => {
    let session: ReturnType<typeof useDiscussion> | undefined;
    function Probe() { session = useDiscussion("record-001"); return null; }
    await act(async () => root.render(<DiscussionProvider repository={createDiscussionRepository()}><Probe /><RecordsPage recordId="record-001" /></DiscussionProvider>));
    expect(container.querySelector("header")?.closest("main")).toBeNull();
    expect(container.querySelector('a[href="#main-content"]')?.textContent).toBe("Skip to content");
    await act(async () => { if (session) expect(await session.addComment("Invalid reply", "comment-002")).toBe(false); });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Choose an available top-level comment");
    expect(rootIds()).toEqual(["comment-005", "comment-003", "comment-001"]);
    await click("文Aالعربية");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("اختر تعليقًا رئيسيًا متاحًا");
    expect(container.querySelector('a[href="#main-content"]')?.textContent).toBe("انتقل إلى المحتوى");
  });
  it("uses instant reply scrolling for reduced motion and does not repeat on typing or locale changes", async () => {
    vi.mocked(window.matchMedia).mockReturnValue(mediaQuery(true));
    await renderPage(createDiscussionRepository(), "record-001");
    await clickReply("comment-001");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "instant", block: "center" });
    await type("Keep focus");
    await click("文Aالعربية");
    expect(container.textContent).toContain("الرد على");
    expect(container.querySelector("textarea")?.value).toBe("Keep focus");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });
  it("preserves a failed draft, retries, clears on success, and updates the count", async () => {
    const real = createDiscussionRepository();
    const createComment = vi.fn().mockRejectedValueOnce(new Error("failure")).mockImplementation(real.createComment);
    await renderPage({ ...real, createComment });
    await type("My contribution");
    await click("Post comment");
    expect(container.querySelector("textarea")?.value).toBe("My contribution");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Comment was not posted");
    expect(container.textContent).not.toContain("Your comment was posted successfully.");
    await click("Post comment");
    expect(container.querySelector("textarea")?.value).toBe("");
    expect(container.textContent).toContain("My contribution");
    expect(container.textContent).toContain("1 comments");
    expect(container.querySelector('form [role="status"]')?.textContent).toBe("Your comment was posted successfully.");
    await type("Another contribution");
    expect(container.querySelector('form [role="status"]')?.textContent).toBe("");
  });
  it("announces reply success in both languages and clears it when starting a new reply", async () => {
    await renderPage(createDiscussionRepository(), "record-001");
    await clickReply("comment-001");
    await type("A successful reply");
    await click("Post reply");
    expect(container.querySelector('form [role="status"]')?.textContent).toBe("Your reply was posted successfully.");
    await click("文Aالعربية");
    expect(container.querySelector('form [role="status"]')?.textContent).toBe("تم نشر ردك بنجاح.");
    const reply = thread("comment-001").querySelector("button");
    await act(async () => reply?.click());
    expect(container.textContent).not.toContain("تم نشر ردك بنجاح.");
    await type("رد جديد");
    await click("نشر الرد");
    expect(container.querySelector('form [role="status"]')?.textContent).toBe("تم نشر ردك بنجاح.");
  });
  it("announces submission in progress and inserts the result only once", async () => {
    const repository = createDiscussionRepository();
    let finish!: (comment: Comment) => void;
    const createComment = vi.fn(() => new Promise<Comment>(resolve => { finish = resolve; }));
    await renderPage({ ...repository, createComment });
    await type("Pending contribution");
    await click("Post comment");
    expect(button("Posting…").disabled).toBe(true);
    expect(container.querySelector("textarea")?.disabled).toBe(true);
    expect(container.querySelector('form[aria-busy="true"]')).not.toBeNull();
    expect(container.textContent).toContain("0 comments");
    await act(async () => container.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(createComment).toHaveBeenCalledTimes(1);
    const saved = await repository.createComment({ recordId: "record-002", authorId: "user-001", parentId: null, body: "Pending contribution", language: "en" });
    await act(async () => finish(saved));
    expect(container.textContent).toContain("1 comments");
    expect(container.querySelectorAll("article p[dir=auto]")).toHaveLength(1);
    expect(container.querySelector("textarea")?.value).toBe("");
  });
  it("rejects whitespace and preserves a draft when switching to Arabic", async () => {
    const real = createDiscussionRepository();
    const createComment = vi.fn(real.createComment);
    await renderPage({ ...real, createComment });
    await type("   ");
    await click("Post comment");
    expect(createComment).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
    await type("Draft to preserve");
    await click("文Aالعربية");
    expect(container.querySelector("textarea")?.value).toBe("Draft to preserve");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });
  it("renders both record links and an unavailable ID without a composer", async () => {
    const repository = createDiscussionRepository();
    await act(async () => root.render(<DiscussionProvider repository={repository}><RecordsPage /></DiscussionProvider>));
    expect(container.querySelector('a[href="/records/record-001"]')).not.toBeNull();
    expect(container.querySelector('a[href="/records/record-002"]')).not.toBeNull();
    await renderPage(repository, "missing");
    expect(container.textContent).toContain("Update unavailable");
    expect(container.querySelector("textarea")).toBeNull();
  });
  it("retains comments across record navigation and never submits a stale reply", async () => {
    const repository = createDiscussionRepository();
    await renderPage(repository, "record-001");
    await clickReply("comment-001");
    expect(container.textContent).toContain("Replying to Omar Saleh");
    await type("A reply");
    await click("Post reply");
    expect(container.textContent).toContain("A reply");
    await renderPage(repository, "record-002");
    expect(container.textContent).not.toContain("Replying to");
    await type("Second record comment");
    await click("Post comment");
    const comments = (await repository.loadInitialData()).comments;
    expect(comments.find(comment => comment.body === "Second record comment")?.parentId).toBeNull();
    await renderPage(repository, "record-001");
    expect(container.textContent).toContain("A reply");
  });
  it("drops an active reply target when switching to another record", async () => {
    const repository = createDiscussionRepository();
    await renderPage(repository, "record-001");
    await clickReply("comment-001");
    await type("Record one draft");
    expect(container.textContent).toContain("Replying to Omar Saleh");
    await renderPage(repository, "record-002");
    expect(container.textContent).not.toContain("Replying to");
    expect(container.querySelector("textarea")?.value).toBe("");
    expect(button("Post comment")).not.toBeNull();
  });
  it("inserts new roots first, retains ordering across records/locales, and reloads session data", async () => {
    const repository = createDiscussionRepository();
    await renderPage(repository, "record-001");
    expect(rootIds()).toEqual(["comment-005", "comment-003", "comment-001"]);
    await type("Newest main comment");
    await click("Post comment");
    const saved = (await repository.loadInitialData()).comments.find(comment => comment.body === "Newest main comment");
    expect(saved).toBeDefined();
    expect(rootIds()).toEqual([saved?.id, "comment-005", "comment-003", "comment-001"]);
    await click("文Aالعربية");
    expect(rootIds()[0]).toBe(saved?.id);
    await renderPage(repository, "record-002");
    expect(rootIds()).toEqual([]);
    await type("Record two main comment");
    await click("نشر التعليق");
    expect(rootIds()).toHaveLength(1);
    await renderPage(repository, "record-001");
    expect(rootIds()).toEqual([saved?.id, "comment-005", "comment-003", "comment-001"]);
    // Recreate the session UI from the same repository to verify a genuine data reload.
    await act(async () => root.render(<DiscussionProvider key="reloaded" repository={repository}><RecordsPage recordId="record-001" /></DiscussionProvider>));
    expect(rootIds()).toEqual([saved?.id, "comment-005", "comment-003", "comment-001"]);
  });
  it("keeps chronological replies in their parent without moving roots, including collapsed threads", async () => {
    const seed = await createDiscussionRepository().loadInitialData();
    seed.comments.push(
      { ...seed.comments[1], id: "later-reply", createdAt: "2026-10-24T10:00:00Z", body: "Later existing reply" },
      { ...seed.comments[1], id: "earlier-reply", createdAt: "2026-10-24T09:20:00Z", body: "Earlier existing reply" },
    );
    await renderPage(createDiscussionRepository(seed), "record-001");
    const rootsBefore = rootIds();
    const replyBodies = () => Array.from(thread("comment-001").querySelectorAll("div[data-comment-id] p[dir=auto]"), p => p.textContent);
    expect(replyBodies()).toEqual(["Earlier existing reply", seed.comments[1].body, "Later existing reply"]);
    await clickReply("comment-001");
    const hide = Array.from(thread("comment-001").querySelectorAll("button")).find(item => item.textContent?.includes("Hide replies"));
    if (!hide) throw new Error("Missing collapse action");
    await act(async () => hide.click());
    expect(thread("comment-001").querySelector('[aria-hidden="true"][inert]')).not.toBeNull();
    await type("Newest thread reply");
    await click("Post reply");
    expect(rootIds()).toEqual(rootsBefore);
    expect(replyBodies()).toEqual(["Earlier existing reply", seed.comments[1].body, "Later existing reply", "Newest thread reply"]);
    expect(thread("comment-003").textContent).not.toContain("Newest thread reply");
    await click("文Aالعربية");
    expect(rootIds()).toEqual(rootsBefore);
    expect(replyBodies().at(-1)).toBe("Newest thread reply");
    expect(container.textContent).toContain("8 تعليقات");
  });
  it("ignores stale record requests and retries a failed detail load", async () => {
    const real = createDiscussionRepository();
    let finishFirst!: () => void;
    let finishSecond!: () => void;
    const loadRecord = vi.fn().mockImplementationOnce(() => new Promise<void>(resolve => { finishFirst = resolve; }))
      .mockImplementationOnce(() => new Promise<void>(resolve => { finishSecond = resolve; }))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const repository = { ...real, loadRecord };
    await renderPage(repository, "record-001");
    expect(container.querySelector("form")).toBeNull();
    await renderPage(repository, "record-003");
    await act(async () => finishFirst());
    expect(container.querySelector("form")).toBeNull();
    await act(async () => finishSecond());
    expect(container.textContent).toContain("Community workshops on digital skills");
    expect(container.textContent).not.toContain("Expanding digital services");
    await renderPage(repository, "record-004");
    expect(container.textContent).toContain("We couldn't load");
    await click("Try again");
    expect(container.textContent).toContain("Improving neighbourhood green spaces");
    expect(container.querySelector("textarea")).not.toBeNull();
  });
  it("keeps reply context fixed while submitting and preserves it on failure", async () => {
    const real = createDiscussionRepository();
    let fail!: (reason: Error) => void;
    const createComment = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; })).mockImplementation(real.createComment);
    await renderPage({ ...real, createComment }, "record-001");
    await clickReply("comment-001");
    await type("Keep this reply");
    await click("Post reply");
    expect(button("Cancel").disabled).toBe(true);
    expect(Array.from(container.querySelectorAll("button")).filter(item => item.textContent === "Reply").every(item => item.disabled)).toBe(true);
    expect(container.querySelector(".spinner")).not.toBeNull();
    await act(async () => fail(new Error("offline")));
    expect(container.textContent).toContain("Replying to Omar Saleh");
    expect(container.querySelector("textarea")?.value).toBe("Keep this reply");
    expect(button("Cancel").disabled).toBe(false);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Reply was not posted");
    expect(container.textContent).toContain("5 comments");
    await click("文Aالعربية");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("تعذّر نشر ردك");
    expect(container.querySelector("textarea")?.value).toBe("Keep this reply");
    await click("نشر الرد");
    expect(createComment).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector("textarea")?.value).toBe("");
    expect(thread("comment-001").textContent).toContain("Keep this reply");
    expect(container.textContent).toContain("6 تعليقات");
  });
  it("visibly hides and shows independent threads in both locales", async () => {
    await renderPage(createDiscussionRepository(), "record-001");
    const toggle = (id: string) => thread(id).querySelector<HTMLButtonElement>("button[aria-controls]")!;
    const region = (id: string) => document.getElementById(toggle(id).getAttribute("aria-controls")!)!;
    const expectVisible = (id: string, visible: boolean) => {
      expect(toggle(id).getAttribute("aria-expanded")).toBe(String(visible));
      expect(getComputedStyle(region(id)).visibility).toBe(visible ? "visible" : "hidden");
      expect(getComputedStyle(region(id)).opacity).toBe(visible ? "1" : "0");
      expect(region(id).hasAttribute("inert")).toBe(!visible);
    };
    expectVisible("comment-001", true);
    await act(async () => toggle("comment-001").click());
    expectVisible("comment-001", false);
    expectVisible("comment-003", true);
    await act(async () => toggle("comment-003").click());
    expectVisible("comment-003", false);
    await act(async () => toggle("comment-001").click());
    expectVisible("comment-001", true);
    expectVisible("comment-003", false);
    await click("文Aالعربية");
    expect(toggle("comment-003").textContent).toContain("عرض الردود");
    await act(async () => toggle("comment-003").click());
    expectVisible("comment-003", true);
    // Rapid reversals settle on the latest state without sharing state across parents.
    await act(async () => { toggle("comment-001").click(); });
    await act(async () => { toggle("comment-001").click(); });
    await act(async () => { toggle("comment-001").click(); });
    expectVisible("comment-001", false);
    expectVisible("comment-003", true);
  });
  it("reveals newly added replies in expanded and collapsed threads without opening siblings", async () => {
    let session: ReturnType<typeof useDiscussion> | undefined;
    function Probe() { session = useDiscussion("record-001"); return null; }
    await act(async () => root.render(<DiscussionProvider repository={createDiscussionRepository()}><Probe /><RecordsPage recordId="record-001" /></DiscussionProvider>));
    const toggle = (id: string) => thread(id).querySelector<HTMLButtonElement>("button[aria-controls]")!;
    const region = (id: string) => document.getElementById(toggle(id).getAttribute("aria-controls")!)!;
    await act(async () => toggle("comment-003").click());
    for (const collapsed of [false, true]) {
      if (collapsed) await act(async () => toggle("comment-001").click());
      expect(toggle("comment-001").getAttribute("aria-expanded")).toBe(String(!collapsed));
      await act(async () => { expect(await session!.addComment(`Reply from ${collapsed ? "collapsed" : "expanded"} state`, "comment-001")).toBe(true); });
      expect(getComputedStyle(region("comment-001")).visibility).toBe("visible");
      expect(toggle("comment-001").getAttribute("aria-expanded")).toBe("true");
      expect(getComputedStyle(region("comment-003")).visibility).toBe("hidden");
      expect(rootIds()).toEqual(["comment-005", "comment-003", "comment-001"]);
    }
    expect(region("comment-001").textContent).toContain("Reply from collapsed state");
    expect(toggle("comment-001").textContent).toContain("(3)");
  });
  it("distinguishes an empty records list from a load failure", async () => {
    const seed = await createDiscussionRepository().loadInitialData();
    seed.records = [];
    await act(async () => root.render(<DiscussionProvider repository={createDiscussionRepository(seed)}><RecordsPage /></DiscussionProvider>));
    expect(container.textContent).toContain("No updates are available yet.");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  it("renders missing authors instead of silently hiding their comments", async () => {
    const seed = await createDiscussionRepository().loadInitialData();
    seed.users = [];
    await renderPage(createDiscussionRepository(seed), "record-001");
    expect(container.textContent).toContain("Unknown author");
    expect(container.textContent).toContain(seed.comments[0].body);
    expect(container.textContent).toContain(seed.comments[1].body);
    expect(container.textContent).toContain(seed.currentUser.name);
    expect(container.textContent).toContain("5 comments");
  });
  it("guards concurrent submissions before React has rerendered", async () => {
    const repository = createDiscussionRepository();
    let resolveCreate!: (comment: Comment) => void;
    const createComment = vi.fn(() => new Promise<Comment>(resolve => { resolveCreate = resolve; }));
    let session: ReturnType<typeof useDiscussion> | undefined;
    function Probe() { session = useDiscussion("record-002"); return null; }
    await act(async () => root.render(<DiscussionProvider repository={{ ...repository, createComment }}><Probe /></DiscussionProvider>));
    let first!: Promise<boolean>;
    let duplicate!: Promise<boolean>;
    await act(async () => {
      first = session!.addComment("New comment", null);
      duplicate = session!.addComment("New comment", null);
    });
    expect(createComment).toHaveBeenCalledTimes(1);
    expect(await duplicate).toBe(false);
    const saved = await repository.createComment({ recordId: "record-002", authorId: "user-001", body: "New comment", parentId: null, language: "en" });
    await act(async () => { resolveCreate(saved); await first; });
    expect(session?.commentsForRecord).toHaveLength(1);
  });
});
