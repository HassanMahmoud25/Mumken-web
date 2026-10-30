export const MAX_COMMENT_LENGTH = 2000;

export type Locale = "en" | "ar";

export interface User {
  id: string;
  name: string;
  initials: string;
}

export interface RecordItem {
  id: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  source: string;
  publishedAt: string;
}

export interface Comment {
  id: string;
  recordId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  language: Locale;
  createdAt: string;
  updatedAt: string | null;
}

export interface DiscussionData {
  currentUser: User;
  users: User[];
  records: RecordItem[];
  comments: Comment[];
}

export interface CreateCommentInput {
  recordId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  language: Locale;
}

export type DiscussionStatus = "loading" | "success" | "error" | "unavailable";

export interface DiscussionRepository {
  hasLoadedRecord: (recordId: string) => boolean;
  loadRecord: (recordId: string) => Promise<void>;
  loadInitialData: () => Promise<DiscussionData>;
  createComment: (input: CreateCommentInput) => Promise<Comment>;
}
