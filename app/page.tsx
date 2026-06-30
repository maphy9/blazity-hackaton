"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { BriefForm } from "@/components/brief-form";
import { HistoryPanel } from "@/components/history-panel";
import { PlatformSelector } from "@/components/platform-selector";
import { ReviewDashboard } from "@/components/review-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isFirebaseConfigured,
  loadHistory,
  saveGeneration,
  type GenerationRecord,
} from "@/lib/history";
import type { ErrorResponse, GenerateResponse, GenerateResult } from "@/lib/types";

export default function Home() {
  const [brief, setBrief] = useState("");
  const [selected, setSelected] = useState<string[]>(["x", "linkedin"]);
  const [results, setResults] = useState<GenerateResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const canSubmit = brief.trim().length > 0 && selected.length > 0 && !loading;

  // Used by event handlers after a successful save. Always runs: localStorage
  // history works even when Firestore is unconfigured or denied.
  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { records, cloudError: err } = await loadHistory();
      setHistory(records);
      setCloudError(err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial load — set state only inside async callbacks, never synchronously.
  useEffect(() => {
    let active = true;
    loadHistory()
      .then(({ records, cloudError: err }) => {
        if (!active) return;
        setHistory(records);
        setCloudError(err);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function togglePlatform(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((p) => p !== id),
    );
  }

  function updateResult(platform: string, content: string) {
    setResults((prev) =>
      prev ? prev.map((r) => (r.platform === platform ? { ...r, content } : r)) : prev,
    );
  }

  function selectHistory(record: GenerationRecord) {
    setBrief(record.brief);
    setSelected(record.platforms);
    setResults(record.results);
    setActiveId(record.id);
    setError(null);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setActiveId(null);
    const submittedBrief = brief.trim();
    const submittedPlatforms = selected;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: submittedBrief, platforms: submittedPlatforms }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ErrorResponse;
        throw new Error(data.error || "Generation failed.");
      }

      const data = (await res.json()) as GenerateResponse;
      setResults(data.results);

      // Persist (localStorage always; Firestore best-effort) and refresh the list.
      try {
        const { record, cloudError: err } = await saveGeneration({
          brief: submittedBrief,
          platforms: submittedPlatforms,
          results: data.results,
        });
        setActiveId(record.id);
        setCloudError(err);
        await refreshHistory();
      } catch {
        // Saving is best-effort; generation already succeeded.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="border-border bg-card/50 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5 text-violet-400" />
            AI content aggregator
          </span>
          <h1 className="text-4xl font-bold tracking-tight">
            One Idea, <span className="text-gradient">Every Format</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Write your idea once. Generate platform-tailored posts for every channel,
            then review and edit before publishing.
          </p>
        </div>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <span
            className={`size-2 rounded-full ${
              isFirebaseConfigured ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {isFirebaseConfigured ? "Firebase connected" : "Firebase not configured"}
        </span>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left rail: composer + history */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="bg-card/60 backdrop-blur">
            <CardContent className="space-y-5 pt-6">
              <BriefForm value={brief} onChange={setBrief} disabled={loading} />
              <PlatformSelector
                selected={selected}
                onToggle={togglePlatform}
                disabled={loading}
              />
              <Button
                onClick={handleGenerate}
                disabled={!canSubmit}
                className="btn-gradient h-11 w-full text-base font-semibold text-white shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" /> Generate
                  </>
                )}
              </Button>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardContent className="pt-6">
              <HistoryPanel
                records={history}
                loading={historyLoading}
                cloudError={cloudError}
                activeId={activeId}
                onSelect={selectHistory}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: results */}
        <div>
          {results && results.length > 0 ? (
            <ReviewDashboard results={results} onChange={updateResult} />
          ) : (
            <Card className="bg-card/30 border-dashed">
              <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
                <div className="bg-card flex size-12 items-center justify-center rounded-2xl">
                  <Wand2 className="text-muted-foreground size-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Your tailored posts will appear here</p>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Write a brief, pick your platforms, and hit Generate. Each post lands
                    in its own editable card.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
