"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Send,
  X,
} from "lucide-react";

import { PostForm } from "@/components/post-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlatform } from "@/lib/platforms";
import { composePostText } from "@/lib/publishers";
import type { PostDraft } from "@/lib/types";

interface PostCardProps {
  draft: PostDraft;
  connected: boolean;
  onChange: (patch: Partial<PostDraft>) => void;
  onPublish: () => void;
  onSchedule: (whenMs: number) => void;
  onCancelSchedule: () => void;
  onConnect: () => void;
}

/** Local datetime value (YYYY-MM-DDTHH:mm) one hour from now, for the min/default. */
function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function StatusBadge({ draft }: { draft: PostDraft }) {
  switch (draft.status) {
    case "published":
      return (
        <Badge className="gap-1 bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="size-3" /> Published
        </Badge>
      );
    case "scheduled":
      return (
        <Badge className="gap-1 bg-amber-500/15 text-amber-400">
          <Clock className="size-3" /> Scheduled
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-destructive/15 text-destructive gap-1">
          <AlertCircle className="size-3" /> Failed
        </Badge>
      );
    case "publishing":
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="size-3 animate-spin" /> Publishing
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-primary/20 text-primary gap-1">
          <Check className="size-3" /> Approved
        </Badge>
      );
    default:
      return null;
  }
}

export function PostCard({
  draft,
  connected,
  onChange,
  onPublish,
  onSchedule,
  onCancelSchedule,
  onConnect,
}: PostCardProps) {
  const platform = getPlatform(draft.platform);
  const accent = platform?.accent ?? "var(--primary)";
  const [copied, setCopied] = useState(false);
  const [when, setWhen] = useState(defaultScheduleValue);

  const busy = draft.status === "publishing";
  const published = draft.status === "published";
  const scheduled = draft.status === "scheduled";
  const locked = busy || published; // editing/approval locked once publishing or done
  const canAct = connected && draft.status === "approved";

  async function copy() {
    try {
      await navigator.clipboard.writeText(composePostText(draft));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleSchedule() {
    const ms = new Date(when).getTime();
    if (Number.isNaN(ms)) return;
    onSchedule(ms);
  }

  return (
    <Card
      className="bg-card/60 gap-0 overflow-hidden border-t-2 py-0 backdrop-blur"
      style={{ borderTopColor: accent }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {platform?.icon ?? "•"}
        </span>
        <span className="font-semibold">{platform?.label ?? draft.platform}</span>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge draft={draft} />
          <Button
            variant="ghost"
            size="sm"
            onClick={copy}
            className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="px-4">
        <PostForm draft={draft} onChange={onChange} disabled={locked || scheduled} />
      </div>

      <div className="border-border/60 mt-4 space-y-3 border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`approve-${draft.platform}`}
              checked={draft.status === "approved" || scheduled || published}
              disabled={locked || scheduled}
              onCheckedChange={(checked) =>
                onChange({ status: checked ? "approved" : "draft" })
              }
            />
            <Label htmlFor={`approve-${draft.platform}`} className="text-sm font-normal">
              Approve
            </Label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!connected ? (
              <Button variant="outline" size="sm" onClick={onConnect}>
                Connect to publish
              </Button>
            ) : published && draft.url ? (
              <a
                href={draft.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                View post <ExternalLink className="size-3.5" />
              </a>
            ) : scheduled ? (
              <Button variant="outline" size="sm" onClick={onCancelSchedule} className="gap-1.5">
                <X className="size-3.5" /> Cancel
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onPublish}
                disabled={!canAct || busy}
                className="gap-1.5"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Post now
              </Button>
            )}
          </div>
        </div>

        {/* Scheduling row — only when actionable */}
        {connected && !published && (
          scheduled ? (
            <p className="text-amber-400/90 inline-flex items-center gap-1.5 text-xs">
              <Clock className="size-3.5" />
              Scheduled for{" "}
              {draft.scheduledAt ? new Date(draft.scheduledAt).toLocaleString() : "—"}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="datetime-local"
                value={when}
                min={defaultScheduleValue()}
                onChange={(e) => setWhen(e.target.value)}
                disabled={!canAct}
                className="h-8 w-auto text-xs"
                aria-label="Schedule time"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSchedule}
                disabled={!canAct}
                className="gap-1.5"
              >
                <Clock className="size-3.5" /> Schedule
              </Button>
            </div>
          )
        )}
      </div>

      {draft.status === "failed" && draft.message && (
        <p className="text-destructive px-4 pb-3 text-xs">{draft.message}</p>
      )}
    </Card>
  );
}
