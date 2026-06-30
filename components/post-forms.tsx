"use client";

import { useState } from "react";
import { X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { composePostText } from "@/lib/publishers";
import type { PostDraft } from "@/lib/types";

export function ImageManager({ urls, maxUrls, onChange, disabled, required }: { urls: string[], maxUrls: number, onChange: (urls: string[]) => void, disabled?: boolean, required?: boolean }) {
  const [newUrl, setNewUrl] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://.../image.jpg"
          disabled={disabled || urls.length >= maxUrls}
        />
        <Button
          type="button"
          onClick={() => {
            if (newUrl.trim() && urls.length < maxUrls) {
              onChange([...urls, newUrl.trim()]);
              setNewUrl("");
            }
          }}
          disabled={disabled || !newUrl.trim() || urls.length >= maxUrls}
        >
          Add
        </Button>
      </div>
      <p className="text-muted-foreground text-[11px]">
        {urls.length} / {maxUrls} images added{required && urls.length === 0 ? " (at least one image is required)" : ""}
      </p>
      {urls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {urls.map((u, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt={`Preview ${i + 1}`}
                className="w-full h-24 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                disabled={disabled}
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface PostFormProps {
  draft: PostDraft;
  onChange: (patch: Partial<PostDraft>) => void;
  disabled?: boolean;
}

/** X (Twitter): single text field + hashtags, with a live 280-char counter. */
export function XForm({ draft, onChange, disabled }: PostFormProps) {
  const count = composePostText(draft).length;
  const over = count > 280;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Tweet</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={5}
          disabled={disabled}
          className="bg-background/40 resize-y"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Hashtags</Label>
        <Input
          value={draft.hashtags}
          onChange={(e) => onChange({ hashtags: e.target.value })}
          placeholder="#launch #ai"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Images</Label>
        <ImageManager urls={draft.imageUrls || []} maxUrls={4} onChange={(urls) => onChange({ imageUrls: urls })} disabled={disabled} />
      </div>
      <p
        className={
          over
            ? "text-destructive text-right text-xs font-semibold"
            : "text-muted-foreground text-right text-xs"
        }
      >
        {count} / 280
      </p>
    </div>
  );
}

/** LinkedIn: a single professional body field with a word count. */
export function LinkedInForm({ draft, onChange, disabled }: PostFormProps) {
  const words = draft.text.trim() ? draft.text.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Post body</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={9}
          disabled={disabled}
          className="bg-background/40 resize-y leading-relaxed"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Images</Label>
        <ImageManager urls={draft.imageUrls || []} maxUrls={20} onChange={(urls) => onChange({ imageUrls: urls })} disabled={disabled} />
      </div>
      <p className="text-muted-foreground text-right text-xs">{words} words</p>
    </div>
  );
}

/** Instagram: caption + hashtags + required image URL, with a preview. */
export function InstagramForm({ draft, onChange, disabled }: PostFormProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Caption</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={5}
          disabled={disabled}
          className="bg-background/40 resize-y"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Hashtags</Label>
        <Input
          value={draft.hashtags}
          onChange={(e) => onChange({ hashtags: e.target.value })}
          placeholder="#reels #content #ai"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">
          Images <span className="text-destructive">*</span>
        </Label>
        <ImageManager urls={draft.imageUrls || []} maxUrls={10} onChange={(urls) => onChange({ imageUrls: urls })} disabled={disabled} required />
      </div>
    </div>
  );
}

/** Newsletter: subject line + body field + images */
export function NewsletterForm({ draft, onChange, disabled }: PostFormProps) {
  const words = draft.text.trim() ? draft.text.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Subject Line</Label>
        <Input
          value={draft.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Subject..."
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Newsletter Body</Label>
        <Textarea
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={12}
          disabled={disabled}
          className="bg-background/40 resize-y leading-relaxed"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Images</Label>
        <ImageManager urls={draft.imageUrls || []} maxUrls={10} onChange={(urls) => onChange({ imageUrls: urls })} disabled={disabled} />
      </div>
      <p className="text-muted-foreground text-right text-xs">{words} words</p>
    </div>
  );
}

const FORMS: Record<string, (props: PostFormProps) => React.ReactElement> = {
  x: XForm,
  linkedin: LinkedInForm,
  instagram: InstagramForm,
  newsletter: NewsletterForm,
};

export function PostForm(props: PostFormProps) {
  const Form = FORMS[props.draft.platform] ?? LinkedInForm;
  return <Form {...props} />;
}
