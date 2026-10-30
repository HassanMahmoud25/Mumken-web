/** Shared presentation geometry for loaded views and their loading placeholders. */
export const discussionLayout = {
  panel: "rounded-2xl border border-slate-200 bg-white p-5 sm:p-7",
  recordGrid: "grid max-w-[1100px] gap-6 md:grid-cols-2",
  recordCard:
    "flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
  recordAction:
    "inline-flex min-h-10 sm:min-h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#30424f] active:brightness-95 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
  discussionHeader: "mb-5 flex items-center justify-between gap-3",
  composerFooter:
    "mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  divider: "my-5 border-t border-slate-100",
  commentSpacing: "py-5 first:pt-0 last:pb-0",
  replyThread: "mt-4 ms-3 space-y-3 sm:ms-11 sm:me-12",
  replyCard:
    "flex items-start gap-3 rounded-xl border border-slate-200 bg-[#f7f9f9] p-4",
} as const;

export const composerRows = 3;
