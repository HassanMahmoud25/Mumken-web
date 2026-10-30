"use client";

import { discussionLayout, composerRows } from "../discussion.layout";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { MAX_COMMENT_LENGTH } from "../discussion.types";
import type { User } from "../discussion.types";

interface CommentFormProps {
  replyingTo?: User;
  replySelection?: { commentId: string } | null;
  submitting: boolean;
  submitError: string | null;
  labels: {
    commentPlaceholder: string;
    replyPlaceholder: string;
    postComment: string;
    postReply: string;
    cancel: string;
    characterHint: string;
    replyingTo: string;
    emptyError: string;
    submitError: string;
    invalidReplyError: string;
    submitting: string;
  };
  onSubmit: (body: string) => Promise<boolean>;
  onCancelReply?: () => void;
  onClearError: () => void;
}

const MAX_LENGTH = MAX_COMMENT_LENGTH;

export default function CommentForm({
  replyingTo,
  replySelection,
  submitting,
  submitError,
  labels,
  onSubmit,
  onCancelReply,
  onClearError,
}: CommentFormProps) {
  const errorId = useId();
  const replyContextId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // A new selection (including the same target again) scrolls after rendering.
  useEffect(() => {
    if (!replySelection?.commentId) return;
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    formRef.current?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "center",
    });
    textareaRef.current?.focus({ preventScroll: true });
  }, [replySelection]);
  const pending = useRef(false);
  const [body, setBody] = useState("");
  const [validationError, setValidationError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending.current || submitting) return;
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setValidationError(true);
      return;
    }

    setValidationError(false);

    pending.current = true;
    let succeeded = false;
    try {
      succeeded = await onSubmit(trimmedBody);
    } finally {
      pending.current = false;
    }

    if (succeeded) {
      setBody("");
      setValidationError(false);
    }
  }

  const errorMessage =
    validationError || submitError === "EMPTY_COMMENT"
      ? labels.emptyError
      : submitError === "INVALID_REPLY_TARGET"
        ? labels.invalidReplyError
        : submitError
          ? labels.submitError
          : null;

  return (
    <form
      ref={formRef}
      aria-describedby={replyingTo ? replyContextId : undefined}
      aria-label={replyingTo ? labels.postReply : labels.postComment}
      onSubmit={handleSubmit}
      aria-busy={submitting}
      className="min-w-0"
    >
      {replyingTo && (
        <div
          id={replyContextId}
          role="status"
          className="mb-3 flex items-center justify-between gap-1.5 rounded-lg bg-slate-100 px-5 py-1 text-sm"
        >
          <span className="text-slate-600">
            {labels.replyingTo}{" "}
            <strong className="text-slate-900"><bdi dir="auto">{replyingTo.name}</bdi></strong>
          </span>
          <Button
            variant="ghost"
            className="min-h-8 px-2 py-1 text-xs"
            onClick={() => {
              onCancelReply?.();
              textareaRef.current?.focus({ preventScroll: true });
            }}
            type="button"
            disabled={submitting}
          >
            {labels.cancel}
          </Button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(event) => {
              setBody(event.target.value.slice(0, MAX_LENGTH));
              setValidationError(false);
              if (submitError) onClearError();
            }}
            placeholder={
              replyingTo ? labels.replyPlaceholder : labels.commentPlaceholder
            }
            aria-label={
              replyingTo ? labels.replyPlaceholder : labels.commentPlaceholder
            }
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? errorId : undefined}
            maxLength={MAX_LENGTH}
            disabled={submitting}
            data-arabic={/\p{Script=Arabic}/u.test(body || (replyingTo ? labels.replyPlaceholder : labels.commentPlaceholder))}
            dir={body ? "auto" : undefined}
            rows={composerRows}
          />

          <div className={discussionLayout.composerFooter}>
            <p className="text-xs text-slate-500">
              {labels.characterHint}
              <span className="ms-2 tabular-nums">
                {body.length}/{MAX_LENGTH}
              </span>
            </p>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner />
                  {labels.submitting}
                </>
              ) : replyingTo ? (
                labels.postReply
              ) : (
                labels.postComment
              )}
            </Button>
          </div>

          <span role="status" className="sr-only">
            {submitting ? labels.submitting : ""}
          </span>
          {errorMessage && (
            <p id={errorId} role="alert" className="mt-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
