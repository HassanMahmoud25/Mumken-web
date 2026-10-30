"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useDiscussionState } from "./hooks/useDiscussion";
import { getRecordById, getRecordComments } from "./discussion.utils";
import type { DiscussionRepository } from "./discussion.types";

const DiscussionContext = createContext<ReturnType<
  typeof useDiscussionState
> | null>(null);

// The layout owns the session; route transitions do not reload the seed or locale.
export function DiscussionProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: DiscussionRepository;
}) {
  const discussion = useDiscussionState(repository);
  return (
    <DiscussionContext.Provider value={discussion}>
      {children}
    </DiscussionContext.Provider>
  );
}

export function useDiscussion(recordId = "") {
  const session = useContext(DiscussionContext);
  if (!session) throw new Error("DiscussionProvider is required");
  const [recordLoad, setRecordLoad] = useState<{
    id: string;
    status: "success" | "error";
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!recordId || session.status !== "success") return;
    let cancelled = false;
    session.repository.loadRecord(recordId).then(
      () => {
        if (!cancelled) setRecordLoad({ id: recordId, status: "success" });
      },
      () => {
        if (!cancelled) setRecordLoad({ id: recordId, status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [recordId, session.status, session.repository, attempt]);
  const selectedRecord = session.data
    ? getRecordById(session.data.records, recordId)
    : undefined;
  return {
    ...session,
    status:
      session.status === "success" && selectedRecord
        ? session.repository.hasLoadedRecord(recordId)
          ? "success"
          : recordLoad?.id === recordId
            ? recordLoad.status
            : "loading"
        : session.status,
    retryLoad: () => {
      if (session.status === "error") return session.retryLoad();
      setRecordLoad(null);
      setAttempt((value) => value + 1);
    },
    submitError:
      session.submitRecordId === recordId ? session.submitError : null,
    selectedRecordId: recordId,
    selectedRecord: session.data
      ? getRecordById(session.data.records, recordId)
      : undefined,
    commentsForRecord: session.data
      ? getRecordComments(session.data.comments, recordId)
      : [],
    addComment: (body: string, parentId: string | null) =>
      session.addComment(recordId, body, parentId),
  };
}
