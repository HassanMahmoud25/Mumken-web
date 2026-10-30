import type { ReactNode } from "react";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import en from "@/i18n/en.json";
import ar from "@/i18n/ar.json";
import type { Locale } from "../discussion.types";
import { composerRows, discussionLayout as layout } from "../discussion.layout";

// Each row reserves the real text's line-height; bars represent glyphs, not line boxes.
function TextRow({
  className = "",
  short = false,
}: {
  className?: string;
  short?: boolean;
}) {
  return (
    <div className={`flex h-lh items-center ${className}`}>
      <Skeleton className={`h-[0.8em] ${short ? "w-3/4" : "w-full"}`} />
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block max-w-full">
      <span className="invisible">{children}</span>
      <Skeleton className="absolute inset-x-0 top-1/2 h-[0.8em] -translate-y-1/2" />
    </span>
  );
}

function RecordCardSkeleton({ first = false, action, locale }: { first?: boolean; action: string; locale: Locale }) {
  const isArabic = locale === "ar";
  return <div data-skeleton="record-card" className={layout.recordCard}>
    <div className="text-sm"><TextRow short /><TextRow className="hidden max-[22.4375rem]:flex" short /></div>
    <div className="mt-4 text-xl font-bold">
      <TextRow />
      {!isArabic && <TextRow className="sm:hidden md:flex min-[72.75rem]:hidden" short />}
      {first && <TextRow className="hidden max-[22.4375rem]:flex" short />}
    </div>
    <div className="mt-3 text-base leading-7">
      <TextRow />
      <TextRow className={isArabic && !first ? "min-[72.75rem]:hidden" : ""} short />
      <TextRow className={isArabic && !first ? "hidden max-[22.4375rem]:flex" : "sm:hidden md:flex min-[72.75rem]:hidden"} short />
      {(!isArabic || first) && <TextRow className={first && !isArabic ? "hidden max-[22.4375rem]:flex md:flex min-[72.75rem]:hidden" : "hidden max-[22.4375rem]:flex"} short />}
    </div>
    <div className="mt-auto pt-5"><span data-skeleton="record-action" className={`${layout.recordAction} skeleton pointer-events-none`}><span className="invisible">{action}</span></span></div>
  </div>;
}

function RecordDetailSkeleton({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  return <div data-skeleton="record-detail" className={layout.panel}>
    <div className="w-24 text-xs"><TextRow /></div>
    <div className="mt-4 text-2xl font-bold leading-snug"><TextRow /><TextRow className="sm:hidden" short />{!isArabic && <TextRow className="hidden max-[22.4375rem]:flex" short />}</div>
    <div className="mt-3 text-sm leading-7"><TextRow /><TextRow className={isArabic ? "sm:hidden" : "min-[72.75rem]:hidden"} short /><TextRow className={isArabic ? "hidden max-[22.4375rem]:flex" : "sm:hidden"} short />{!isArabic && <TextRow className="hidden max-[22.4375rem]:flex" short />}</div>
    <div className="mt-3 text-xs"><TextRow short /><TextRow className={isArabic ? "hidden max-[22.4375rem]:flex" : "sm:hidden"} short /></div>
  </div>;
}

function CommentSkeleton({
  reply = false,
  edited = false,
  withReply = false,
}: {
  reply?: boolean;
  edited?: boolean;
  withReply?: boolean;
}) {
  const content = (
    <>
      <Skeleton
        className={`${reply ? "h-8 w-8" : "h-10 w-10"} shrink-0 rounded-full`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm">
          <div className="w-28 max-w-full">
            <TextRow />
          </div>
        </div>
        <div className="mt-1 w-36 max-w-full text-xs">
          <TextRow />
        </div>
        {edited && (
          <div className="mt-1 w-12 text-xs">
            <TextRow />
          </div>
        )}
        <div className="mt-2 text-sm leading-7">
          <TextRow />
          <TextRow className="min-[72.75rem]:hidden" short />
          <TextRow className="sm:hidden" short />
          {edited && <TextRow className="sm:hidden" short />}
        </div>
        {!reply && (
          <div className="mt-2 flex min-h-8 items-center gap-2">
            <Skeleton className="h-3 w-12" />
            {withReply && <Skeleton className="h-3 w-28" />}
          </div>
        )}
      </div>
    </>
  );
  if (reply)
    return (
      <div data-skeleton="reply" className={layout.replyCard}>
        {content}
      </div>
    );
  return (
    <div data-skeleton="comment" className={layout.commentSpacing}>
      <div className="flex items-start gap-3">{content}</div>
      {withReply && (
        <div className={layout.replyThread}>
          <CommentSkeleton reply />
        </div>
      )}
    </div>
  );
}

export default function DiscussionSkeleton({
  view,
  label,
  locale = "en",
}: {
  view: "list" | "detail";
  label: string;
  locale?: Locale;
}) {
  const t = locale === "ar" ? ar : en;
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {view === "list" ? (
          <div className={layout.recordGrid}>
            <RecordCardSkeleton first action={t.openRecord} locale={locale} />
            <RecordCardSkeleton action={t.openRecord} locale={locale} />
          </div>
        ) : (
          <div className="space-y-6">
            <RecordDetailSkeleton locale={locale} />
            <div data-skeleton="discussion" className={layout.panel}>
              <div className={layout.discussionHeader}>
                <div className="text-lg font-bold">
                  <Label>{t.discussion}</Label>
                </div>
                <div className="w-20 text-xs">
                  <TextRow />
                </div>
              </div>
              <div data-skeleton="composer" className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Textarea
                      className="skeleton pointer-events-none"
                      rows={composerRows}
                      disabled
                      tabIndex={-1}
                    />
                    <div className={layout.composerFooter}>
                      <p className="text-xs text-transparent">
                        <span className="skeleton rounded box-decoration-clone">{t.characterHint}</span>
                        <span className="skeleton ms-2 rounded box-decoration-clone tabular-nums">0/2000</span>
                      </p>
                      <Button
                        className="skeleton pointer-events-none w-full sm:w-auto"
                        disabled
                        tabIndex={-1}
                      >
                        <span className="invisible">{t.postComment}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={layout.divider} />
              <div className="divide-y divide-slate-100">
                <CommentSkeleton edited />
                <CommentSkeleton withReply />
                <CommentSkeleton withReply />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
