"use client";

import { CheckCircle2, Clock, History, Loader2 } from "lucide-react";

import { getPlatform } from "@/lib/platforms";
import type { GenerationRecord } from "@/lib/history";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  records: GenerationRecord[];
  loading: boolean;
  configured: boolean;
  activeId: string | null;
  onSelect: (record: GenerationRecord) => void;
  hideHeader?: boolean;
}

function relativeTime(ms: number | null): string {
  if (!ms) return "just now";
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function HistoryPanel({
  records,
  loading,
  configured,
  activeId,
  onSelect,
  hideHeader,
}: HistoryPanelProps) {
  return (
    <div className="space-y-3">
      {!hideHeader && (
        <div className="flex items-center gap-2">
          <History className="text-muted-foreground size-4" />
          <h2 className="text-sm font-semibold">History</h2>
          {loading && (
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
          )}
        </div>
      )}

      {!configured ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Add your Firebase config to <code>.env.local</code> to save and reload
          past generations.
        </p>
      ) : records.length === 0 && !loading ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          No saved generations yet. Your results will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {records.map((record) => {
            const states = record.postStates ?? {};
            const publishedCount = Object.values(states).filter(
              (s) => s.status === "published",
            ).length;
            const scheduledCount = Object.values(states).filter(
              (s) => s.status === "scheduled",
            ).length;
            return (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => onSelect(record)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                    "hover:border-foreground/30 hover:bg-card",
                    activeId === record.id
                      ? "border-primary/60 bg-card"
                      : "border-border bg-card/30",
                  )}
                >
                  <p className="line-clamp-2 text-sm">{record.brief}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <div className="flex -space-x-1">
                      {record.platforms.map((id) => {
                        const p = getPlatform(id);
                        if (!p) return null;
                        const st = states[id]?.status;
                        return (
                          <span
                            key={id}
                            title={
                              st === "published"
                                ? `${p.label} · published`
                                : st === "scheduled"
                                  ? `${p.label} · scheduled`
                                  : p.label
                            }
                            className={cn(
                              "flex size-4 items-center justify-center rounded-[5px] text-[9px] font-bold text-white ring-1",
                              st === "published"
                                ? "ring-emerald-400"
                                : st === "scheduled"
                                  ? "ring-amber-400"
                                  : "ring-black/30",
                            )}
                            style={{ backgroundColor: p.accent }}
                          >
                            {p.icon}
                          </span>
                        );
                      })}
                    </div>

                    {publishedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="size-3" /> {publishedCount} posted
                      </span>
                    )}
                    {scheduledCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                        <Clock className="size-3" /> {scheduledCount} scheduled
                      </span>
                    )}

                    <span className="text-muted-foreground ml-auto text-[11px]">
                      {relativeTime(record.createdAt)}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
