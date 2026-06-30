// Single source of truth for target platforms.
// Drives platform pills, the generation prompt, per-platform edit forms,
// the connections (credentials) UI, and the (simulated) publishers.

export interface CredentialField {
  key: string;
  label: string;
  placeholder?: string;
  /** Rendered as a password input when true (default true — these are secrets). */
  secret?: boolean;
}

export interface Platform {
  id: string;
  label: string;
  /** Short emoji/glyph shown on pills and cards. */
  icon: string;
  /** Accent color (hex) used for the card edge and selected pill. */
  accent: string;
  /** Guidance injected into the prompt describing this platform's conventions. */
  guideline: string;
  /** Optional soft character limit surfaced in the editor. */
  charLimit?: number;
  /** Credential fields the user saves to "connect" this platform. */
  credentialFields: CredentialField[];
  /** Whether this platform requires an image to publish. */
  requiresImage?: boolean;
}

export const PLATFORMS: Platform[] = [
  {
    id: "x",
    label: "X (Twitter)",
    icon: "𝕏",
    accent: "#38bdf8",
    guideline:
      "Max 280 characters. Punchy and conversational. Include 1-2 relevant hashtags.",
    charLimit: 280,
    credentialFields: [
      { key: "apiKey", label: "API Key" },
      { key: "apiKeySecret", label: "API Key Secret" },
      { key: "accessToken", label: "Access Token" },
      { key: "accessTokenSecret", label: "Access Token Secret" },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "in",
    accent: "#0a66c2",
    guideline:
      "Professional tone. Use generous spacing with one-sentence paragraphs. Open with a strong hook and end with a question to invite discussion.",
    credentialFields: [
      { key: "accessToken", label: "Access Token" },
      { key: "authorUrn", label: "Author URN", placeholder: "urn:li:person:XXXX", secret: false },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "◎",
    accent: "#e1306c",
    guideline:
      "Visual, engaging language with tasteful emojis. End with a clear call to action such as \"Link in bio\".",
    requiresImage: true,
    credentialFields: [
      { key: "accessToken", label: "Access Token" },
      { key: "igUserId", label: "IG User ID", placeholder: "17841400000000000", secret: false },
    ],
  },
];

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function getPlatform(id: string): Platform | undefined {
  return PLATFORM_BY_ID.get(id);
}
