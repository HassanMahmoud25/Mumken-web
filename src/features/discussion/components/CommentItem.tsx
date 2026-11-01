"use client";

import { discussionLayout } from "../discussion.layout";

import { useId, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import type { Comment, Locale, User } from "../discussion.types";
import LocalizedTime from "@/components/ui/LocalizedTime";
import styles from "./CommentItem.module.css";
import typography from "../discussionTypography.module.css";

interface CommentItemProps {
  comment: Comment;
  author: User;
  replies: Comment[];
  users: User[];
  locale: Locale;
  labels: {
    reply: string;
    you: string;
    edited: string;
    showReplies: string;
    hideReplies: string;
    unknownAuthor: string;
  };
  currentUserId: string;
  onReply: (commentId: string) => void;
  submitting?: boolean;
}

export default function CommentItem({
  comment,
  author,
  replies,
  users,
  locale,
  labels,
  currentUserId,
  onReply,
  submitting = false,
}: CommentItemProps) {
  const threadId = useId();
  const authorId = useId();
  const [hiddenReplyCount, setHiddenReplyCount] = useState<number | null>(null);
  // A newly inserted reply reveals its thread, even if it was previously collapsed.
  const repliesVisible = hiddenReplyCount !== replies.length;

  return (
    <article aria-labelledby={authorId} data-comment-id={comment.id} className="discussion-enter min-w-0">
      <div className="flex items-start gap-3">
        <Avatar initials={author.initials} name={author.name} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <bdi id={authorId} dir="auto" data-arabic={/\p{Script=Arabic}/u.test(author.name)} className={`${typography.author} text-sm font-semibold text-slate-900`}>
              {author.name}
            </bdi>

            {author.id === currentUserId && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                {labels.you}
              </span>
            )}

            <LocalizedTime
              locale={locale}
              dateTime={comment.createdAt}
              className="basis-full text-xs text-slate-500"
            />

            {comment.updatedAt && (
              <span className="text-xs text-slate-500">· {labels.edited}</span>
            )}
          </div>

          <p
            dir="auto"
            data-arabic={/\p{Script=Arabic}/u.test(comment.body)}
            className={`${typography.body} mt-2 whitespace-pre-wrap wrap-break-word text-sm sm:text-md leading-7 text-slate-700`}
          >
            {comment.body}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {comment.parentId === null && (
              <Button
                variant="ghost"
                aria-label={`${labels.reply} — ${author.name}`}
                className="min-h-8 px-2 py-1 text-xs"
                disabled={submitting}
                onClick={() => {
                  setHiddenReplyCount(null);
                  onReply(comment.id);
                }}
              >
                <Icon name="reply" className="rtl:-scale-x-100" />
                {labels.reply}
              </Button>
            )}

            {replies.length > 0 && (
              <Button
                variant="ghost"
                className="min-h-8 px-2 py-1 text-xs"
                aria-expanded={repliesVisible}
                aria-controls={threadId}
                onClick={() =>
                  setHiddenReplyCount(repliesVisible ? replies.length : null)
                }
              >
                <Icon name={repliesVisible ? "chevronUp" : "chevronDown"} />
                {repliesVisible ? labels.hideReplies : labels.showReplies} (
                {replies.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div
          id={threadId}
          className={styles.thread}
          data-expanded={repliesVisible}
          inert={!repliesVisible}
          aria-hidden={!repliesVisible}
        >
          <div className={styles.content}>
            <div className={discussionLayout.replyThread}>
              {replies.map((reply) => {
                const replyAuthor = users.find(
                  (user) => user.id === reply.authorId,
                ) ?? {
                  id: reply.authorId,
                  name: labels.unknownAuthor,
                  initials: "?",
                };

                return (
                  <div
                    key={reply.id}
                    data-comment-id={reply.id}
                    role="article"
                    aria-label={replyAuthor.name}
                    className={`${discussionLayout.replyCard} discussion-enter`}
                  >
                    <Avatar
                      initials={replyAuthor.initials}
                      name={replyAuthor.name}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <bdi dir="auto" data-arabic={/\p{Script=Arabic}/u.test(replyAuthor.name)} className={`${typography.author} text-sm font-semibold text-slate-900`}>
                          {replyAuthor.name}
                        </bdi>

                        {replyAuthor.id === currentUserId && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                            {labels.you}
                          </span>
                        )}

                        <LocalizedTime
                          locale={locale}
                          dateTime={reply.createdAt}
                          className="basis-full text-xs text-slate-500"
                        />
                        {reply.updatedAt && (
                          <span className="text-xs text-slate-500">
                            · {labels.edited}
                          </span>
                        )}
                      </div>

                      <p
                        dir="auto"
                        data-arabic={/\p{Script=Arabic}/u.test(reply.body)}
                        className={`${typography.body} mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700`}
                      >
                        {reply.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
