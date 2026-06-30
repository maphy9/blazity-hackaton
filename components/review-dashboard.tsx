"use client";

import { Send, ShieldCheck } from "lucide-react";

import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { isConnected, type CredentialsMap } from "@/lib/credentials";
import type { PostDraft } from "@/lib/types";

interface ReviewDashboardProps {
  drafts: PostDraft[];
  credentials: CredentialsMap;
  onChange: (platform: string, patch: Partial<PostDraft>) => void;
  onPublishOne: (platform: string) => void;
  onScheduleOne: (platform: string, whenMs: number) => void;
  onCancelSchedule: (platform: string) => void;
  onPublishApproved: () => void;
  onConnect: () => void;
}

export function ReviewDashboard({
  drafts,
  credentials,
  onChange,
  onPublishOne,
  onScheduleOne,
  onCancelSchedule,
  onPublishApproved,
  onConnect,
}: ReviewDashboardProps) {
  const approvedReady = drafts.filter(
    (d) => d.status === "approved" && isConnected(d.platform, credentials[d.platform]),
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Review &amp; publish</h2>
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            Approve each post — nothing publishes until you post or schedule it.
          </span>
        </div>
        <Button
          onClick={onPublishApproved}
          disabled={approvedReady === 0}
          className="gap-1.5"
        >
          <Send className="size-4" />
          Publish approved{approvedReady > 0 ? ` (${approvedReady})` : ""}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {drafts.map((draft) => (
          <PostCard
            key={draft.platform}
            draft={draft}
            connected={isConnected(draft.platform, credentials[draft.platform])}
            onChange={(patch) => onChange(draft.platform, patch)}
            onPublish={() => onPublishOne(draft.platform)}
            onSchedule={(whenMs) => onScheduleOne(draft.platform, whenMs)}
            onCancelSchedule={() => onCancelSchedule(draft.platform)}
            onConnect={onConnect}
          />
        ))}
      </div>
    </div>
  );
}
