// Shared request/response contracts for the "One Idea, Every Format" generate flow.

export interface GenerateRequest {
  /** The single content brief the user writes once. */
  brief: string;
  /** Selected platform ids (see lib/platforms.ts). */
  platforms: string[];
}

export interface GenerateResult {
  /** Platform id this content was adapted for. */
  platform: string;
  /** The platform-tailored post copy. */
  content: string;
}

export interface GenerateResponse {
  results: GenerateResult[];
}

export interface ErrorResponse {
  error: string;
}
