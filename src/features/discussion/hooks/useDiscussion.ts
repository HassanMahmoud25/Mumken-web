"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDiscussionRepository } from "../discussion.repository";
import type {
  DiscussionData,
  DiscussionRepository,
  Locale,
} from "../discussion.types";
import { getRecordById } from "../discussion.utils";

export function useDiscussionState(
  suppliedRepository?: DiscussionRepository,
) {
  const [repository] = useState(() => suppliedRepository ?? createDiscussionRepository());
  const [data, setData] = useState<DiscussionData | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [submitting, setSubmitting] = useState(false);
  const [submitRecordId, setSubmitRecordId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const loadVersion = useRef(0);

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem("mumken-locale");
      if (savedLocale === "en" || savedLocale === "ar") {
        queueMicrotask(() => setLocale(savedLocale));
      }
    } catch {
      // Language selection still works when browser storage is unavailable.
    }
  }, []);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setStatus("loading");

    try {
      const result = await repository.loadInitialData();
      if (version !== loadVersion.current) return;
      setData(result);
      setStatus("success");

    } catch {
      if (version !== loadVersion.current) return;
      setStatus("error");
    }
  }, [repository]);

  useEffect(() => {
    let cancelled = false;
    const versionRef = loadVersion;

    queueMicrotask(() => {
      if (!cancelled) {
        void load();
      }
    });

    return () => {
      cancelled = true;
      versionRef.current++;
    };
  }, [load]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const currentUser = data?.currentUser;

  const addComment = useCallback(
    async (recordId: string, body: string, parentId: string | null) => {
      if (submittingRef.current) return false;
      setSubmitRecordId(recordId);
      const selectedRecord = data && getRecordById(data.records, recordId);
      if (!data || !currentUser || !selectedRecord) {
        setSubmitError("UNAVAILABLE");
        return false;
      }

      const trimmedBody = body.trim();

      if (!trimmedBody) {
        setSubmitError("EMPTY_COMMENT");
        return false;
      }

      // Replies are allowed only to top-level comments.
      if (parentId !== null) {
        const parent = data.comments.find((comment) => comment.id === parentId);

        if (
          !parent ||
          parent.recordId !== selectedRecord.id ||
          parent.parentId !== null
        ) {
          setSubmitError("INVALID_REPLY_TARGET");
          return false;
        }
      }

      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError(null);

      try {
        const comment = await repository.createComment({
          recordId: selectedRecord.id,
          parentId,
          authorId: currentUser.id,
          body: trimmedBody,
          language: locale,
        });

        setData((previous) =>
          previous
            ? {
                ...previous,
                comments: [...previous.comments, comment],
              }
            : previous,
        );

        return true;
      } catch {
        setSubmitError("SUBMIT_FAILED");
        return false;
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [currentUser, data, locale, repository],
  );

  const toggleLocale = useCallback(() => {
    const nextLocale = locale === "en" ? "ar" : "en";
    setLocale(nextLocale);
    try {
      localStorage.setItem("mumken-locale", nextLocale);
    } catch {
      // Keep the selected language for this visit if persistence is blocked.
    }
  }, [locale]);

  return {
    data,
    repository,
    status,
    retryLoad: load,
    locale,
    toggleLocale,
    currentUser,
    submitting,
    submitError,
    submitRecordId,
    clearSubmitError: () => setSubmitError(null),
    addComment,
  };
}
