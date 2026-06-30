"use client";

import { ShieldCheck } from "lucide-react";

import { ReviewCard } from "@/components/review-card";
import type { GenerateResult } from "@/lib/types";

interface ReviewDashboardProps {
  results: GenerateResult[];
  onChange: (platform: string, content: string) => void;
}

export function ReviewDashboard({ results, onChange }: ReviewDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Review dashboard</h2>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          Review before publishing — nothing is posted automatically
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result) => (
          <ReviewCard
            key={result.platform}
            platformId={result.platform}
            content={result.content}
            onChange={(content) => onChange(result.platform, content)}
          />
        ))}
      </div>
    </div>
  );
}
