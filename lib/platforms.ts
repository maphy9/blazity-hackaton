// Single source of truth for target platforms.
// Drives the platform pills, the prompt sent to Claude, and the review cards.
// To add a future channel (e.g. an image or video generator), add an entry here.

export interface Platform {
  /** Stable id used in requests and responses. */
  id: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Short emoji/glyph shown on pills and cards. */
  icon: string;
  /** Accent color (hex) used for the card edge and selected pill. */
  accent: string;
  /** Guidance injected into the prompt describing this platform's conventions. */
  guideline: string;
  /** Optional soft character limit surfaced in the review card. */
  charLimit?: number;
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
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "in",
    accent: "#0a66c2",
    guideline:
      "Professional tone. Use generous spacing with one-sentence paragraphs. Open with a strong hook and end with a question to invite discussion.",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "◎",
    accent: "#e1306c",
    guideline:
      "Visual, engaging language with tasteful emojis. End with a clear call to action such as \"Link in bio\".",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    icon: "✉",
    accent: "#f59e0b",
    guideline: "2-3 short paragraphs in a welcoming, conversational tone.",
  },
];

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function getPlatform(id: string): Platform | undefined {
  return PLATFORM_BY_ID.get(id);
}
