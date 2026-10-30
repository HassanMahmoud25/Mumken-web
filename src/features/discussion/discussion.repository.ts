import { createDemoRequestSimulator } from "./discussion.demo";
import assessment from "@/data/assessment.json";
import type { Comment, CreateCommentInput, DiscussionData, DiscussionRepository, Locale } from "./discussion.types";

import { MAX_COMMENT_LENGTH } from "./discussion.types";

function parseLocale(value: string): Locale {
  if (value === "en" || value === "ar") return value;
  throw new Error("INVALID_LOCALE");
}

function getInitialData(): DiscussionData {
  return structuredClone({
    ...assessment,
    comments: assessment.comments.map(comment => ({ ...comment, language: parseLocale(comment.language) })),
  });
}

// Each instance owns its session data; no server-global mutable user state.
export function createDiscussionRepository(seed: DiscussionData = getInitialData()): DiscussionRepository {
  const data = structuredClone(seed);
  const simulateRequest = createDemoRequestSimulator();
  const opened = new Set<string>();
  const pending = new Map<string, Promise<void>>();
  return {
    hasLoadedRecord: recordId => opened.has(recordId),
    async loadRecord(recordId: string) {
      if (!data.records.some(record => record.id === recordId)) throw new Error("UNAVAILABLE");
      if (opened.has(recordId)) return;
      let request = pending.get(recordId);
      if (!request) {
        request = simulateRequest("load").then(() => { opened.add(recordId); }).finally(() => { pending.delete(recordId); });
        pending.set(recordId, request);
      }
      await request;
    },
    async loadInitialData() {
      await simulateRequest("initial");
      return structuredClone(data);
    },
    async createComment(input: CreateCommentInput): Promise<Comment> {
      const body = input.body.trim();
      if (!body) throw new Error("EMPTY_COMMENT");
      if (body.length > MAX_COMMENT_LENGTH) throw new Error("COMMENT_TOO_LONG");
      if (!data.records.some(record => record.id === input.recordId)) throw new Error("UNAVAILABLE");
      if (input.authorId !== data.currentUser.id) throw new Error("INVALID_AUTHOR");
      parseLocale(input.language);
      if (input.parentId !== null) {
        const parent = data.comments.find(comment => comment.id === input.parentId);
        if (!parent || parent.recordId !== input.recordId || parent.parentId !== null) {
          throw new Error("INVALID_REPLY_TARGET");
        }
      }
      await simulateRequest("submit");
      const comment: Comment = {
        ...input,
        id: globalThis.crypto.randomUUID(),
        body,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      data.comments.push(comment);
      return structuredClone(comment);
    },
  };
}
