"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isConnected, saveCredentials, type CredentialsMap } from "@/lib/credentials";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import type { PlatformCredentials } from "@/lib/types";

interface ConnectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid: string;
  credentials: CredentialsMap;
  onSaved: (platformId: string, creds: PlatformCredentials) => void;
}

function PlatformCredentialForm({
  platform,
  uid,
  initial,
  onSaved,
}: {
  platform: Platform;
  uid: string;
  initial: PlatformCredentials | undefined;
  onSaved: (platformId: string, creds: PlatformCredentials) => void;
}) {
  // Controlled state, seeded once from the saved credentials.
  const [values, setValues] = useState<PlatformCredentials>(() => {
    const seed: PlatformCredentials = {};
    for (const f of platform.credentialFields) seed[f.key] = initial?.[f.key] ?? "";
    return seed;
  });
  const [saving, setSaving] = useState(false);

  const connected = isConnected(platform, values);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const creds: PlatformCredentials = {};
    for (const f of platform.credentialFields) creds[f.key] = (values[f.key] ?? "").trim();
    setSaving(true);
    try {
      await saveCredentials(uid, platform.id, creds);
      onSaved(platform.id, creds);
      toast.success(`${platform.label} credentials saved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save credentials.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="border-border rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: platform.accent }}
        >
          {platform.icon}
        </span>
        <span className="font-medium">{platform.label}</span>
        {connected ? (
          <Badge className="ml-auto gap-1 bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="size-3" /> Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground ml-auto">
            Not connected
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {platform.credentialFields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${platform.id}-${field.key}`} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={`${platform.id}-${field.key}`}
              type={field.secret === false ? "text" : "password"}
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}

export function ConnectionsDialog({
  open,
  onOpenChange,
  uid,
  credentials,
  onSaved,
}: ConnectionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Platform connections</DialogTitle>
          <DialogDescription>
            Save your API credentials for each platform. Stored privately under your
            account in Firestore and used when you publish.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <div className="space-y-5">
            {PLATFORMS.map((platform) => (
              // Re-seed the controlled form if saved creds change while open.
              <PlatformCredentialForm
                key={`${platform.id}:${JSON.stringify(credentials[platform.id] ?? {})}`}
                platform={platform}
                uid={uid}
                initial={credentials[platform.id]}
                onSaved={onSaved}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
