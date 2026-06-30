"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getPlatform } from "@/lib/platforms";

interface ReviewCardProps {
  platformId: string;
  content: string;
  onChange: (content: string) => void;
}

export function ReviewCard({ platformId, content, onChange }: ReviewCardProps) {
  const platform = getPlatform(platformId);
  const label = platform?.label ?? platformId;
  const accent = platform?.accent ?? "var(--primary)";
  const charLimit = platform?.charLimit;
  const overLimit = charLimit !== undefined && content.length > charLimit;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore.
    }
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
        <span className="font-semibold">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground ml-auto h-8 gap-1.5 px-2"
        >
          {copied ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </Button>
      </div>
      <div className="space-y-2 px-4 pb-4">
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          aria-label={`${label} content`}
          className="bg-background/40 resize-y leading-relaxed"
        />
        {charLimit !== undefined && (
          <p
            className={
              overLimit
                ? "text-destructive text-right text-xs font-semibold"
                : "text-muted-foreground text-right text-xs"
            }
          >
            {content.length} / {charLimit}
          </p>
        )}
      </div>
    </Card>
  );
}
