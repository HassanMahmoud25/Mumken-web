/** Sample-data latency is identical in development and production; tests opt out. */
export function getInitialLoadDelay(
  environment: string | undefined,
  configured: string | undefined,
): number {
  if (environment === "test") return 0;
  if (configured === undefined || configured.trim() === "") return 1200;
  const milliseconds = Number(configured);
  return Number.isFinite(milliseconds) && milliseconds >= 0
    ? Math.min(milliseconds, 2000)
    : 1200;
}

export async function simulateRequest() {
  const delay = getInitialLoadDelay(
    process.env.NODE_ENV,
    process.env.NEXT_PUBLIC_INITIAL_LOAD_DELAY_MS,
  );
  if (delay > 0)
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
}
