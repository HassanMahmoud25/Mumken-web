import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DiscussionSkeleton from "./DiscussionSkeleton";
import en from "@/i18n/en.json";
import ar from "@/i18n/ar.json";

function render(view: "list" | "detail", locale: "en" | "ar" = "en") {
  const element = document.createElement("div");
  element.innerHTML = renderToStaticMarkup(<DiscussionSkeleton view={view} locale={locale} label="Loading" />);
  return element;
}

describe("component-shaped skeletons", () => {
  it("uses record cards with a full-width action in the same grid", () => {
    const element = render("list");
    expect(element.querySelector('[role="status"][aria-busy="true"]')).not.toBeNull();
    expect(element.querySelectorAll('[data-skeleton="record-card"]')).toHaveLength(2);
    expect(element.querySelectorAll('[data-skeleton="record-action"]')).toHaveLength(2);
    expect(element.querySelector("textarea")).toBeNull();
    expect(element.querySelectorAll("a, button")).toHaveLength(0);
  });
  it.each(["en", "ar"] as const)("matches localized composer controls and reply hierarchy in %s", locale => {
    const element = render("detail", locale);
    const t = locale === "ar" ? ar : en;
    expect(element.querySelectorAll('[data-skeleton="record-detail"]')).toHaveLength(1);
    expect(element.querySelectorAll('[data-skeleton="comment"]')).toHaveLength(3);
    expect(element.querySelectorAll('[data-skeleton="reply"]')).toHaveLength(2);
    expect(element.querySelectorAll('[data-skeleton="reply"] .h-8.w-8')).toHaveLength(2);
    const textarea = element.querySelector("textarea");
    expect(textarea?.rows).toBe(3);
    expect(textarea?.disabled).toBe(true);
    expect(textarea?.tabIndex).toBe(-1);
    const buttons = Array.from(element.querySelectorAll("button"));
    expect(buttons.some(button => button.textContent === t.postComment)).toBe(true);
    expect(buttons.every(button => button.disabled && button.tabIndex === -1)).toBe(true);
    expect(buttons.every(button => button.closest('[aria-hidden="true"]'))).toBe(true);
  });
});
