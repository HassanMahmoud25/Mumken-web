"use client";

import { discussionLayout } from "../discussion.layout";

import type { Comment, Locale, User } from "../discussion.types";
import { getReplies, getRootComments } from "../discussion.utils";
import CommentItem from "./CommentItem";

interface DiscussionListProps {
  comments: Comment[];
  users: User[];
  locale: Locale;
  currentUserId: string;
  labels: {
    reply: string;
    you: string;
    edited: string;
    showReplies: string;
    hideReplies: string;
    unknownAuthor: string;
    noComments: string;
    beFirst: string;
  };
  onReply: (commentId: string) => void;
  submitting?: boolean;
}

export default function DiscussionList({
  comments,
  users,
  locale,
  currentUserId,
  labels,
  onReply,
  submitting = false,
}: DiscussionListProps) {
  const rootComments = getRootComments(comments);

  if (rootComments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-[#f7f9f9] px-6 py-10 text-center">
        <h3 className="mt-4 font-semibold text-slate-900">
          {labels.noComments}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{labels.beFirst}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {rootComments.map((comment) => {
        const author = users.find((user) => user.id === comment.authorId) ?? { id: comment.authorId, name: labels.unknownAuthor, initials: "?" };

        return (
          <div key={comment.id} className={discussionLayout.commentSpacing}>
            <CommentItem
              comment={comment}
              author={author}
              replies={getReplies(comments, comment.id)}
              users={users}
              locale={locale}
              currentUserId={currentUserId}
              labels={labels}
              onReply={onReply}
              submitting={submitting}
            />
          </div>
        );
      })}
    </div>
  );
}
