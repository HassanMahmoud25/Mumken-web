import { simulateRequest } from "./discussion.loading";

type Operation = "initial" | "load" | "submit";

/** URL-selected scenarios use the real repository and reset on a full refresh.
 * Read lazily on the first request, after hydration, and retain the choice when
 * client-side navigation drops the query string. Never enable this in production. */
export function createDemoRequestSimulator() {
  let mode: string | null | undefined;
  let failed = false;

  return async (operation: Operation) => {
    if (mode === undefined) {
      mode = process.env.NODE_ENV === "development" && typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("demo")
        : null;
    }

    if (mode === "loading") {
      await new Promise<void>(resolve => setTimeout(resolve, 4000));
    } else if (operation !== "initial" || mode === "initial-error") {
      await simulateRequest();
    }

    if (!failed && mode === `${operation}-error`) {
      failed = true;
      throw new Error("DEMO_REQUEST_FAILED");
    }
  };
}
