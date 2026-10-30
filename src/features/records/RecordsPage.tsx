"use client";

import { useState } from "react";
import { discussionLayout as layout } from "@/features/discussion/discussion.layout";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import DiscussionState from "@/features/discussion/components/DiscussionState";
import DiscussionList from "@/features/discussion/components/DiscussionList";
import CommentForm from "@/features/discussion/components/CommentForm";
import typography from "@/features/discussion/discussionTypography.module.css";

import { useDiscussion } from "@/features/discussion/DiscussionProvider";
import en from "@/i18n/en.json";
import ar from "@/i18n/ar.json";
import LocalizedTime from "@/components/ui/LocalizedTime";

const translations = { en, ar };

export default function RecordsPage({
  recordId,
  loadingDetail = false,
}: {
  recordId?: string;
  loadingDetail?: boolean;
}) {
  const discussion = useDiscussion(recordId);

  const [replySelection, setReplySelection] = useState<{
    commentId: string;
  } | null>(null);
  const replyToId = replySelection?.commentId ?? null;

  const { locale, data, selectedRecord } = discussion;
  const status = loadingDetail ? "loading" : discussion.status;
  const detailView = Boolean(recordId) || loadingDetail;

  const t = translations[locale];

  const isArabic = locale === "ar";

  const replyComment = data?.comments.find(
    (comment) => comment.id === replyToId,
  );
  const replyTarget =
    replyComment && data
      ? ((replyComment.authorId === data.currentUser.id
          ? data.currentUser
          : data.users.find((user) => user.id === replyComment.authorId)) ?? {
          id: replyComment.authorId,
          name: t.unknownAuthor,
          initials: "?",
        })
      : undefined;

  const pageDirection = isArabic ? "rtl" : "ltr";

  async function handleFormSubmit(body: string) {
    const success = await discussion.addComment(body, replyToId);
    if (success) setReplySelection(null);
    return success;
  }

  const formLabels = {
    commentPlaceholder: t.commentPlaceholder,
    replyPlaceholder: t.replyPlaceholder,
    postComment: t.postComment,
    postReply: t.postReply,
    cancel: t.cancel,
    characterHint: t.characterHint,
    replyingTo: t.replyingTo,
    emptyError: t.emptyError,
    submitError: replyToId ? t.replySubmitError : t.submitError,
    invalidReplyError: t.invalidReplyError,
    submitting: t.submitting,
  };

  const commentLabels = {
    reply: t.reply,
    you: t.you,
    edited: t.edited,
    showReplies: t.showReplies,
    hideReplies: t.hideReplies,
    noComments: t.noComments,
    beFirst: t.beFirst,
    unknownAuthor: t.unknownAuthor,
  };

  return (
    <div
      dir={pageDirection}
      lang={locale}
      className="min-h-screen bg-(--color-canvas) text-slate-900"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-s-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3"
      >
        {t.skipToContent}
      </a>
      <header className="border-b border-slate-200 bg-(--color-brand)">
        <div className="mx-auto flex min-h-18 w-full max-w-291 items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/records" className="inline-flex shrink-0 items-center">
            <Image
              src="/mumken-logo.svg"
              alt={t.appName}
              width={117}
              height={38}
              loading="eager"
              unoptimized
            />
          </Link>

          <div className="flex items-center gap-3 sm:gap-7">
            <p className="hidden text-sm text-white sm:block">
              {t.researchWorkspace}
            </p>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={discussion.toggleLocale}
            >
              <span aria-hidden="true">文A</span>
              {t.language}
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        aria-busy={status === "loading"}
        className="mx-auto w-full max-w-291 px-4 py-6 sm:px-8 sm:py-12 lg:py-16"
      >
        <div className="mb-6 max-w-275">
          {detailView ? (
            <nav
              aria-label={t.recordDetails}
              className="text-md text-slate-500"
            >
              <Link
                href="/records"
                className="underline-offset-4 hover:underline"
              >
                {t.backToUpdates}
              </Link>
              <span aria-hidden="true"> / </span>
              <span>{recordId}</span>
            </nav>
          ) : (
            <h1 className="text-2xl font-bold">{t.records}</h1>
          )}
        </div>

        {status === "loading" && (
          <DiscussionState
            kind="loading"
            loadingView={detailView ? "detail" : "list"}
            locale={locale}
            loadingText={t.loading}
            errorText={t.loadError}
            unavailableTitle={t.unavailableTitle}
            unavailableText={t.unavailableDescription}
            retryText={t.retry}
          />
        )}

        {status === "error" && (
          <DiscussionState
            kind="error"
            loadingText={t.loading}
            errorText={t.loadError}
            unavailableTitle={t.unavailableTitle}
            unavailableText={t.unavailableDescription}
            retryText={t.retry}
            onRetry={() => void discussion.retryLoad()}
          />
        )}

        {status === "success" && data && (
          <div>
            {!recordId ? (
              <section aria-label={t.records} className={layout.recordGrid}>
                {data.records.length === 0 && (
                  <p role="status">{t.noRecords}</p>
                )}
                {data.records.map((record) => (
                  <article key={record.id} className={`${layout.recordCard} ${typography.record}`}>
                    <p className="text-sm text-slate-500">
                      {record.source} ·{" "}
                      <LocalizedTime
                        dateTime={record.publishedAt}
                        locale={locale}
                      />
                    </p>
                    <h2
                      id={`record-title-${record.id}`}
                      className="mt-4 text-xl font-bold"
                    >
                      {record.title[locale]}
                    </h2>
                    <p className="mt-3 leading-7 text-slate-600">
                      {record.summary[locale]}
                    </p>
                    <div className="mt-auto pt-5">
                      <Link
                        href={`/records/${record.id}`}
                        aria-describedby={`record-title-${record.id}`}
                        className={layout.recordAction}
                      >
                        {t.openRecord}
                        <Icon
                          name="chevronRight"
                          width={18}
                          height={18}
                          strokeWidth={2}
                          className="ms-2 rtl:-scale-x-100"
                        />
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <section className="max-w-275 min-w-0 space-y-6">
                {!selectedRecord && (
                  <h1 className="sr-only">{t.recordDetails}</h1>
                )}

                {!selectedRecord ? (
                  <DiscussionState
                    kind="unavailable"
                    loadingText={t.loading}
                    errorText={t.loadError}
                    unavailableTitle={t.unavailableTitle}
                    unavailableText={t.unavailableDescription}
                    retryText={t.retry}
                  />
                ) : (
                  <>
                    <article className={`${layout.panel} ${typography.record}`}>
                      <p className="text-xs text-slate-500">
                        {selectedRecord.id}
                      </p>
                      <h1 className="mt-4 text-2xl font-bold leading-snug text-slate-950">
                        {selectedRecord.title[locale]}
                      </h1>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {selectedRecord.summary[locale]}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        {t.source}: {selectedRecord.source} · {t.published}:{" "}
                        <LocalizedTime
                          dateTime={selectedRecord.publishedAt}
                          locale={locale}
                        />
                      </p>
                    </article>

                    <section
                      className={`${layout.panel} ${typography.discussion}`}
                    >
                      <div className={layout.discussionHeader}>
                        <h2 className="text-lg font-bold text-slate-950">
                          {t.discussion}
                        </h2>
                        <p
                          aria-live="polite"
                          className="text-xs text-slate-500"
                        >
                          {discussion.commentsForRecord.length} {t.comments}
                        </p>
                      </div>

                      {discussion.currentUser ? (
                        <CommentForm
                          key={discussion.selectedRecordId}
                          replyingTo={replyTarget}
                          replySelection={replySelection}
                          submitting={discussion.submitting}
                          submitError={discussion.submitError}
                          labels={formLabels}
                          onSubmit={handleFormSubmit}
                          onCancelReply={() => setReplySelection(null)}
                          onClearError={discussion.clearSubmitError}
                        />
                      ) : (
                        <div className="text-sm text-slate-500">
                          {t.unavailableDescription}
                        </div>
                      )}
                      <div className={layout.divider} />
                      <DiscussionList
                        submitting={discussion.submitting}
                        comments={discussion.commentsForRecord}
                        users={[
                          ...data.users.filter(
                            (user) => user.id !== data.currentUser.id,
                          ),
                          data.currentUser,
                        ]}
                        locale={locale}
                        currentUserId={discussion.currentUser?.id ?? ""}
                        labels={commentLabels}
                        onReply={(commentId) => {
                          if (!discussion.submitting)
                            setReplySelection({ commentId });
                        }}
                      />
                    </section>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
