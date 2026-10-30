import { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import LocalizedTime from "./LocalizedTime";

afterEach(() => vi.restoreAllMocks());

describe("localized timestamps", () => {
  it("hydrates UTC markup without errors before showing local time", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const dateTime = "2026-10-30T01:23:45.678Z";
    const options = new Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({ ...options, timeZone: "Africa/Cairo" });
    const container = document.createElement("div");
    const view = <LocalizedTime dateTime={dateTime} locale="ar" />;
    container.innerHTML = renderToString(view);
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, view, { onRecoverableError }); });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector("time")?.dateTime).toBe(dateTime);
      expect(container.textContent).toBe(new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "medium", timeStyle: "short", calendar: "gregory", timeZone: "Africa/Cairo",
      }).format(new Date(dateTime)));
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
  it("uses a stable UTC server snapshot and converts to the browser timezone on the client", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const dateTime = "2026-10-24T09:15:00.000Z";
    const options = new Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({ ...options, timeZone: "Asia/Kolkata" });
    expect(renderToString(<LocalizedTime dateTime={dateTime} locale="en" />)).toContain("9:15 AM");
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<LocalizedTime dateTime={dateTime} locale="en" />));
      expect(container.querySelector("time")?.dateTime).toBe(dateTime);
      expect(container.textContent).toBe("Oct 24, 2026, 2:45 PM");
      await act(async () => root.render(<LocalizedTime dateTime={dateTime} locale="ar" />));
      expect(container.textContent).toBe(new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "medium", timeStyle: "short", calendar: "gregory", timeZone: "Asia/Kolkata",
      }).format(new Date(dateTime)));
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
