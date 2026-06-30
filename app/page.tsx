"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "firebase/auth";

import { useAuth } from "@/components/auth-provider";
import { BriefForm } from "@/components/brief-form";
import { ConnectionsDialog } from "@/components/connections-dialog";
import { HistoryPanel } from "@/components/history-panel";
import { LoginScreen } from "@/components/login-screen";
import { PlatformSelector } from "@/components/platform-selector";
import { ReviewDashboard } from "@/components/review-dashboard";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isConnected,
  loadCredentials,
  type CredentialsMap,
} from "@/lib/credentials";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  listGenerations,
  saveGeneration,
  setPostState,
  type GenerationRecord,
} from "@/lib/history";
import { PLATFORMS } from "@/lib/platforms";
import { publishPost } from "@/lib/publishers";
import type {
  ErrorResponse,
  GenerateResponse,
  GenerateResult,
  PlatformCredentials,
  PostDraft,
} from "@/lib/types";

function draftsFromResults(
  results: GenerateResult[],
  postStates: GenerationRecord["postStates"] = {},
): PostDraft[] {
  return results.map((r) => {
    const base = {
      platform: r.platform,
      text: r.content,
      hashtags: r.hashtags ?? "",
      imageUrls: [],
    };
    const st = postStates[r.platform];
    if (st?.status === "published") {
      return { ...base, status: "published" as const, url: st.url };
    }
    if (st?.status === "scheduled") {
      return { ...base, status: "scheduled" as const, scheduledAt: st.scheduledAt };
    }
    return { ...base, status: "draft" as const };
  });
}

export default function Home() {
  const { user, loading } = useAuth();

  if (!isFirebaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-muted-foreground max-w-md text-sm">
          Firebase isn&apos;t configured. Add your <code>NEXT_PUBLIC_FIREBASE_*</code>{" "}
          values to <code>.env.local</code> and restart.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </main>
    );
  }

  if (!user) return <LoginScreen />;

  return <Workspace user={user} />;
}

function Workspace({ user }: { user: User }) {
  const uid = user.uid;

  const [brief, setBrief] = useState("");
  const [selected, setSelected] = useState<string[]>(["x", "linkedin", "instagram"]);
  const [drafts, setDrafts] = useState<PostDraft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [credentials, setCredentials] = useState<CredentialsMap>({});
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const canSubmit = brief.trim().length > 0 && selected.length > 0 && !loading;
  const connectedCount = PLATFORMS.filter((p) =>
    isConnected(p, credentials[p.id]),
  ).length;

  // Load credentials + history for this user (set state only in async callbacks).
  useEffect(() => {
    let active = true;
    loadCredentials(uid)
      .then((c) => {
        if (active) setCredentials(c);
      })
      .catch(() => {});
    listGenerations(uid)
      .then((h) => {
        if (active) setHistory(h);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uid]);

  function togglePlatform(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((p) => p !== id),
    );
  }

  function updateDraft(platform: string, patch: Partial<PostDraft>) {
    setDrafts((prev) =>
      prev
        ? prev.map((d) => (d.platform === platform ? { ...d, ...patch } : d))
        : prev,
    );
  }

  function selectHistory(record: GenerationRecord) {
    setBrief(record.brief);
    setSelected(record.platforms);
    setDrafts(draftsFromResults(record.results, record.postStates));
    setActiveId(record.id);
    setError(null);
    setHistoryOpen(false);
  }

  function handleCredentialsSaved(platformId: string, creds: PlatformCredentials) {
    setCredentials((prev) => ({ ...prev, [platformId]: creds }));
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
      setDrafts(draftsFromResults(data.results));

      try {
        const id = await saveGeneration(uid, {
          brief: submittedBrief,
          platforms: submittedPlatforms,
          results: data.results,
        });
        if (id) setActiveId(id);
        setHistory(await listGenerations(uid));
      } catch {
        // Saving history is best-effort.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDrafts(null);
    } finally {
      setLoading(false);
    }
  }

  async function doPublish(draft: PostDraft) {
    const label = PLATFORMS.find((p) => p.id === draft.platform)?.label ?? draft.platform;
    // Guard against double-posting.
    if (draft.status === "published") {
      toast.info(`${label}: already published.`);
      return;
    }
    if (draft.status === "publishing") return;

    updateDraft(draft.platform, { status: "publishing", message: undefined });
    const result = await publishPost(draft, credentials[draft.platform]);
    if (result.ok) {
      updateDraft(draft.platform, {
        status: "published",
        url: result.url,
        message: result.message,
        scheduledAt: undefined,
      });
      if (activeId) {
        try {
          await setPostState(uid, activeId, draft.platform, {
            status: "published",
            url: result.url,
            publishedAt: Date.now(),
          });
        } catch {
          // history persistence is best-effort
        }
      }
      toast.success(`${label}: ${result.message}`);
    } else {
      updateDraft(draft.platform, { status: "failed", message: result.message });
      toast.error(`${label}: ${result.message}`);
    }
  }

  function publishOne(platform: string) {
    const draft = drafts?.find((d) => d.platform === platform);
    if (draft) void doPublish(draft);
  }

  async function publishApproved() {
    const ready = (drafts ?? []).filter(
      (d) => d.status === "approved" && isConnected(d.platform, credentials[d.platform]),
    );
    for (const draft of ready) {
      await doPublish(draft);
    }
  }

  function scheduleOne(platform: string, whenMs: number) {
    const label = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
    if (whenMs <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    if (!isConnected(platform, credentials[platform])) {
      toast.error(`Connect ${label} first.`);
      return;
    }
    updateDraft(platform, { status: "scheduled", scheduledAt: whenMs, message: undefined });
    if (activeId) {
      void setPostState(uid, activeId, platform, {
        status: "scheduled",
        scheduledAt: whenMs,
      }).catch(() => {});
    }
    toast.success(`${label}: scheduled for ${new Date(whenMs).toLocaleString()}.`);
  }

  function cancelSchedule(platform: string) {
    updateDraft(platform, { status: "approved", scheduledAt: undefined });
    if (activeId) void setPostState(uid, activeId, platform, null).catch(() => {});
  }

  // Auto-publish scheduled posts whose time has arrived (while the app is open).
  // A real deployment would run this server-side on a cron/queue.
  const tickRef = useRef<() => void>(() => {});
  // Keep the tick closure current (assigning refs in an effect is allowed).
  useEffect(() => {
    tickRef.current = () => {
      const now = Date.now();
      (drafts ?? []).forEach((d) => {
        if (
          d.status === "scheduled" &&
          d.scheduledAt &&
          d.scheduledAt <= now &&
          isConnected(d.platform, credentials[d.platform])
        ) {
          void doPublish({ ...d, status: "approved" });
        }
      });
    };
  });
  useEffect(() => {
    const id = setInterval(() => tickRef.current(), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <TopBar
        onOpenConnections={() => setConnectionsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        connectedCount={connectedCount}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:py-10">
        {/* Composer */}
        <Card className="bg-card/60 backdrop-blur">
          <CardContent className="space-y-6 pt-6">
            <BriefForm value={brief} onChange={setBrief} disabled={loading} />
            <PlatformSelector
              selected={selected}
              onToggle={togglePlatform}
              disabled={loading}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={!canSubmit}
                className="h-11 px-6 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" /> Generate posts
                  </>
                )}
              </Button>
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {drafts && drafts.length > 0 ? (
          <ReviewDashboard
            drafts={drafts}
            credentials={credentials}
            onChange={updateDraft}
            onPublishOne={publishOne}
            onScheduleOne={scheduleOne}
            onCancelSchedule={cancelSchedule}
            onPublishApproved={publishApproved}
            onConnect={() => setConnectionsOpen(true)}
          />
        ) : (
          <Card className="bg-card/30 border-dashed">
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <div className="bg-card flex size-12 items-center justify-center rounded-2xl">
                <Wand2 className="text-muted-foreground size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Your tailored posts will appear here</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Write a brief, pick platforms, and hit Generate. Edit each post in its
                  own form, approve, then publish.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <ConnectionsDialog
        open={connectionsOpen}
        onOpenChange={setConnectionsOpen}
        uid={uid}
        credentials={credentials}
        onSaved={handleCredentialsSaved}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recent generations</DialogTitle>
            <DialogDescription>
              Click any past generation to load its posts back into the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[200px]">
            <HistoryPanel
              records={history}
              loading={historyLoading}
              configured
              activeId={activeId}
              onSelect={selectHistory}
              hideHeader
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
