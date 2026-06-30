// Shared contracts across the generate → edit → publish flow.

export interface GenerateRequest {
  /** The single content brief the user writes once. */
  brief: string;
  /** Selected platform ids (see lib/platforms.ts). */
  platforms: string[];
}

export interface GenerateResult {
  platform: string;
  content: string;
  /** Hashtags as a separate field (space-separated, each starting with #). */
  hashtags?: string;
  /** Title or subject line (used for newsletters). */
  title?: string;
}

export interface GenerateResponse {
  results: GenerateResult[];
}

export interface ErrorResponse {
  error: string;
}

export type PostStatus =
  | "draft"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

/** An editable, per-platform draft shown in the review dashboard. */
export interface PostDraft {
  platform: string;
  /** Main body: tweet text / post body / caption. */
  text: string;
  /** Optional hashtags (X, Instagram). */
  hashtags: string;
  /** Optional title (Newsletter). */
  title?: string;
  /** Image URLs (required to publish to Instagram). */
  imageUrls: string[];
  status: PostStatus;
  /** Human-readable result after a publish attempt. */
  message?: string;
  /** Simulated/real permalink after a successful publish. */
  url?: string;
  /** Epoch ms the post is scheduled to publish (when status === "scheduled"). */
  scheduledAt?: number;
}

/** Saved per-platform credentials (key/value of credentialFields). */
export type PlatformCredentials = Record<string, string>;

export interface PublishResult {
  ok: boolean;
  message: string;
  url?: string;
}
