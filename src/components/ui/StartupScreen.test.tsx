import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import styles from "./StartupScreen.module.css";
import StartupScreen, { useStartupPlaceholder } from "./StartupScreen";

let container: HTMLDivElement;
let root: Root;

function Content({ route = "records" }: { route?: string }) {
  return <main>{useStartupPlaceholder() ? "skeleton" : route}</main>;
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("startup handoff", () => {
  it("waits for fonts, reveals the skeleton, then content without restarting on navigation", async () => {
    let finishFonts!: () => void;
    const fontReady = new Promise<void>(resolve => { finishFonts = resolve; });
    Object.defineProperty(document, "fonts", { configurable: true, value: { load: () => fontReady, ready: fontReady } });
    await act(async () => root.render(<StartupScreen><Content /></StartupScreen>));
    await act(async () => vi.advanceTimersByTimeAsync(1200));
    expect(container.querySelector(`.${styles.screen}`)?.getAttribute("data-covered")).toBe("true");
    await act(async () => finishFonts());
    expect(container.querySelector(`.${styles.screen}`)?.getAttribute("data-covered")).toBe("false");
    expect(container.querySelector("main")?.textContent).toBe("skeleton");
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(container.querySelector("main")?.textContent).toBe("records");
    await act(async () => root.render(<StartupScreen><Content route="record details" /></StartupScreen>));
    expect(container.querySelector("main")?.textContent).toBe("record details");
    expect(container.querySelector(`.${styles.screen}`)?.getAttribute("data-covered")).toBe("false");
  });

  it("reveals the app even when a font request never completes", async () => {
    const pending = new Promise<void>(() => {});
    Object.defineProperty(document, "fonts", { configurable: true, value: { load: () => pending, ready: pending } });
    await act(async () => root.render(<StartupScreen><Content /></StartupScreen>));
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(container.querySelector(`.${styles.screen}`)?.getAttribute("data-covered")).toBe("false");
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(container.querySelector("main")?.textContent).toBe("records");
  });
});
