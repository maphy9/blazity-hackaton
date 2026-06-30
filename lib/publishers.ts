// Simulated, real-ready publishing layer.
//
// Each platform has a publish() that validates the draft + credentials and
// (for now) simulates the network call. To go real, replace the body of a
// platform's publish() with its actual API call — the rest of the app
// (credentials, drafts, status handling) stays the same.

import { getPlatform } from "@/lib/platforms";
import type { PlatformCredentials, PostDraft, PublishResult } from "@/lib/types";

/** Final composed text that would be sent to the platform. */
export function composePostText(draft: PostDraft): string {
  const tags = draft.hashtags.trim();
  return tags ? `${draft.text.trim()}\n\n${tags}` : draft.text.trim();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fakePermalink(platformId: string): string {
  const id = Math.random().toString(36).slice(2, 12);
  switch (platformId) {
    case "x":
      return `https://x.com/you/status/${id}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/update/urn:li:share:${id}`;
    case "instagram":
      return `https://www.instagram.com/p/${id}/`;
    default:
      return `https://example.com/${id}`;
  }
}

type Publisher = (
  draft: PostDraft,
  creds: PlatformCredentials,
) => Promise<PublishResult>;

const publishers: Record<string, Publisher> = {
  async x(draft) {
    const text = composePostText(draft);
    if (!text) return { ok: false, message: "Tweet text is empty." };
    if (text.length > 280) {
      return { ok: false, message: `Exceeds 280 characters (${text.length}).` };
    }
    await delay(700);
    // Real implementation: POST https://api.twitter.com/2/tweets (OAuth 1.0a).
    return { ok: true, message: "Posted to X.", url: fakePermalink("x") };
  },

  async linkedin(draft) {
    const text = composePostText(draft);
    if (!text) return { ok: false, message: "Post body is empty." };
    await delay(800);
    // Real implementation: POST https://api.linkedin.com/v2/ugcPosts.
    return { ok: true, message: "Posted to LinkedIn.", url: fakePermalink("linkedin") };
  },

  async instagram(draft) {
    if (!draft.text.trim()) return { ok: false, message: "Caption is empty." };
    if (draft.imageUrls.length === 0) {
      return { ok: false, message: "Instagram requires at least one image URL." };
    }
    await delay(900);
    // Real implementation: Graph API media container + publish (Business account).
    return { ok: true, message: "Posted to Instagram.", url: fakePermalink("instagram") };
  },
};

/** Publish a single draft using its saved credentials. */
export async function publishPost(
  draft: PostDraft,
  creds: PlatformCredentials | undefined,
): Promise<PublishResult> {
  const platform = getPlatform(draft.platform);
  if (!platform) return { ok: false, message: "Unknown platform." };

  const missing = platform.credentialFields.filter(
    (f) => !creds?.[f.key]?.trim(),
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Connect ${platform.label} first (missing credentials).`,
    };
  }

  const publisher = publishers[platform.id];
  if (!publisher) return { ok: false, message: "No publisher for this platform." };

  try {
    return await publisher(draft, creds as PlatformCredentials);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Publish failed.",
    };
  }
}
